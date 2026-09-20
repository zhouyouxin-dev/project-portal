package com.portal.config;

import com.portal.common.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final boolean h2ConsoleEnabled;
    private final String h2ConsolePath;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          @Value("${spring.h2.console.enabled:false}") boolean h2ConsoleEnabled,
                          @Value("${spring.h2.console.path:/h2-console}") String h2ConsolePath) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.h2ConsoleEnabled = h2ConsoleEnabled;
        this.h2ConsolePath = h2ConsolePath;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // 无会话、无表单登录；认证仅凭 SameSite=Lax 的 HttpOnly Cookie，跨站表单无法携带
        http.csrf(AbstractHttpConfigurer::disable);
        // 纯 JWT 接口不需要匿名身份：关掉之后「未登录」就是 Authentication 为 null，语义清晰
        http.anonymous(AbstractHttpConfigurer::disable);
        http.cors(Customizer.withDefaults());
        http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.headers(h -> {
            // H2 控制台需要同源 iframe；控制台关闭时一律禁止被嵌套，防点击劫持
            if (h2ConsoleEnabled) {
                h.frameOptions(f -> f.sameOrigin());
            } else {
                h.frameOptions(f -> f.deny());
            }
            h.contentTypeOptions(Customizer.withDefaults());
            h.referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN));
        });

        http.authorizeHttpRequests(auth -> {
            if (h2ConsoleEnabled) {
                // 放行给 H2 自己的鉴权，来源限制由 H2ConsoleGuardFilter 兜底（仅本机）
                auth.requestMatchers(h2ConsolePath + "/**").permitAll();
            } else {
                auth.requestMatchers(h2ConsolePath + "/**").denyAll();
            }
            auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
            auth.anyRequest().permitAll();
        });

        http.exceptionHandling(e -> {
            e.authenticationEntryPoint((request, response, ex) ->
                    writeJson(response, HttpStatus.UNAUTHORIZED, "未登录或登录已过期"));
            e.accessDeniedHandler((request, response, ex) ->
                    writeJson(response, HttpStatus.FORBIDDEN, "没有访问权限"));
        });

        if (h2ConsoleEnabled) {
            // 与 JwtAuthFilter 用同一个锚点：两者互不依赖，只要都在认证阶段之前即可
            http.addFilterBefore(new H2ConsoleGuardFilter(h2ConsolePath),
                    UsernamePasswordAuthenticationFilter.class);
        }
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeJson(HttpServletResponse response, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getOutputStream().write(
                ("{\"code\":" + status.value() + ",\"message\":\"" + message + "\"}")
                        .getBytes(StandardCharsets.UTF_8));
    }
}
