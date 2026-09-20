package com.portal.repository;

import com.portal.entity.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    @EntityGraph(attributePaths = "tags")
    Optional<Project> findBySlug(String slug);

    /** 与 findById 等价，额外一并加载 tags（Spring Data 会忽略 find 与 By 之间的描述性词） */
    @EntityGraph(attributePaths = "tags")
    Optional<Project> findWithTagsById(Long id);

    boolean existsBySlug(String slug);

    // ── 前台筛选面板的候选项：始终基于全部已发布项目，不受当前筛选条件影响 ──
    // 字面量与 Project.VISIBILITY_PUBLISHED 保持一致

    @Query("select distinct p.year from Project p where p.visibility = 'published' order by p.year desc")
    List<Integer> findPublishedYears();

    @Query("select distinct p.type from Project p where p.visibility = 'published' order by p.type")
    List<String> findPublishedTypes();

    @Query("select distinct t.name from Project p join p.tags t where p.visibility = 'published' order by t.name")
    List<String> findPublishedTagNames();

    // 级别与等级不做 order by：字典序（international < municipal < national）与实际高低无关，
    // 排序交给 Service 按 Award.LEVELS / GRADES 的声明顺序处理
    @Query("select distinct a.level from Project p join p.awards a where p.visibility = 'published'")
    List<String> findPublishedAwardLevels();

    @Query("select distinct a.grade from Project p join p.awards a where p.visibility = 'published'")
    List<String> findPublishedAwardGrades();

    @Query("select count(p) from Project p where p.visibility = 'published'")
    long countPublished();

    /** count(distinct p)：一个项目拿了两个国家级奖也只计一次 */
    @Query("""
            select count(distinct p) from Project p join p.awards a
            where p.visibility = 'published' and a.level = :level
            """)
    long countPublishedByAwardLevel(@Param("level") String level);
}
