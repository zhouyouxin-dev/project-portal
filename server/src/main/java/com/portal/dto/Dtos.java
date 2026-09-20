package com.portal.dto;

import com.portal.entity.Attachment;
import com.portal.entity.Award;
import com.portal.entity.Project;
import com.portal.entity.Tag;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public final class Dtos {

    private Dtos() {
    }

    public record TagDto(Long id, String name, String category) {
        public static TagDto from(Tag tag) {
            return new TagDto(tag.getId(), tag.getName(), tag.getCategory());
        }
    }

    // ── 获奖记录 ─────────────────────────────────────────────

    public record AwardDto(Long id, String competition, String level, String grade,
                           String organizer, LocalDate awardDate, String certificateUrl) {

        public static AwardDto from(Award a) {
            return new AwardDto(a.getId(), a.getCompetition(), a.getLevel(), a.getGrade(),
                    a.getOrganizer(), a.getAwardDate(), a.getCertificateUrl());
        }
    }

    /**
     * 获奖记录按「级别从高到低 → 等级从高到低」排序，
     * 前端直接取第 0 条当作代表奖项展示，不必自己实现权重比较。
     */
    private static final Comparator<Award> AWARD_ORDER =
            Comparator.comparingInt((Award a) -> Award.levelRank(a.getLevel()))
                    .thenComparingInt(a -> Award.gradeRank(a.getGrade()))
                    .thenComparing(Award::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()));

    private static List<AwardDto> awardsOf(Project p) {
        return p.getAwards().stream().sorted(AWARD_ORDER).map(AwardDto::from).toList();
    }

    // ── 附件 ─────────────────────────────────────────────────

    public record AttachmentDto(Long id, String kind, String originalName,
                                String contentType, Long sizeBytes, String url) {

        public static AttachmentDto from(Attachment a) {
            return new AttachmentDto(a.getId(), a.getKind(), a.getOriginalName(),
                    a.getContentType(), a.getSizeBytes(), "/api/files/" + a.getId());
        }
    }

    private static List<AttachmentDto> attachmentsOf(Project p) {
        return p.getAttachments().stream().map(AttachmentDto::from).toList();
    }

    /** 前台筛选面板的候选项与总览统计（始终基于全部已发布项目） */
    public record Facets(List<Integer> years, List<String> types, List<String> tags,
                         List<String> levels, List<String> grades,
                         long total, long national, long provincial) {
    }

    /** 列表条目所需字段（不含 content 大字段） */
    public record ProjectSummary(
            Long id,
            String slug,
            String title,
            String summary,
            String coverUrl,
            String type,
            String status,
            Integer year,
            String members,
            String advisors,
            String department,
            Integer sortOrder,
            String visibility,
            List<String> tags,
            List<AwardDto> awards,
            List<AttachmentDto> attachments,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        public static ProjectSummary from(Project p) {
            return new ProjectSummary(
                    p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                    p.getCoverUrl(), p.getType(), p.getStatus(), p.getYear(),
                    p.getMembers(), p.getAdvisors(), p.getDepartment(),
                    p.getSortOrder(), p.getVisibility(),
                    p.getTags().stream().map(Tag::getName).sorted().toList(),
                    awardsOf(p), attachmentsOf(p),
                    p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    /** 详情字段（含 Markdown 内容） */
    public record ProjectDetail(
            Long id,
            String slug,
            String title,
            String summary,
            String coverUrl,
            String type,
            String status,
            Integer year,
            String demoUrl,
            String repoUrl,
            String members,
            String advisors,
            String department,
            String content,
            Integer sortOrder,
            String visibility,
            List<TagDto> tags,
            List<AwardDto> awards,
            List<AttachmentDto> attachments,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        public static ProjectDetail from(Project p) {
            return new ProjectDetail(
                    p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                    p.getCoverUrl(), p.getType(), p.getStatus(), p.getYear(),
                    p.getDemoUrl(), p.getRepoUrl(),
                    p.getMembers(), p.getAdvisors(), p.getDepartment(),
                    p.getContent(), p.getSortOrder(), p.getVisibility(),
                    p.getTags().stream().map(TagDto::from)
                            .sorted(Comparator.comparing(TagDto::name)).toList(),
                    awardsOf(p), attachmentsOf(p),
                    p.getCreatedAt(), p.getUpdatedAt());
        }
    }

    /** 新建/编辑项目请求 */
    public record ProjectRequest(
            @jakarta.validation.constraints.NotBlank(message = "标题不能为空") String title,
            @jakarta.validation.constraints.NotBlank(message = "slug 不能为空")
            @jakarta.validation.constraints.Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                    message = "slug 仅支持小写字母、数字与连字符")
            String slug,
            String summary,
            String coverUrl,
            String type,
            String status,
            @jakarta.validation.constraints.NotNull(message = "年份不能为空") Integer year,
            String demoUrl,
            String repoUrl,
            String members,
            String advisors,
            String department,
            String content,
            Integer sortOrder,
            String visibility,
            List<Long> tagIds,
            @jakarta.validation.Valid List<AwardRequest> awards) {
    }

    /** 项目表单内嵌的获奖记录。id 不带：每次保存都整组重建 */
    public record AwardRequest(
            @jakarta.validation.constraints.NotBlank(message = "比赛名称不能为空")
            String competition,
            String level,
            String grade,
            String organizer,
            LocalDate awardDate,
            String certificateUrl) {
    }

    public record TagRequest(
            @jakarta.validation.constraints.NotBlank(message = "标签名不能为空") String name,
            String category) {
    }

    public record LoginRequest(
            @jakarta.validation.constraints.NotBlank(message = "用户名不能为空") String username,
            @jakarta.validation.constraints.NotBlank(message = "密码不能为空") String password) {
    }

    public record UserDto(String username) {
    }
}
