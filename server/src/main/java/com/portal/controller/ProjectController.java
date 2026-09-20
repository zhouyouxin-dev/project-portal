package com.portal.controller;

import com.portal.dto.Dtos;
import com.portal.service.ProjectService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /** 公开项目列表：支持 type/status/year/tag/level/grade/q 组合筛选，带轻量 ETag 缓存 */
    @GetMapping
    public ResponseEntity<List<Dtos.ProjectSummary>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String q) {

        List<Dtos.ProjectSummary> data =
                projectService.listPublished(type, status, year, tag, level, grade, q);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).mustRevalidate())
                .eTag("\"" + Integer.toHexString(data.hashCode()) + "\"")
                .body(data);
    }

    /** 筛选面板候选项：年份 / 赛道 / 标签 / 赛事级别 / 获奖等级。与列表分离，避免筛选后选项自我收缩 */
    @GetMapping("/facets")
    public ResponseEntity<Dtos.Facets> facets() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).mustRevalidate())
                .body(projectService.facets());
    }

    /** 项目详情（公开） */
    @GetMapping("/{slug}")
    public Map<String, Object> detail(@PathVariable String slug) {
        return Map.of("code", 0, "data", projectService.getPublishedBySlug(slug));
    }
}
