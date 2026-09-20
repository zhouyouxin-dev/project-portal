import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CodeXml,
  GraduationCap,
  SearchX,
  Users,
} from "lucide-react"
import { api } from "@/lib/api"
import { renderMarkdown } from "@/lib/markdown"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { formatNameList, statusLabel, typeLabel, type ProjectDetail } from "@/types"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { AwardBadge } from "@/components/AwardBadge"
import { AwardTable } from "@/components/AwardTable"
import { AttachmentList } from "@/components/AttachmentList"
import { CoverImage } from "@/components/CoverImage"
import { EmptyState } from "@/components/EmptyState"
import { TagChip } from "@/components/TagChip"
import { Toc } from "@/components/Toc"
import { TypeIcon } from "@/components/TypeIcon"
import { Button } from "@/components/ui/button"

interface LoadState {
  slug: string
  project: ProjectDetail | null
  error: string | null
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  // 结果与其对应的 slug 一起存：切换路由时旧数据自然失效，不需要在 effect 里先清空
  const [state, setState] = useState<LoadState | null>(null)
  const current = state && state.slug === slug ? state : null
  const project = current?.project ?? null
  const error = current?.error ?? null

  useDocumentTitle(project?.title)

  useEffect(() => {
    if (!slug) return
    const ctrl = new AbortController()
    api
      .getProject(slug, ctrl.signal)
      .then((data) => setState({ slug, project: data, error: null }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ slug, project: null, error: e.message })
      })
    return () => ctrl.abort()
  }, [slug])

  // 同一份渲染结果同时供正文与目录使用，headings 引用稳定，避免 Toc 反复重建观察器
  const { html, headings } = useMemo(() => renderMarkdown(project?.content), [project?.content])

  const members = formatNameList(project?.members)
  const advisors = formatNameList(project?.advisors)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar section={project ? typeLabel(project.type) : undefined} />

      <main className="mx-auto w-full max-w-grid flex-1 px-5 sm:px-8">
        <nav className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-md transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            全部项目
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-foreground">{project?.title ?? "…"}</span>
        </nav>

        {error && (
          <EmptyState
            className="my-16"
            icon={<SearchX />}
            title={error}
            action={
              <Button asChild variant="outline">
                <Link to="/">返回项目列表</Link>
              </Button>
            }
          />
        )}

        {!error && !project && <DetailSkeleton />}

        {project && (
          <article className="animate-fade pb-20">
            {/* ── Hero：信息栏 + 封面 ── */}
            <header className="grid gap-8 py-6 lg:grid-cols-12 lg:gap-12 lg:py-10">
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                    <TypeIcon type={project.type} className="size-3.5" />
                    {typeLabel(project.type)}
                  </span>
                  <span className="tabular-nums">{project.year}</span>
                  <span aria-hidden>·</span>
                  <span>{statusLabel(project.status)}</span>
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>

                {project.awards.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.awards.map((award, i) => (
                      <AwardBadge key={award.id ?? i} award={award} size="md" />
                    ))}
                  </div>
                )}

                {(members || advisors || project.department) && (
                  <dl className="mt-6 space-y-2 text-sm">
                    {members && <InfoRow icon={<Users />} label="团队成员" value={members} />}
                    {advisors && <InfoRow icon={<GraduationCap />} label="指导教师" value={advisors} />}
                    {project.department && (
                      <InfoRow icon={<Building2 />} label="所属单位" value={project.department} />
                    )}
                  </dl>
                )}

                {project.summary && (
                  <p className="mt-6 text-base leading-relaxed text-muted-foreground">{project.summary}</p>
                )}

                {project.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <TagChip key={tag.id} name={tag.name} />
                    ))}
                  </div>
                )}

                {(project.demoUrl || project.repoUrl) && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {project.demoUrl && (
                      <Button asChild>
                        <a href={project.demoUrl} target="_blank" rel="noreferrer">
                          在线演示
                          <ArrowUpRight />
                        </a>
                      </Button>
                    )}
                    {project.repoUrl && (
                      <Button asChild variant="outline">
                        <a href={project.repoUrl} target="_blank" rel="noreferrer">
                          <CodeXml />
                          源码仓库
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <CoverImage
                  src={project.coverUrl}
                  type={project.type}
                  alt={`${project.title} 封面`}
                  className="aspect-[4/3] rounded-2xl border border-border shadow-card"
                  iconClassName="size-16"
                />
              </div>
            </header>

            <div className="space-y-6">
              <Section title="获奖记录">
                <AwardTable awards={project.awards} />
              </Section>

              {project.attachments.length > 0 && (
                <Section title="项目材料" description="演示视频可在线播放，其余材料提供下载">
                  <AttachmentList attachments={project.attachments} poster={project.coverUrl} />
                </Section>
              )}

              <Section title="项目详情">
                <div className="grid gap-10 lg:grid-cols-12">
                  <div className="min-w-0 lg:col-span-8">
                    {html ? (
                      <div className="markdown-body max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                      <p className="text-sm text-muted-foreground">该项目暂无详细介绍。</p>
                    )}
                  </div>
                  <aside className="hidden lg:col-span-3 lg:col-start-10 lg:block">
                    <Toc headings={headings} />
                  </aside>
                </div>
              </Section>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SpecItem label="赛道" value={typeLabel(project.type)} />
                <SpecItem label="年份" value={String(project.year)} mono />
                <SpecItem label="项目状态" value={statusLabel(project.status)} />
                <SpecItem label="获奖项数" value={String(project.awards.length)} mono />
              </dl>
            </div>
          </article>
        )}
      </main>

      <Footer />
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
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  )
}

function SpecItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm font-medium ${mono ? "tabular-nums" : ""}`}>{value}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 py-6 lg:grid-cols-12 lg:gap-12 lg:py-10" aria-hidden>
      <div className="space-y-4 lg:col-span-7">
        <div className="h-5 w-32 rounded-full bg-muted" />
        <div className="h-9 w-3/4 rounded bg-muted" />
        <div className="h-7 w-48 rounded-full bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-20 w-full rounded bg-muted" />
      </div>
      <div className="aspect-[4/3] rounded-2xl bg-muted lg:col-span-5" />
    </div>
  )
}
