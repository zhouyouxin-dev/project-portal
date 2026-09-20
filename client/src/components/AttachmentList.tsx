import { Download, FileText, Paperclip, Presentation, Video } from "lucide-react"
import { formatFileSize, kindLabel, type Attachment } from "@/types"
import { Button } from "@/components/ui/button"

interface AttachmentListProps {
  attachments: Attachment[]
  /** 视频播放器的封面帧，一般传项目封面 */
  poster?: string | null
}

const KIND_ICONS: Record<string, typeof FileText> = {
  ppt: Presentation,
  doc: FileText,
  video: Video,
  other: Paperclip,
}

/**
 * 材料区：演示视频可在线播放，其余一律走下载。
 * <p>
 * PPT 刻意不做在线预览 —— 浏览器无法原生渲染 pptx，
 * 要预览就得在服务端转 PDF（引入 LibreOffice 依赖），成本远超收益。
 */
export function AttachmentList({ attachments, poster }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null
  }

  const videos = attachments.filter((a) => a.kind === "video")
  const files = attachments.filter((a) => a.kind !== "video")

  return (
    <div className="space-y-6">
      {videos.map((video) => (
        <figure key={video.id} className="overflow-hidden rounded-xl border border-border bg-card">
          {/*
            preload="metadata"：只取时长与首帧，不预先拉取整个文件。
            拖拽进度条依赖服务端的 206 响应，见 FileController。
          */}
          <video
            controls
            preload="metadata"
            poster={poster ?? undefined}
            className="aspect-video w-full bg-black"
          >
            <source src={video.url} type={video.contentType ?? undefined} />
            您的浏览器不支持内嵌视频播放，请
            <a href={`${video.url}?download=1`}>下载后观看</a>。
          </video>
          <figcaption className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-sm">
            <Video aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-medium">{video.originalName}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatFileSize(video.sizeBytes)}
            </span>
            <Button asChild variant="outline" size="sm">
              <a href={`${video.url}?download=1`}>
                <Download />
                下载
              </a>
            </Button>
          </figcaption>
        </figure>
      ))}

      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((file) => {
            const Icon = KIND_ICONS[file.kind] ?? Paperclip
            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors duration-150 hover:border-foreground/30"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.originalName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {kindLabel(file.kind)}
                    <span aria-hidden className="mx-1.5">
                      ·
                    </span>
                    <span className="tabular-nums">{formatFileSize(file.sizeBytes)}</span>
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon-sm" aria-label={`下载 ${file.originalName}`}>
                  <a href={`${file.url}?download=1`}>
                    <Download />
                  </a>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
