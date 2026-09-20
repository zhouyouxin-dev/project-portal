package com.portal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * 项目材料附件：演示 PPT、演示视频等大文件。
 * <p>
 * 只存元信息，字节流落在 {@code app.upload-dir} 下，文件名由服务端用 UUID 生成。
 * 删除记录时必须同步删磁盘文件，否则几百 MB 的孤儿文件会迅速堆满磁盘
 * （见 AttachmentService 的 after-commit 清理）。
 */
@Entity
@Table(name = "attachments")
public class Attachment {

    public static final String KIND_PPT = "ppt";
    public static final String KIND_VIDEO = "video";
    public static final String KIND_DOC = "doc";
    public static final String KIND_OTHER = "other";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 20)
    private String kind = KIND_OTHER;

    /** 用户上传时的文件名，仅用于展示与下载命名，绝不参与路径拼接 */
    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    /** 实际落盘名：UUID + 服务端判定的扩展名 */
    @Column(name = "stored_name", nullable = false, length = 80)
    private String storedName;

    /** 服务端按文件头判定后回写，不采信客户端提交的 Content-Type */
    @Column(name = "content_type", length = 120)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes = 0L;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public void setStoredName(String storedName) {
        this.storedName = storedName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
