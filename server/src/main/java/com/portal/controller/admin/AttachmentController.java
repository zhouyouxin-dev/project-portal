package com.portal.controller.admin;

import com.portal.service.AttachmentService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 项目材料（演示 PPT / 演示视频）的上传与删除。
 * 路径在 /api/admin/** 下，由 SecurityConfig 的 hasRole("ADMIN") 统一保护。
 */
@RestController
@RequestMapping("/api/admin/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping
    public Map<String, Object> upload(@RequestParam("projectId") Long projectId,
                                      @RequestParam("kind") String kind,
                                      @RequestParam("file") MultipartFile file) throws IOException {
        return Map.of("code", 0, "data", attachmentService.upload(projectId, kind, file));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return Map.of("code", 0, "message", "已删除");
    }
}
