package com.portal.service;

import com.portal.common.GlobalExceptionHandler;
import com.portal.dto.Dtos;
import com.portal.entity.Tag;
import com.portal.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public List<Dtos.TagDto> list() {
        return tagRepository.findAll().stream()
                .map(Dtos.TagDto::from)
                .toList();
    }

    @Transactional
    public Dtos.TagDto create(Dtos.TagRequest req) {
        String name = req.name().trim();
        if (tagRepository.existsByName(name)) {
            throw new GlobalExceptionHandler.ConflictException("标签已存在: " + name);
        }
        Tag tag = new Tag(name, sanitizeCategory(req.category()));
        return Dtos.TagDto.from(tagRepository.save(tag));
    }

    @Transactional
    public Dtos.TagDto update(Long id, Dtos.TagRequest req) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("标签不存在"));
        String name = req.name().trim();
        tagRepository.findByName(name).filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new GlobalExceptionHandler.ConflictException("标签已存在: " + name);
                });
        tag.setName(name);
        tag.setCategory(sanitizeCategory(req.category()));
        return Dtos.TagDto.from(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.NotFoundException("标签不存在"));
        // 先解除与项目的关联，避免外键约束失败
        tag.getProjects().forEach(p -> p.getTags().remove(tag));
        tagRepository.delete(tag);
    }

    private static String sanitizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "tech";
        }
        String v = category.trim().toLowerCase(Locale.ROOT);
        return switch (v) {
            case "tech", "type", "domain" -> v;
            default -> "tech";
        };
    }
}
