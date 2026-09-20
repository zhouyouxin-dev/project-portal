package com.portal.service;

import com.portal.common.GlobalExceptionHandler;
import com.portal.dto.Dtos;
import com.portal.entity.Award;
import com.portal.entity.Project;
import com.portal.entity.Tag;
import com.portal.repository.ProjectRepository;
import com.portal.repository.TagRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    /** 赛道分类。改这里要同步改前端 types/index.ts 的 PROJECT_TYPES */
    private static final List<String> TYPES = List.of(
            "ai", "software", "hardware", "iot", "bigdata", "business", "other");

    private static final List<String> STATUSES = List.of("ongoing", "done", "archived");

    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;
    private final AttachmentService attachmentService;

    public ProjectService(ProjectRepository projectRepository, TagRepository tagRepository,
                          AttachmentService attachmentService) {
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.attachmentService = attachmentService;
    }

    /** 公开列表：仅 published，支持多维筛选 */
    @Transactional(readOnly = true)
    public List<Dtos.ProjectSummary> listPublished(String type, String status, Integer year,
                                                   String tag, String level, String grade, String q) {
        Specification<Project> spec = buildSpec(true, type, status, year, tag, level, grade, q);
        return toSummaries(projectRepository.findAll(spec, defaultSort()));
    }

    /** 前台筛选面板的候选项，始终覆盖全部已发布项目，不随当前筛选结果收缩 */
    @Transactional(readOnly = true)
    public Dtos.Facets facets() {
        return new Dtos.Facets(
                projectRepository.findPublishedYears(),
                sortByRank(projectRepository.findPublishedTypes(), ProjectService::typeRank),
                projectRepository.findPublishedTagNames(),
                sortByRank(projectRepository.findPublishedAwardLevels(), Award::levelRank),
                sortByRank(projectRepository.findPublishedAwardGrades(), Award::gradeRank),
                projectRepository.countPublished(),
                projectRepository.countPublishedByAwardLevel("national"),
                projectRepository.countPublishedByAwardLevel("provincial"));
    }

    /** 后台列表：全部项目 */
    @Transactional(readOnly = true)
    public List<Dtos.ProjectSummary> listAll() {
        Specification<Project> spec = buildSpec(false, null, null, null, null, null, null, null);
        return toSummaries(projectRepository.findAll(spec, defaultSort()));
    }

    @Transactional(readOnly = true)
    public Dtos.ProjectDetail getPublishedBySlug(String slug) {
        Project p = projectRepository.findBySlug(slug)
                .filter(x -> Project.VISIBILITY_PUBLISHED.equals(x.getVisibility()))
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("项目不存在"));
        return Dtos.ProjectDetail.from(p);
    }

    @Transactional(readOnly = true)
    public Dtos.ProjectDetail getById(Long id) {
        Project p = projectRepository.findWithTagsById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("项目不存在"));
        return Dtos.ProjectDetail.from(p);
    }

    @Transactional
    public Dtos.ProjectDetail create(Dtos.ProjectRequest req) {
        if (projectRepository.existsBySlug(req.slug())) {
            throw new GlobalExceptionHandler.ConflictException("slug 已存在: " + req.slug());
        }
        Project p = new Project();
        applyRequest(p, req);
        return Dtos.ProjectDetail.from(projectRepository.save(p));
    }

    @Transactional
    public Dtos.ProjectDetail update(Long id, Dtos.ProjectRequest req) {
        Project p = projectRepository.findWithTagsById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("项目不存在"));
        projectRepository.findBySlug(req.slug()).filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new GlobalExceptionHandler.ConflictException("slug 已存在: " + req.slug());
                });
        applyRequest(p, req);
        return Dtos.ProjectDetail.from(projectRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("项目不存在"));
        // 附件集合是懒加载的，必须在事务内读出来登记；实际删文件等事务提交后才发生
        attachmentService.scheduleFilesCleanup(p);
        projectRepository.delete(p);
    }

    private void applyRequest(Project p, Dtos.ProjectRequest req) {
        p.setTitle(req.title().trim());
        p.setSlug(req.slug().trim().toLowerCase(Locale.ROOT));
        p.setSummary(trimToNull(req.summary()));
        p.setCoverUrl(trimToNull(req.coverUrl()));
        p.setType(sanitize(req.type(), "other", TYPES));
        p.setStatus(sanitize(req.status(), "done", STATUSES));
        p.setYear(req.year());
        p.setDemoUrl(trimToNull(req.demoUrl()));
        p.setRepoUrl(trimToNull(req.repoUrl()));
        p.setMembers(trimToNull(req.members()));
        p.setAdvisors(trimToNull(req.advisors()));
        p.setDepartment(trimToNull(req.department()));
        p.setContent(req.content());
        p.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        p.setVisibility(Project.VISIBILITY_DRAFT.equals(req.visibility()) ? Project.VISIBILITY_DRAFT
                : Project.VISIBILITY_PUBLISHED);
        p.setTags(resolveTags(req.tagIds()));
        p.replaceAwards(buildAwards(req.awards()));
    }

    /** 获奖记录每次保存整组重建，旧记录由 orphanRemoval 清掉 */
    private static List<Award> buildAwards(List<Dtos.AwardRequest> requests) {
        List<Award> awards = new ArrayList<>();
        if (requests == null) {
            return awards;
        }
        int order = 0;
        for (Dtos.AwardRequest r : requests) {
            if (r == null || r.competition() == null || r.competition().isBlank()) {
                continue;
            }
            Award a = new Award();
            a.setCompetition(r.competition().trim());
            a.setLevel(sanitize(r.level(), "school", Award.LEVELS));
            a.setGrade(sanitize(r.grade(), "third", Award.GRADES));
            a.setOrganizer(trimToNull(r.organizer()));
            a.setAwardDate(r.awardDate());
            a.setCertificateUrl(trimToNull(r.certificateUrl()));
            a.setSortOrder(order++);
            awards.add(a);
        }
        return awards;
    }

    /** 一次性取回全部标签，避免按 id 逐个查询 */
    private LinkedHashSet<Tag> resolveTags(List<Long> tagIds) {
        LinkedHashSet<Tag> result = new LinkedHashSet<>();
        if (tagIds == null || tagIds.isEmpty()) {
            return result;
        }
        Map<Long, Tag> found = tagRepository.findAllById(tagIds).stream()
                .collect(Collectors.toMap(Tag::getId, Function.identity()));
        for (Long id : tagIds) {
            Tag tag = found.get(id);
            if (tag == null) {
                throw new GlobalExceptionHandler.BadRequestException("标签不存在: id=" + id);
            }
            result.add(tag);
        }
        return result;
    }

    /**
     * 按 level / grade 筛选要 join awards，一个项目有多条获奖记录就会命中多行。
     * 这里不能用 query.distinct(true)（content 是 CLOB，H2 会在 SELECT DISTINCT 上报错，
     * 见 buildSpec 里的注释），改在结果集上按 id 去重，顺序仍由 SQL 的 order by 决定。
     */
    private static List<Dtos.ProjectSummary> toSummaries(List<Project> rows) {
        Map<Long, Project> unique = new LinkedHashMap<>();
        for (Project p : rows) {
            unique.putIfAbsent(p.getId(), p);
        }
        return unique.values().stream().map(Dtos.ProjectSummary::from).toList();
    }

    private Specification<Project> buildSpec(boolean publishedOnly, String type, String status,
                                             Integer year, String tag, String level, String grade,
                                             String q) {
        return (root, query, cb) -> {
            // 一并抓取标签，把「每个项目一次查标签」的 N+1 收敛成单条查询。
            // 这里刻意不调用 query.distinct(true)：Hibernate 6 已会自动对 join fetch 的
            // 根实体去重，而真加上 SELECT DISTINCT 反而会因为 content 是 CLOB 让 H2 报错。
            // 计数查询不能带 fetch join，需要跳过。
            // awards / attachments 不在这里 fetch，由实体上的 @BatchSize 批量补齐。
            boolean countQuery = query != null
                    && (query.getResultType() == Long.class || query.getResultType() == long.class);
            if (!countQuery) {
                root.fetch("tags", JoinType.LEFT);
            }

            List<Predicate> ps = new ArrayList<>();
            if (publishedOnly) {
                ps.add(cb.equal(root.get("visibility"), Project.VISIBILITY_PUBLISHED));
            }
            if (notBlank(type)) {
                ps.add(cb.equal(root.get("type"), type));
            }
            if (notBlank(status)) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (year != null) {
                ps.add(cb.equal(root.get("year"), year));
            }
            if (notBlank(tag)) {
                // 独立 join 用于筛选：复用上面的 fetch join 会导致结果里只剩匹配的那一个标签
                ps.add(cb.equal(root.join("tags", JoinType.INNER).get("name"), tag));
            }
            if (notBlank(level) || notBlank(grade)) {
                // level 与 grade 共用一个 join：两者同时给出时语义是「同一条获奖记录既是国家级又是一等奖」，
                // 分开 join 会变成「有国家级的奖，且有某个一等奖」，那不是用户要的结果
                var awardJoin = root.join("awards", JoinType.INNER);
                if (notBlank(level)) {
                    ps.add(cb.equal(awardJoin.get("level"), level));
                }
                if (notBlank(grade)) {
                    ps.add(cb.equal(awardJoin.get("grade"), grade));
                }
            }
            if (notBlank(q)) {
                String kw = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("title")), kw),
                        cb.like(cb.lower(root.get("summary")), kw),
                        cb.like(cb.lower(root.get("members")), kw),
                        cb.like(cb.lower(root.get("advisors")), kw)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
    }

    private Sort defaultSort() {
        return Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.desc("createdAt"));
    }

    private static int typeRank(String type) {
        int i = TYPES.indexOf(type);
        return i < 0 ? TYPES.size() : i;
    }

    /** 按声明顺序而非字典序排列：international / national / provincial 的字母序与实际高低无关 */
    private static List<String> sortByRank(List<String> values, ToIntFunction<String> rank) {
        return values.stream()
                .sorted(Comparator.comparingInt(rank).thenComparing(Comparator.naturalOrder()))
                .toList();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String sanitize(String value, String fallback, List<String> allowed) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String v = value.trim().toLowerCase(Locale.ROOT);
        return allowed.contains(v) ? v : fallback;
    }
}
