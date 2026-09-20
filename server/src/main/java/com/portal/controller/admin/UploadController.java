package com.portal.controller.admin;

import com.portal.common.FileTypeDetector;
import com.portal.common.GlobalExceptionHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/** 封面图与获奖证书图片上传。大体积材料（PPT / 视频）走 AttachmentController */
@RestController
@RequestMapping("/api/admin")
public class UploadController {

    /**
     * 图片单独限 5MB。
     * <p>
     * 注意这个判断不能省：为了让 300MB 的演示视频通过，
     * spring.servlet.multipart.max-file-size 已经放宽到 320MB，
     * 而那是全局唯一的一个值 —— 图片的上限只能在这里自己守。
     */
    private static final long MAX_SIZE = 5 * 1024 * 1024;

    private final Path uploadDir;

    public UploadController(@Value("${app.upload-dir}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new GlobalExceptionHandler.BadRequestException("文件不能为空");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new GlobalExceptionHandler.BadRequestException("图片大小不能超过 5MB");
        }

        Files.createDirectories(uploadDir);

        // 按文件头判定真实格式，而非听信客户端提交的扩展名，
        // 落盘文件名与扩展名都由服务端生成，杜绝伪装文件与路径穿越
        try (InputStream in = new BufferedInputStream(file.getInputStream())) {
            in.mark(64);
            byte[] header = in.readNBytes(FileTypeDetector.HEADER_BYTES);
            FileTypeDetector.Detected detected = FileTypeDetector.detectImageByMagic(header);
            if (detected == null) {
                throw new GlobalExceptionHandler.BadRequestException("仅支持 jpg / png / webp 格式的图片");
            }
            in.reset();

            String filename = UUID.randomUUID().toString().replace("-", "") + "." + detected.ext();
            Files.copy(in, uploadDir.resolve(filename));
            return Map.of("code", 0, "data", Map.of("url", "/uploads/" + filename));
        }
    }
}
