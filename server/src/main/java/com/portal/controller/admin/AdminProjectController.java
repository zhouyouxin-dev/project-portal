package com.portal.controller.admin;

import com.portal.dto.Dtos;
import com.portal.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    private final ProjectService projectService;

    public AdminProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public Map<String, Object> list() {
        List<Dtos.ProjectSummary> data = projectService.listAll();
        return Map.of("code", 0, "data", data);
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        return Map.of("code", 0, "data", projectService.getById(id));
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody Dtos.ProjectRequest req) {
        return Map.of("code", 0, "data", projectService.create(req));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id,
                                      @Valid @RequestBody Dtos.ProjectRequest req) {
        return Map.of("code", 0, "data", projectService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        projectService.delete(id);
        return Map.of("code", 0, "message", "已删除");
    }
}
