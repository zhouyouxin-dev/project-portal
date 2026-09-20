import { useRef, useState } from "react"
import { ExternalLink, FileText, Presentation, Trash2, Video, X } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatFileSize, kindLabel, type Attachment } from "@/types"
import { Button } from "@/components/ui/button"

interface AttachmentUploaderProps {
  /** 新建项目时还没有 id，此时只能提示先保存 */
  projectId?: number
  attachments: Attachment[]
  onChange: (next: Attachment[]) => void
}

interface Uploading {
  kind: string
  name: string
  percent: number
}

const ACCEPT: Record<string, string> = {
  ppt: ".pptx,.ppt,.pdf,.docx,.doc",
  video: ".mp4,.mov,.m4v,.webm,.mkv,.avi",
}

const LIMIT_HINT: Record<string, string> = {
  ppt: "PPTX / PPT / PDF / DOCX · ≤ 100MB",
  video: "MP4 / MOV / WEBM / MKV / AVI · ≤ 300MB",
}

const KIND_ICONS: Record<string, typeof FileText> = {
  ppt: Presentation,
  video: Video,
}

export function AttachmentUploader({
  projectId,
  attachments,
  onChange,
}: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState<Uploading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  // 上传中允许中断：300MB 传到一半发现选错文件，不该只能干等
  const abortRef = useRef<AbortController | null>(null)

  if (!projectId) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
        演示材料需要先有项目才能归属。请先保存项目，保存后会自动留在编辑页，届时可上传 PPT 与视频。
      </p>
    )
  }

  const handleUpload = async (kind: string, file: File | undefined) => {
    if (!file) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setUploading({ kind, name: file.name, percent: 0 })
    setError(null)
    try {
      const created = await api.uploadAttachment(projectId, kind, file, {
        signal: ctrl.signal,
        onProgress: (percent) => setUploading({ kind, name: file.name, percent }),
      })
      onChange([...attachments, created])
    } catch (e) {
      // 主动取消不是错误，不必打扰用户
      if (e instanceof Error && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "上传失败")
    } finally {
      abortRef.current = null
      setUploading(null)
    }
  }

  const handleRemove = async (id: number) => {
    setRemoving(id)
    setError(null)
    try {
      await api.deleteAttachment(id)
      onChange(attachments.filter((a) => a.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败")
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {(["ppt", "video"] as const).map((kind) => {
          const Icon = KIND_ICONS[kind]
          return (
            <label
              key={kind}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 transition-colors duration-150",
                uploading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-foreground/40 hover:bg-accent/40",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">上传{kindLabel(kind)}</span>
                <span className="block text-xs text-muted-foreground">{LIMIT_HINT[kind]}</span>
              </span>
              <input
                type="file"
                accept={ACCEPT[kind]}
                disabled={Boolean(uploading)}
                className="hidden"
                onChange={(e) => {
                  handleUpload(kind, e.target.files?.[0])
                  // 清空 value：同一个文件连续选两次也要能触发 change
                  e.target.value = ""
                }}
              />
            </label>
          )
        })}
      </div>

      {uploading && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{uploading.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {uploading.percent}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => abortRef.current?.abort()}
              aria-label="取消上传"
            >
              <X />
            </Button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-150"
              style={{ width: `${uploading.percent}%` }}
            />
          </div>
          {uploading.percent === 100 && (
            <p className="mt-2 text-xs text-muted-foreground">传输完成，服务端正在校验并落盘…</p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a) => {
            const Icon = KIND_ICONS[a.kind] ?? FileText
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel(a.kind)}
                    <span aria-hidden className="mx-1.5">
                      ·
                    </span>
                    <span className="tabular-nums">{formatFileSize(a.sizeBytes)}</span>
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon-sm" aria-label="查看">
                  <a href={a.url} target="_blank" rel="noreferrer">
                    <ExternalLink />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={removing === a.id}
                  onClick={() => handleRemove(a.id)}
                  aria-label="删除"
                  className="hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {attachments.length > 0 && (
        <p className="text-xs text-muted-foreground">
          共 {attachments.length} 份材料。删除会同时移除服务器上的文件，且无法恢复。
        </p>
      )}
    </div>
  )
}
