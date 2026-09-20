package com.portal.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 登录失败限流：同一客户端连续失败达到阈值后锁定一段时间，阻断在线爆破。
 * 单机内存实现，重启即清空；多实例部署需换成 Redis 等共享存储。
 */
@Component
public class LoginAttemptGuard {

    /** 超过该条目数时顺带清理过期记录，防止内存无限增长 */
    private static final int CLEANUP_THRESHOLD = 1000;

    private final int maxAttempts;
    private final Duration lockout;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginAttemptGuard(@Value("${app.login.max-attempts}") int maxAttempts,
                             @Value("${app.login.lockout-minutes}") long lockoutMinutes) {
        this.maxAttempts = maxAttempts;
        this.lockout = Duration.ofMinutes(lockoutMinutes);
    }

    private record Attempt(int count, Instant expiresAt) {
        boolean expired(Instant now) {
            return now.isAfter(expiresAt);
        }
    }

    /** 若当前客户端处于锁定状态则抛出异常，返回剩余秒数供提示 */
    public void assertNotLocked(String clientKey) {
        Attempt attempt = attempts.get(clientKey);
        if (attempt == null || attempt.expired(Instant.now())) {
            return;
        }
        if (attempt.count() >= maxAttempts) {
            long remaining = Duration.between(Instant.now(), attempt.expiresAt()).toMinutes() + 1;
            throw new GlobalExceptionHandler.TooManyRequestsException(
                    "登录失败次数过多，请 " + remaining + " 分钟后再试");
        }
    }

    public void recordFailure(String clientKey) {
        Instant now = Instant.now();
        attempts.compute(clientKey, (k, prev) -> {
            int count = (prev == null || prev.expired(now)) ? 1 : prev.count() + 1;
            return new Attempt(count, now.plus(lockout));
        });
        if (attempts.size() > CLEANUP_THRESHOLD) {
            attempts.values().removeIf(a -> a.expired(now));
        }
    }

    public void recordSuccess(String clientKey) {
        attempts.remove(clientKey);
    }
}
