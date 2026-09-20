package com.portal.service;

import com.portal.common.GlobalExceptionHandler;
import com.portal.common.JwtService;
import com.portal.common.LoginAttemptGuard;
import com.portal.dto.Dtos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

@Service
public class AuthService {

    private final String adminUsername;
    private final String adminPassword;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptGuard attemptGuard;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthService(@Value("${app.admin.username}") String adminUsername,
                       @Value("${app.admin.password}") String adminPassword,
                       @Value("${app.cookie.secure}") boolean cookieSecure,
                       @Value("${app.cookie.same-site}") String cookieSameSite,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       LoginAttemptGuard attemptGuard) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.attemptGuard = attemptGuard;
    }

    public void login(Dtos.LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        String clientKey = request.getRemoteAddr();
        attemptGuard.assertNotLocked(clientKey);

        // 两个判断都完整执行，不做短路，避免通过响应耗时区分「用户名错」与「密码错」
        boolean userOk = constantTimeEquals(req.username(), adminUsername);
        boolean passOk = passwordMatches(req.password());

        if (!userOk || !passOk) {
            attemptGuard.recordFailure(clientKey);
            throw new GlobalExceptionHandler.BadRequestException("用户名或密码错误");
        }
        attemptGuard.recordSuccess(clientKey);

        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(jwtService.generateToken(adminUsername),
                        Duration.ofSeconds(jwtService.getExpireSeconds())));
    }

    public void logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", Duration.ZERO));
    }

    private String buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from(JwtService.COOKIE_NAME, value)
                .httpOnly(true)              // JS 读不到，XSS 无法窃取令牌
                .secure(cookieSecure)        // 生产走 HTTPS 时为 true
                .sameSite(cookieSameSite)    // Lax：跨站 POST 不携带，阻断 CSRF
                .path("/")
                .maxAge(maxAge)
                .build()
                .toString();
    }

    /** 配置值以 $2 开头时按 BCrypt 哈希比对，否则按明文恒定时间比对 */
    private boolean passwordMatches(String rawPassword) {
        if (adminPassword != null && adminPassword.startsWith("$2")) {
            return passwordEncoder.matches(rawPassword, adminPassword);
        }
        return constantTimeEquals(rawPassword, adminPassword);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
