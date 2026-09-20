package com.portal.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 统一异常处理，返回结构化错误。
 * <p>
 * 继承 {@link ResponseEntityExceptionHandler} 是关键：它已内置处理全部 Spring MVC 标准异常
 * （参数类型不匹配、JSON 解析失败、方法不支持、路径不存在等）。若只留 Exception 兜底，
 * 这些客户端错误会被一律当成 500，既让前端无法区分「资源不存在」和「服务端故障」，
 * 也会让每个 404 都往日志写一条 ERROR 堆栈，把真正的故障淹没。
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    public static class TooManyRequestsException extends RuntimeException {
        public TooManyRequestsException(String message) {
            super(message);
        }
    }

    // ── 业务异常 ─────────────────────────────────────────────

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(ConflictException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, Object>> handleTooMany(TooManyRequestsException e) {
        return error(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
    }

    // ── Spring MVC 标准异常：改写响应体，保持与业务异常一致的 {code, message} ──

    /** 保留字段级中文提示，如「title: 标题不能为空」 */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst().orElse("参数校验失败");
        return new ResponseEntity<>(body(HttpStatus.BAD_REQUEST.value(), msg), HttpStatus.BAD_REQUEST);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object ignoredBody, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        return new ResponseEntity<>(body(status.value(), describe(ex, status)), status);
    }

    /** 对外只给笼统原因，不回显异常内部细节 */
    private static String describe(Exception ex, HttpStatusCode status) {
        if (ex instanceof HttpMessageNotReadableException) {
            return "请求体格式有误，请检查 JSON 是否合法且为 UTF-8 编码";
        }
        return switch (status.value()) {
            case 400 -> "请求参数有误";
            case 404 -> "资源不存在";
            case 405 -> "不支持的请求方法";
            case 415 -> "不支持的内容类型";
            default -> "请求无法处理";
        };
    }

    // ── 兜底 ─────────────────────────────────────────────────

    /** 走到这里说明是真正的服务端故障：对外笼统，完整堆栈落日志 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception e) {
        log.error("未处理的服务端异常", e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "服务器内部错误");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(body(status.value(), message));
    }

    private static Map<String, Object> body(int code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        return body;
    }
}
