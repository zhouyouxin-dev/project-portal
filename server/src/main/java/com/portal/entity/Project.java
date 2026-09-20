package com.portal.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "projects", uniqueConstraints = @UniqueConstraint(columnNames = "slug"))
public class Project {

    public static final String VISIBILITY_PUBLISHED = "published";
    public static final String VISIBILITY_DRAFT = "draft";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 140)
    private String slug;

    @Column(length = 300)
    private String summary;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 项目类型：web / miniapp / tool / ai 等 */
    @Column(nullable = false, length = 20)
    private String type = "web";

    /** 状态：ongoing / done / archived */
    @Column(nullable = false, length = 20)
    private String status = "done";

    @Column(name = "project_year", nullable = false)
    private Integer year;

    @Column(name = "demo_url", length = 500)
    private String demoUrl;

    @Column(name = "repo_url", length = 500)
    private String repoUrl;

    /** 团队成员，逗号分隔：「张三, 李四, 王五」 */
    @Column(length = 300)
    private String members;

    /** 指导教师，逗号分隔 */
    @Column(length = 200)
    private String advisors;

    /** 所属学院 / 单位 */
    @Column(length = 120)
    private String department;

    /** Markdown 格式详情内容 */
    @Column(columnDefinition = "CLOB")
    private String content;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 可见性：published（公开）/ draft（草稿） */
    @Column(nullable = false, length = 20)
    private String visibility = VISIBILITY_PUBLISHED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // LAZY + 查询侧显式 fetch join，避免列表接口按项目条数逐个查标签（N+1）
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "project_tags",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    /*
      awards / attachments 刻意不做 fetch join：tags 已经占用了唯一一个 fetch join 名额，
      再并上两个集合就是三重笛卡尔积。改用 @BatchSize，列表页 N 个项目只多两条 IN 查询，
      比 N+1 好得多，也绕开了多个 bag 同时 fetch 的 MultipleBagFetchException。
      注意 open-in-view=false，遍历这两个集合必须在 @Transactional 方法内完成。
     */
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @BatchSize(size = 32)
    private List<Award> awards = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @BatchSize(size = 32)
    private List<Attachment> attachments = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getDemoUrl() {
        return demoUrl;
    }

    public void setDemoUrl(String demoUrl) {
        this.demoUrl = demoUrl;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Set<Tag> getTags() {
        return tags;
    }

    public void setTags(Set<Tag> tags) {
        this.tags = tags;
    }

    public String getMembers() {
        return members;
    }

    public void setMembers(String members) {
        this.members = members;
    }

    public String getAdvisors() {
        return advisors;
    }

    public void setAdvisors(String advisors) {
        this.advisors = advisors;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<Award> getAwards() {
        return awards;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    /*
      下面几个方法都在原集合实例上增删，而不是把字段指向一个新 List。
      orphanRemoval 依赖 Hibernate 持有的那个集合代理，一旦替换引用就会抛
      「A collection with cascade=all-delete-orphan was no longer referenced」。
     */

    /** 编辑项目时整组替换获奖记录：旧记录由 orphanRemoval 删除 */
    public void replaceAwards(List<Award> next) {
        this.awards.clear();
        for (Award a : next) {
            a.setProject(this);
            this.awards.add(a);
        }
    }

    public void addAttachment(Attachment attachment) {
        attachment.setProject(this);
        this.attachments.add(attachment);
    }

    public void removeAttachment(Attachment attachment) {
        this.attachments.remove(attachment);
    }
}
