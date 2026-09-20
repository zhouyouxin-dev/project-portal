package com.portal.controller;

import com.portal.dto.Dtos;
import com.portal.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody Dtos.LoginRequest req,
                                     HttpServletRequest request,
                                     HttpServletResponse response) {
        authService.login(req, request, response);
        return Map.of("code", 0, "message", "登录成功");
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletResponse response) {
        authService.logout(response);
        return Map.of("code", 0, "message", "已退出登录");
    }

    /** 未登录时返回真正的 401，前端可统一按 HTTP 状态码判断 */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        // 注意匿名认证：未登录时 Spring Security 给的是 AnonymousAuthenticationToken，
        // 它的 isAuthenticated() 也是 true，只判空会把 "anonymousUser" 当成已登录用户放行
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("code", 401, "message", "未登录"));
        }
        return ResponseEntity.ok(Map.of("code", 0, "data", new Dtos.UserDto(authentication.getName())));
    }
}
