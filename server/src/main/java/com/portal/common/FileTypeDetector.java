package com.portal.common;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 按文件头魔数判定真实格式，不采信客户端提交的扩展名与 Content-Type。
 * <p>
 * 有一类格式魔数分不出来：pptx / docx / xlsx 都是 ZIP 容器，头四字节完全相同。
 * 因此这里是双重把关 —— <b>魔数决定「是不是这个容器族」，扩展名决定「记成哪种格式」</b>。
 * 伪装成 .pptx 的 mp4 会在魔数这关被挡下；真 ZIP 但扩展名不在白名单里同样拒收。
 * 落盘名始终由服务端用 UUID 重新生成，扩展名只取自这里的白名单，路径穿越无从谈起。
 */
public final class FileTypeDetector {

    private FileTypeDetector() {
    }

    /** 判定结果：落盘用的扩展名（不含点）与回写的 Content-Type */
    public record Detected(String ext, String contentType) {
    }

    private enum Container {
        JPEG, PNG, WEBP, ZIP, OLE2, PDF, ISOBMFF, EBML, RIFF_AVI, UNKNOWN
    }

    /** 每种扩展名对应的容器族与 MIME，扩展名即白名单本身 */
    private record Spec(Container container, String contentType) {
    }

    private static final Map<String, Spec> IMAGE = Map.of(
            "jpg", new Spec(Container.JPEG, "image/jpeg"),
            "jpeg", new Spec(Container.JPEG, "image/jpeg"),
            "png", new Spec(Container.PNG, "image/png"),
            "webp", new Spec(Container.WEBP, "image/webp"));

    private static final Map<String, Spec> DOCUMENT = Map.of(
            "pptx", new Spec(Container.ZIP,
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            "docx", new Spec(Container.ZIP,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            "ppt", new Spec(Container.OLE2, "application/vnd.ms-powerpoint"),
            "doc", new Spec(Container.OLE2, "application/msword"),
            "pdf", new Spec(Container.PDF, "application/pdf"));

    private static final Map<String, Spec> VIDEO = Map.of(
            "mp4", new Spec(Container.ISOBMFF, "video/mp4"),
            "m4v", new Spec(Container.ISOBMFF, "video/mp4"),
            "mov", new Spec(Container.ISOBMFF, "video/quicktime"),
            "webm", new Spec(Container.EBML, "video/webm"),
            "mkv", new Spec(Container.EBML, "video/x-matroska"),
            "avi", new Spec(Container.RIFF_AVI, "video/x-msvideo"));

    /** 判定需要读取的文件头字节数 */
    public static final int HEADER_BYTES = 16;

    public static Detected detectImage(byte[] header, String originalName) {
        return detect(header, originalName, IMAGE);
    }

    /**
     * 图片专用：JPEG / PNG / WEBP 三种魔数互不重叠，已经能唯一确定格式，
     * 不必再要求扩展名匹配 —— 否则从聊天软件里存出来的无后缀图片会被误拒。
     */
    public static Detected detectImageByMagic(byte[] header) {
        return switch (containerOf(header)) {
            case JPEG -> new Detected("jpg", "image/jpeg");
            case PNG -> new Detected("png", "image/png");
            case WEBP -> new Detected("webp", "image/webp");
            default -> null;
        };
    }

    public static Detected detectDocument(byte[] header, String originalName) {
        return detect(header, originalName, DOCUMENT);
    }

    public static Detected detectVideo(byte[] header, String originalName) {
        return detect(header, originalName, VIDEO);
    }

    public static Set<String> imageExtensions() {
        return IMAGE.keySet();
    }

    public static Set<String> documentExtensions() {
        return DOCUMENT.keySet();
    }

    public static Set<String> videoExtensions() {
        return VIDEO.keySet();
    }

    /** 判定失败返回 null，由调用方决定报什么错 */
    private static Detected detect(byte[] header, String originalName, Map<String, Spec> allowed) {
        String ext = extensionOf(originalName);
        Spec spec = allowed.get(ext);
        if (spec == null) {
            return null;
        }
        if (containerOf(header) != spec.container()) {
            return null;
        }
        // jpeg 统一落盘成 jpg，避免同一格式两种后缀
        return new Detected("jpeg".equals(ext) ? "jpg" : ext, spec.contentType());
    }

    private static String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        // 只看最后一个点之后的部分；带路径分隔符的「文件名」本身就不该出现，这里也不去解析
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static Container containerOf(byte[] h) {
        if (startsWith(h, 0xFF, 0xD8, 0xFF)) {
            return Container.JPEG;
        }
        if (startsWith(h, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return Container.PNG;
        }
        if (startsWith(h, 0x25, 0x50, 0x44, 0x46)) {            // %PDF
            return Container.PDF;
        }
        if (startsWith(h, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)) {
            return Container.OLE2;
        }
        if (startsWith(h, 0x1A, 0x45, 0xDF, 0xA3)) {            // EBML
            return Container.EBML;
        }
        // ZIP 有三种起始签名：普通条目 / 空归档 / 分卷。Office 文件正常是第一种，另两种一并认下
        if (startsWith(h, 0x50, 0x4B, 0x03, 0x04)
                || startsWith(h, 0x50, 0x4B, 0x05, 0x06)
                || startsWith(h, 0x50, 0x4B, 0x07, 0x08)) {
            return Container.ZIP;
        }
        if (startsWith(h, 0x52, 0x49, 0x46, 0x46)) {            // RIFF
            if (matchesAt(h, 8, 0x57, 0x45, 0x42, 0x50)) {      // WEBP
                return Container.WEBP;
            }
            if (matchesAt(h, 8, 0x41, 0x56, 0x49, 0x20)) {      // "AVI "
                return Container.RIFF_AVI;
            }
            return Container.UNKNOWN;
        }
        // ISO BMFF（mp4 / mov / m4v）：长度字段在前，第 4-7 字节才是 "ftyp"
        if (matchesAt(h, 4, 0x66, 0x74, 0x79, 0x70)) {
            return Container.ISOBMFF;
        }
        return Container.UNKNOWN;
    }

    private static boolean startsWith(byte[] h, int... expected) {
        return matchesAt(h, 0, expected);
    }

    private static boolean matchesAt(byte[] h, int offset, int... expected) {
        if (h.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((h[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
