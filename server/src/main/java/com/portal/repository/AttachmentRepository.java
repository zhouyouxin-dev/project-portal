package com.portal.repository;

import com.portal.entity.Attachment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    /**
     * 一并抓取所属项目：FileController 需要读 project.visibility 判断草稿是否放行，
     * 而 open-in-view=false 下懒加载会在 Service 方法外失效。
     */
    @EntityGraph(attributePaths = "project")
    Optional<Attachment> findWithProjectById(Long id);
}
