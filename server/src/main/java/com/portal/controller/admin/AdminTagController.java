package com.portal.controller.admin;

import com.portal.dto.Dtos;
import com.portal.service.TagService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/tags")
public class AdminTagController {

    private final TagService tagService;

    public AdminTagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("code", 0, "data", tagService.list());
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody Dtos.TagRequest req) {
        return Map.of("code", 0, "data", tagService.create(req));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id,
                                      @Valid @RequestBody Dtos.TagRequest req) {
        return Map.of("code", 0, "data", tagService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        tagService.delete(id);
        return Map.of("code", 0, "message", "已删除");
    }
}
