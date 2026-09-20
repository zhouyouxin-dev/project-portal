package com.portal.common;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** JWT 生成与校验工具 */
@Component
public class JwtService {

    public static final String COOKIE_NAME = "portal_token";

    /** HS256 要求密钥至少 256 位 */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expireHours;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expire-hours}") long expireHours) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("""
                    未配置 JWT 签名密钥。请设置环境变量 JWT_SECRET（至少 32 个字符的随机串）。
                    生成方式示例：openssl rand -base64 48""");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET 过短（" + bytes.length + " 字节），HS256 至少需要 " + MIN_SECRET_BYTES + " 字节");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expireHours = expireHours;
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expireHours * 3600)))
                .signWith(key)
                .compact();
    }

    /** 校验 token 并返回用户名，失败返回 empty */
    public Optional<String> validateToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            return Optional.ofNullable(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getExpireSeconds() {
        return expireHours * 3600;
    }
}
