import { useEffect, useState } from "react"
import { Check, Pencil, Plus, Tag as TagIcon, Trash2, X } from "lucide-react"
import { api, type TagDto } from "@/lib/api"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditState {
  id: number
  name: string
  category: string
}

const CATEGORIES = [
  { value: "tech", label: "技术栈" },
  { value: "domain", label: "领域" },
  { value: "type", label: "类型" },
]

const categoryLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label ?? c

export default function TagsManager() {
  const [tags, setTags] = useState<TagDto[] | null>(null)
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("tech")
  const [edit, setEdit] = useState<EditState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api
      .adminListTags()
      .then((data) => {
        setTags(data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
  }

  useEffect(load, [])

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      load()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback)
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    const ok = await run(
      () => api.adminSaveTag({ name: newName.trim(), category: newCategory }),
      "创建失败",
    )
    if (ok) setNewName("")
  }

  const handleUpdate = async () => {
    if (!edit || !edit.name.trim()) return
    const ok = await run(
      () => api.adminSaveTag({ name: edit.name.trim(), category: edit.category }, edit.id),
      "保存失败",
    )
    if (ok) setEdit(null)
  }

  const handleDelete = (id: number) => run(() => api.adminDeleteTag(id), "删除失败")

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">标签管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          统一维护技术栈标签，项目表单与前台筛选都从这里取值
        </p>
      </header>

      {/* 新增 */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="新标签名称，如 Kubernetes"
          className="flex-1"
        />
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={busy || !newName.trim()}>
          <Plus />
          新增
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {/* 列表 */}
      {tags === null ? (
        <div className="mt-6 space-y-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<TagIcon />}
          title="暂无标签"
          description="在上方输入框创建第一个标签"
        />
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-accent/40"
            >
              {edit?.id === tag.id ? (
                <>
                  <Input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    className="h-9 w-48"
                    autoFocus
                  />
                  <Select
                    value={edit.category}
                    onValueChange={(v) => setEdit({ ...edit, category: v })}
                  >
                    <SelectTrigger size="sm" className="h-9 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex gap-1">
                    <Button size="icon-sm" onClick={handleUpdate} disabled={busy} aria-label="保存">
                      <Check />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEdit(null)}
                      aria-label="取消"
                    >
                      <X />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{tag.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {categoryLabel(tag.category)}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setEdit({ id: tag.id, name: tag.name, category: tag.category })
                      }
                      aria-label="编辑"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(tag.id)}
                      disabled={busy}
                      aria-label="删除"
                      className="hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
