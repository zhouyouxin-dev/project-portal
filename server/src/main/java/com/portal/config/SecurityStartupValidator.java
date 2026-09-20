package com.portal.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 启动期安全自检：生产 profile 下不允许沿用开发默认凭据，
 * 开发 profile 下打印醒目提示，避免默认配置被直接带上线。
 * 放在 bean 初始化阶段执行，不通过则在绑定端口之前就终止启动。
 */
@Component
public class SecurityStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(SecurityStartupValidator.class);

    private static final String DEFAULT_PASSWORD = "admin123";
    private static final String DEV_SECRET_PREFIX = "dev-only-secret";

    private final Environment env;
    private final String adminPassword;
    private final String jwtSecret;

    public SecurityStartupValidator(Environment env,
                                    @Value("${app.admin.password}") String adminPassword,
                                    @Value("${app.jwt.secret}") String jwtSecret) {
        this.env = env;
        this.adminPassword = adminPassword;
        this.jwtSecret = jwtSecret;
    }

    @PostConstruct
    public void validate() {
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");

        if (prod) {
            if (DEFAULT_PASSWORD.equals(adminPassword)) {
                throw new IllegalStateException(
                        "生产环境仍在使用默认管理员密码，请通过环境变量 ADMIN_PASSWORD 设置强密码后重启");
            }
            if (jwtSecret.startsWith(DEV_SECRET_PREFIX)) {
                throw new IllegalStateException(
                        "生产环境仍在使用开发用 JWT 密钥，请通过环境变量 JWT_SECRET 注入随机串后重启");
            }
            log.info("安全自检通过（profile=prod）");
            return;
        }

        log.warn("");
        log.warn("┌──────────────────────────────────────────────────────────┐");
        log.warn("│  当前以 dev profile 运行：H2 控制台已开启（仅本机可访问） │");
        log.warn("│  上线前请设置 SPRING_PROFILES_ACTIVE=prod                │");
        log.warn("│  并注入 ADMIN_PASSWORD 与 JWT_SECRET                     │");
        log.warn("└──────────────────────────────────────────────────────────┘");
        log.warn("");
    }
}
