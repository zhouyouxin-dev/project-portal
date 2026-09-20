import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { topAward, typeLabel, type ProjectSummary } from "@/types"
import { AwardBadge } from "@/components/AwardBadge"
import { CoverImage } from "@/components/CoverImage"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api
      .adminListProjects()
      .then((data) => {
        setProjects(data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
  }

  useEffect(load, [])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await api.adminDeleteProject(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败")
    } finally {
      setDeleting(null)
    }
  }

  const drafts = projects?.filter((p) => p.visibility === "draft").length ?? 0

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">项目管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects === null ? "···" : `共 ${projects.length} 项 · 草稿 ${drafts} 项`}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/project/new">
            <Plus />
            新建项目
          </Link>
        </Button>
      </header>

      {error && (
        <p className="mt-5 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {projects === null ? (
        <div className="mt-6 space-y-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<FolderOpen />}
          title="还没有项目"
          description="从「新建项目」开始收录获奖成果"
          action={
            <Button asChild>
              <Link to="/admin/project/new">
                <Plus />
                新建项目
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                  <th className="w-24 px-4 py-2.5">封面</th>
                  <th className="px-4 py-2.5">项目</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">赛道</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">年份</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">最高奖项</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">材料</th>
                  <th className="px-4 py-2.5">状态</th>
                  <th className="px-4 py-2.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => {
                  const award = topAward(p.awards)
                  return (
                    <tr key={p.id} className="transition-colors duration-150 hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <CoverImage
                          src={p.coverUrl}
                          type={p.type}
                          className="h-10 w-16 rounded-md border border-border"
                          iconClassName="size-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/project/${p.id}`}
                          className="font-medium transition-colors duration-150 hover:underline hover:underline-offset-4"
                        >
                          {p.title}
                        </Link>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/{p.slug}</p>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                        {typeLabel(p.type)}
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                        {p.year}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                        {award ? (
                          <AwardBadge award={award} variant="soft" size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">未录入</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                        {p.attachments.length > 0 ? `${p.attachments.length} 份` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill draft={p.visibility === "draft"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon-sm" aria-label="编辑">
                            <Link to={`/admin/project/${p.id}`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={deleting === p.id}
                                aria-label="删除"
                                className="hover:text-destructive"
                              >
                                <Trash2 />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除该项目？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  「{p.title}」及其获奖记录将被永久删除。
                                  {p.attachments.length > 0 && (
                                    <>服务器上的 {p.attachments.length} 份材料文件也会一并清除。</>
                                  )}
                                  此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(p.id)}
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ draft }: { draft: boolean }) {
  return (
    <span
      className={
        draft
          ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground"
          : "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
      }
    >
      <span className={`size-1.5 rounded-full ${draft ? "bg-muted-foreground/50" : "bg-foreground"}`} />
      {draft ? "草稿" : "已发布"}
    </span>
  )
}
