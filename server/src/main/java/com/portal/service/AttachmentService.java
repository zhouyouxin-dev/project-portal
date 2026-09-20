package com.portal.service;

import com.portal.common.FileTypeDetector;
import com.portal.common.GlobalExceptionHandler;
import com.portal.dto.Dtos;
import com.portal.entity.Attachment;
import com.portal.entity.Project;
import com.portal.repository.AttachmentRepository;
import com.portal.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AttachmentService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentService.class);

    private static final long MB = 1024L * 1024L;

    /** 分类型限额。multipart 的全局上限只有一个值，真正的分级约束必须在这里守 */
    private static final Map<String, Long> MAX_SIZE = Map.of(
            Attachment.KIND_PPT, 100 * MB,
            Attachment.KIND_VIDEO, 300 * MB,
            Attachment.KIND_DOC, 50 * MB,
            Attachment.KIND_OTHER, 50 * MB);

    private final AttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;
    private final Path uploadDir;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             ProjectRepository projectRepository,
                             @Value("${app.upload-dir}") String uploadDir) {
        this.attachmentRepository = attachmentRepository;
        this.projectRepository = projectRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public Dtos.AttachmentDto upload(Long projectId, String kind, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("项目不存在"));

        String normalizedKind = normalizeKind(kind);
        if (file == null || file.isEmpty()) {
            throw new GlobalExceptionHandler.BadRequestException("文件不能为空");
        }

        long limit = MAX_SIZE.get(normalizedKind);
        if (file.getSize() > limit) {
            throw new GlobalExceptionHandler.BadRequestException(
                    "文件大小不能超过 " + (limit / MB) + "MB");
        }

        String originalName = safeOriginalName(file.getOriginalFilename());
        FileTypeDetector.Detected detected = detect(normalizedKind, file, originalName);

        Files.createDirectories(uploadDir);
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + detected.ext();
        Path target = uploadDir.resolve(storedName);

        // transferTo(File) 而不是 transferTo(Path)：前者走 Part.write，同盘时是一次 rename，
        // 300MB 近乎零成本；后者是逐字节复制。配合 spring.servlet.multipart.location
        // 指向 uploads/.tmp，临时文件与目标目录必定同盘。
        file.transferTo(target.toFile());
        // 落盘已经发生，但事务还没提交：一旦后续回滚，这个文件就成了孤儿，必须一并撤掉
        deleteOnRollback(storedName);

        Attachment attachment = new Attachment();
        attachment.setKind(normalizedKind);
        attachment.setOriginalName(originalName);
        attachment.setStoredName(storedName);
        attachment.setContentType(detected.contentType());
        attachment.setSizeBytes(file.getSize());
        attachment.setSortOrder(project.getAttachments().size());
        project.addAttachment(attachment);

        // 直接保存附件本身，而不是靠 save(project) 级联：
        // project 此刻是托管实体，save 走 em.merge，级联到 transient 关联时
        // Hibernate 放进集合的是副本，手里这个 attachment 的 id 会一直是 null，
        // 而下一行的 AttachmentDto.from 正需要 id 来拼 /api/files/{id}。
        // persist + IDENTITY 则会立即 insert 并回填 id。
        Attachment saved = attachmentRepository.save(attachment);
        return Dtos.AttachmentDto.from(saved);
    }

    @Transactional
    public void delete(Long attachmentId) {
        Attachment attachment = attachmentRepository.findWithProjectById(attachmentId)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("附件不存在"));
        String storedName = attachment.getStoredName();
        // 从集合移除即可：Project.attachments 是 orphanRemoval=true，
        // 事务提交时 Hibernate 会发出 delete。再显式调一次 repository.delete 是冗余的。
        attachment.getProject().removeAttachment(attachment);
        deleteAfterCommit(List.of(storedName));
    }

    /** 项目整体删除时调用：先登记待删文件，等事务提交后再动磁盘 */
    public void scheduleFilesCleanup(Project project) {
        List<String> names = project.getAttachments().stream()
                .map(Attachment::getStoredName)
                .toList();
        if (!names.isEmpty()) {
            deleteAfterCommit(names);
        }
    }

    /** 读取附件用于播放或下载；草稿项目的材料要求已登录 */
    @Transactional(readOnly = true)
    public ReadableAttachment openForRead(Long id) {
        Attachment attachment = attachmentRepository.findWithProjectById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("文件不存在"));

        boolean draft = Project.VISIBILITY_DRAFT.equals(attachment.getProject().getVisibility());
        if (draft && !isAuthenticated()) {
            // 刻意用 404 而不是 401/403：草稿项目连「这个 id 存在」都不该泄露
            throw new GlobalExceptionHandler.NotFoundException("文件不存在");
        }

        Path path = uploadDir.resolve(attachment.getStoredName()).normalize();
        if (!path.startsWith(uploadDir) || !Files.isReadable(path)) {
            throw new GlobalExceptionHandler.NotFoundException("文件不存在");
        }
        return new ReadableAttachment(new FileSystemResource(path),
                attachment.getOriginalName(), attachment.getContentType(), attachment.getSizeBytes());
    }

    public record ReadableAttachment(Resource resource, String originalName,
                                     String contentType, Long sizeBytes) {
    }

    // ── 内部 ─────────────────────────────────────────────────

    private static boolean isAuthenticated() {
        // anonymous 在 SecurityConfig 里已关闭，未登录时 Authentication 直接为 null
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated();
    }

    private static String normalizeKind(String kind) {
        String k = kind == null ? "" : kind.trim().toLowerCase(Locale.ROOT);
        return MAX_SIZE.containsKey(k) ? k : Attachment.KIND_OTHER;
    }

    /** 原始文件名只用于展示与下载命名，去掉任何路径成分后再存 */
    private static String safeOriginalName(String raw) {
        if (raw == null || raw.isBlank()) {
            return "未命名文件";
        }
        String name = raw.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.trim();
        if (name.isEmpty()) {
            return "未命名文件";
        }
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }

    private FileTypeDetector.Detected detect(String kind, MultipartFile file, String originalName)
            throws IOException {
        byte[] header;
        try (InputStream in = new BufferedInputStream(file.getInputStream())) {
            header = in.readNBytes(FileTypeDetector.HEADER_BYTES);
        }

        FileTypeDetector.Detected detected = switch (kind) {
            case Attachment.KIND_VIDEO -> FileTypeDetector.detectVideo(header, originalName);
            case Attachment.KIND_PPT, Attachment.KIND_DOC ->
                    FileTypeDetector.detectDocument(header, originalName);
            default -> {
                FileTypeDetector.Detected doc = FileTypeDetector.detectDocument(header, originalName);
                yield doc != null ? doc : FileTypeDetector.detectImageByMagic(header);
            }
        };

        if (detected == null) {
            throw new GlobalExceptionHandler.BadRequestException(
                    "文件格式不被支持，或与扩展名不符。当前允许：" + allowedHint(kind));
        }
        return detected;
    }

    private static String allowedHint(String kind) {
        return switch (kind) {
            case Attachment.KIND_VIDEO -> String.join(" / ", FileTypeDetector.videoExtensions());
            case Attachment.KIND_PPT, Attachment.KIND_DOC ->
                    String.join(" / ", FileTypeDetector.documentExtensions());
            default -> String.join(" / ", FileTypeDetector.documentExtensions()) + " / "
                    + String.join(" / ", FileTypeDetector.imageExtensions());
        };
    }

    /*
      磁盘清理一律挂在事务边界之后：
      提交前删文件，万一事务回滚，数据库还留着记录、文件却没了；
      而删除失败只记日志不抛异常 —— 数据库已是事实来源，一个删不掉的孤儿文件
      不应该让用户的删除操作报错。
     */
    private void deleteAfterCommit(List<String> storedNames) {
        List<String> names = new ArrayList<>(storedNames);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteQuietly(names);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteQuietly(names);
            }
        });
    }

    private void deleteOnRollback(String storedName) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deleteQuietly(List.of(storedName));
                }
            }
        });
    }

    private void deleteQuietly(List<String> storedNames) {
        for (String name : storedNames) {
            try {
                Path path = uploadDir.resolve(name).normalize();
                if (path.startsWith(uploadDir)) {
                    Files.deleteIfExists(path);
                }
            } catch (IOException | RuntimeException e) {
                log.warn("附件文件删除失败，已成为孤儿文件: {}", name, e);
            }
        }
    }
}
