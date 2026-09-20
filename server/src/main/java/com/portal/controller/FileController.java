package com.portal.controller;

import com.portal.service.AttachmentService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 附件读取入口。刻意不走 /uploads/** 静态映射：那是完全公开的，
 * 而草稿项目的演示材料需要登录才能拿到（判断在 AttachmentService.openForRead 里）。
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final AttachmentService attachmentService;

    public FileController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    /**
     * 返回类型是 {@code ResponseEntity<Resource>}，这是视频能拖拽进度条的关键：
     * Spring MVC 的 AbstractMessageConverterMethodProcessor 检测到返回值是 Resource 时
     * 会自动补 {@code Accept-Ranges: bytes}，并在请求带 Range 头时把响应转成
     * 206 + ResourceRegion，无需手写分片逻辑。
     * <p>
     * 前提是状态码必须保持 200 进入该分支，所以这里不要改成 ResponseEntity.status(...)。
     */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> get(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean download) {

        AttachmentService.ReadableAttachment file = attachmentService.openForRead(id);

        // filename* 的 RFC 5987 编码交给 ContentDisposition，中文原始名不会乱码
        ContentDisposition disposition = ContentDisposition
                .builder(download ? "attachment" : "inline")
                .filename(file.originalName(), StandardCharsets.UTF_8)
                .build();

        MediaType mediaType = file.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(file.contentType());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", disposition.toString())
                // private：草稿项目的材料不应被中间代理或 CDN 缓存下来
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(file.resource());
    }
}
