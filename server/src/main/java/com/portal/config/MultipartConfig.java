package com.portal.config;

import jakarta.servlet.MultipartConfigElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.web.servlet.MultipartProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 覆盖 multipart 的临时目录。默认落在系统 temp 下，这里有两个实际问题：
 * <ul>
 *   <li><b>跨盘</b>：Windows 上 temp 通常在 C:，项目可能在 D:。
 *       AttachmentService 用 {@code transferTo(File)} 落盘，同盘时是一次 rename，
 *       跨盘则退化成逐字节复制 —— 300MB 的视频要多花好几秒且多一份磁盘写入。</li>
 *   <li><b>目录必须存在</b>：Tomcat 在 {@code parseParts} 里对 location 做 isDirectory 检查，
 *       不存在会直接抛「uploadLocationInvalid」，而不是替你创建。</li>
 * </ul>
 * 临时目录刻意放在上传目录<b>旁边</b>而不是里面：{@code /uploads/**} 是公开的静态映射，
 * 放里面等于把上传中的临时文件也一起暴露出去。
 */
@Configuration
public class MultipartConfig {

    private static final Logger log = LoggerFactory.getLogger(MultipartConfig.class);

    @Bean
    public MultipartConfigElement multipartConfigElement(
            MultipartProperties properties,
            @Value("${app.upload-dir}") String uploadDir) throws IOException {

        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path parent = dir.getParent();
        Path tmp = parent == null
                ? dir.resolve(".tmp")
                : parent.resolve(dir.getFileName() + "-tmp");

        Files.createDirectories(tmp);
        properties.setLocation(tmp.toString());
        log.info("multipart 临时目录: {}", tmp);

        return properties.createMultipartConfig();
    }
}
