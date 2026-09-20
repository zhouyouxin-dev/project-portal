package com.portal.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * H2 控制台的纵深防御：只有 dev profile 会注册这个过滤器，
 * 即便误把 dev 配置部署到公网，控制台也仅限服务器本机打开。
 */
public class H2ConsoleGuardFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(H2ConsoleGuardFilter.class);
    private static final Set<String> LOOPBACK = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");

    private final String consolePath;

    public H2ConsoleGuardFilter(String consolePath) {
        this.consolePath = consolePath;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith(consolePath) && !LOOPBACK.contains(request.getRemoteAddr())) {
            log.warn("拒绝来自 {} 的 H2 控制台访问", request.getRemoteAddr());
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "H2 console is restricted to localhost");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
