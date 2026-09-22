import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, ImageOff, Upload } from "lucide-react"
import { api, type TagDto } from "@/lib/api"
import { renderMarkdown } from "@/lib/markdown"
import { cn } from "@/lib/utils"
import { PROJECT_TYPES, PROJECT_STATUS, type Attachment } from "@/types"
import { AwardEditor } from "@/pages/admin/AwardEditor"
import { emptyAward, type AwardDraft } from "@/pages/admin/award-draft"
import { AttachmentUploader } from "@/pages/admin/AttachmentUploader"
import { CoverImage } from "@/components/CoverImage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface FormState {
  title: string
  slug: string
  summary: string
  coverUrl: string
  type: string
  status: string
  year: number
  demoUrl: string
  repoUrl: string
  members: string
  advisors: string
  department: string
  content: string
  sortOrder: number
  visibility: string
  tagIds: number[]
  awards: AwardDraft[]
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  summary: "",
  coverUrl: "",
  type: "ai",
  status: "done",
  year: new Date().getFullYear(),
  demoUrl: "",
  repoUrl: "",
  members: "",
  advisors: "",
  department: "",
  content: "",
  sortOrder: 0,
  visibility: "published",
  tagIds: [],
  awards: [emptyAward()],
}

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(emptyForm)
  // 附件是即时上传的，不随表单一起提交，因此单独存
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [tags, setTags] = useState<TagDto[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [justCreated, setJustCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.adminListTags().then(setTags).catch(() => {})
    if (!id) return
    api
      .adminGetProject(Number(id))
      .then((p) => {
        setForm({
          title: p.title,
          slug: p.slug,
          summary: p.summary ?? "",
          coverUrl: p.coverUrl ?? "",
          type: p.type,
          status: p.status,
          year: p.year,
          demoUrl: p.demoUrl ?? "",
          repoUrl: p.repoUrl ?? "",
          members: p.members ?? "",
          advisors: p.advisors ?? "",
          department: p.department ?? "",
          content: p.content ?? "",
          sortOrder: p.sortOrder,
          visibility: p.visibility,
          tagIds: p.tags.map((t) => t.id),
          awards: p.awards.map((a) => ({
            competition: a.competition,
            level: a.level,
            grade: a.grade,
            organizer: a.organizer ?? "",
            awardDate: a.awardDate ?? "",
            certificateUrl: a.certificateUrl ?? "",
          })),
        })
        setAttachments(p.attachments)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const previewHtml = useMemo(
    () => renderMarkdown(form.content || "_（暂无内容）_").html,
    [form.content],
  )

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await api.uploadFile(file)
      set("coverUrl", url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = await api.adminSaveProject(
        {
          ...form,
          summary: form.summary || null,
          coverUrl: form.coverUrl || null,
          demoUrl: form.demoUrl || null,
          repoUrl: form.repoUrl || null,
          members: form.members || null,
          advisors: form.advisors || null,
          department: form.department || null,
          content: form.content || null,
          // 比赛名称为空的记录直接丢弃，后端也会再筛一次
          awards: form.awards
            .filter((a) => a.competition.trim())
            .map((a) => ({
              competition: a.competition.trim(),
              level: a.level,
              grade: a.grade,
              organizer: a.organizer || null,
              awardDate: a.awardDate || null,
              certificateUrl: a.certificateUrl || null,
            })),
        },
        id ? Number(id) : undefined,
      )

      if (isEdit) {
        navigate("/admin")
        return
      }
      // 新建后留在编辑页：附件必须挂到已存在的项目上，
      // 这时跳回列表会让人以为「材料没地方传」
      setJustCreated(true)
      navigate(`/admin/project/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4" aria-hidden>
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 w-full rounded-xl bg-muted" />
        <div className="h-64 w-full rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          项目列表
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{isEdit ? "编辑项目" : "新建项目"}</h1>
      </header>

      {justCreated && (
        <p className="mb-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          项目已创建，现在可以在「项目材料」中上传演示 PPT 与视频。
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6 pb-28">
        <Section title="基本信息">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="项目名称 *" htmlFor="title">
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="获奖项目全称"
              />
            </Field>
            <Field label="Slug *（URL 标识）" htmlFor="slug">
              <Input
                id="slug"
                required
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="my-project"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="仅小写字母、数字与连字符"
                className="font-mono"
              />
            </Field>
          </div>

          <Field label="项目摘要" htmlFor="summary">
            <Textarea
              id="summary"
              rows={2}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="一句话说明项目做什么、解决什么问题"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-4">
            <Field label="赛道">
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_TYPES).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="项目状态">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="年份 *" htmlFor="year">
              <Input
                id="year"
                type="number"
                required
                min="2000"
                max="2100"
                value={form.year}
                onChange={(e) => set("year", Number(e.target.value))}
                className="tabular-nums"
              />
            </Field>
            <Field label="排序权重" htmlFor="sortOrder">
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
                className="tabular-nums"
              />
            </Field>
          </div>
        </Section>

        <Section title="封面图" description="首页卡片与详情页都会展示；未上传时按赛道显示占位图案">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <CoverImage
              src={form.coverUrl}
              type={form.type}
              className="w-full shrink-0 rounded-xl border border-border sm:w-56"
            />
            <div className="flex-1 space-y-3">
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  handleUpload(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors duration-150",
                  dragging
                    ? "border-primary bg-accent"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  uploading && "pointer-events-none opacity-60",
                )}
              >
                <Upload className="size-5" aria-hidden />
                <span className="font-medium">{uploading ? "上传中…" : "点击或拖拽图片到此处上传"}</span>
                <span className="text-xs">JPG / PNG / WEBP · ≤ 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handleUpload(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.coverUrl}
                  onChange={(e) => set("coverUrl", e.target.value)}
                  placeholder="或直接粘贴图片 URL"
                />
                {form.coverUrl && (
                  <Button type="button" variant="outline" onClick={() => set("coverUrl", "")}>
                    <ImageOff />
                    移除
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section title="参与人员">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="团队成员" htmlFor="members">
              <Input
                id="members"
                value={form.members}
                onChange={(e) => set("members", e.target.value)}
                placeholder="张三、李四、王五"
              />
            </Field>
            <Field label="指导教师" htmlFor="advisors">
              <Input
                id="advisors"
                value={form.advisors}
                onChange={(e) => set("advisors", e.target.value)}
                placeholder="王建国、刘晓东"
              />
            </Field>
          </div>
          <Field label="所属学院 / 单位" htmlFor="department">
            <Input
              id="department"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              placeholder="计算机科学与技术学院"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            姓名之间用顿号或逗号分隔，前台会统一规整为顿号。
          </p>
        </Section>

        <Section title="获奖记录">
          <AwardEditor awards={form.awards} onChange={(next) => set("awards", next)} />
        </Section>

        <Section title="项目材料">
          <AttachmentUploader
            projectId={id ? Number(id) : undefined}
            attachments={attachments}
            onChange={setAttachments}
          />
        </Section>

        <Section title="关键词标签">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无标签，可先到「标签管理」创建。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = form.tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set(
                        "tagIds",
                        active
                          ? form.tagIds.filter((t) => t !== tag.id)
                          : [...form.tagIds, tag.id],
                      )
                    }
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors duration-150",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="相关链接">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="在线演示链接" htmlFor="demoUrl">
              <Input
                id="demoUrl"
                type="url"
                value={form.demoUrl}
                onChange={(e) => set("demoUrl", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="源码仓库链接" htmlFor="repoUrl">
              <Input
                id="repoUrl"
                type="url"
                value={form.repoUrl}
                onChange={(e) => set("repoUrl", e.target.value)}
                placeholder="https://github.com/"
              />
            </Field>
          </div>
        </Section>

        <Section title="项目详情" description="支持 Markdown，二级标题会自动生成目录">
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">编辑</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <Textarea
                rows={16}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder={"## 项目背景\n\n## 创新点\n\n## 技术方案\n\n## 应用成效"}
                className="font-mono"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div
                className="markdown-body min-h-[240px] rounded-xl border border-border bg-background p-6"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </TabsContent>
          </Tabs>
        </Section>

        {/* 底部固定操作栏：表单很长，保存按钮不该只在最底下 */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 backdrop-blur-md md:left-[240px]">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <Switch
                id="visibility"
                checked={form.visibility === "published"}
                onCheckedChange={(v) => set("visibility", v ? "published" : "draft")}
              />
              <label htmlFor="visibility" className="cursor-pointer text-sm">
                {form.visibility === "published" ? "已发布，前台可见" : "草稿，前台隐藏"}
              </label>
            </div>

            <div className="flex items-center gap-3">
              {error && <span className="text-sm text-destructive">{error}</span>}
              <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                {isEdit ? "取消" : "返回列表"}
              </Button>
              <Button type="submit" disabled={saving} className="min-w-28">
                {saving ? "保存中…" : "保存项目"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
