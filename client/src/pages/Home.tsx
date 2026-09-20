import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ChartColumn, LayoutGrid, Medal, SearchX, ServerOff, Trophy } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { typeLabel, TYPE_ORDER, type Facets, type ProjectSummary } from "@/types"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ProjectCard } from "@/components/ProjectCard"
import { SectionHeading } from "@/components/SectionHeading"
import { EmptyState } from "@/components/EmptyState"
import { ALL, FilterBar, type FilterState } from "@/components/FilterBar"

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [facets, setFacets] = useState<Facets | null>(null)
  // 记录「已拿到结果的那个查询」：与当前 URL 不一致即视为加载中，不需要单独的 loading 状态
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useDocumentTitle("竞赛获奖项目库")

  const queryKey = searchParams.toString()
  const loading = resolvedKey !== queryKey
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "")
  const debouncedSearch = useDebounce(searchInput, 300)

  const filters: FilterState = {
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? ALL,
    level: searchParams.get("level") ?? ALL,
    grade: searchParams.get("grade") ?? ALL,
    year: searchParams.get("year") ?? ALL,
    tag: searchParams.get("tag") ?? ALL,
  }

  // 候选项与统计只取一次，之后筛选不再影响它们
  useEffect(() => {
    const ctrl = new AbortController()
    api.getFacets(ctrl.signal).then(setFacets).catch(() => {})
    return () => ctrl.abort()
  }, [])

  // 筛选交给后端：URL 变化即重新取数，旧请求随之取消，避免响应乱序覆盖
  useEffect(() => {
    const ctrl = new AbortController()
    const p = new URLSearchParams(queryKey)
    api
      .listProjects(
        {
          type: p.get("type") ?? undefined,
          level: p.get("level") ?? undefined,
          grade: p.get("grade") ?? undefined,
          year: p.get("year") ?? undefined,
          tag: p.get("tag") ?? undefined,
          q: p.get("q") ?? undefined,
        },
        ctrl.signal,
      )
      .then((data) => {
        setProjects(data)
        setError(null)
        setResolvedKey(queryKey)
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return
        setError(e instanceof ApiError ? e.message : "无法连接到服务端")
        setResolvedKey(queryKey)
      })
    return () => ctrl.abort()
  }, [queryKey])

  // 输入停止 300ms 后才写入 URL，避免逐字触发请求
  useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (debouncedSearch === current) return
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set("q", debouncedSearch)
    else next.delete("q")
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, searchParams, setSearchParams])

  const setFilters = (next: FilterState) => {
    const params = new URLSearchParams()
    if (next.q) params.set("q", next.q)
    if (next.type !== ALL) params.set("type", next.type)
    if (next.level !== ALL) params.set("level", next.level)
    if (next.grade !== ALL) params.set("grade", next.grade)
    if (next.year !== ALL) params.set("year", next.year)
    if (next.tag !== ALL) params.set("tag", next.tag)
    setSearchParams(params, { replace: true })
  }

  const span = useMemo(() => {
    const years = facets?.years ?? []
    if (years.length === 0) return null
    const min = Math.min(...years)
    const max = Math.max(...years)
    return min === max ? String(max) : `${min}—${max}`
  }, [facets])

  // 按赛道分组，组内保持后端给的排序；已知赛道按声明顺序排，老数据留下的未知类型兜底排在后面
  const groups = useMemo(() => {
    const byType = new Map<string, ProjectSummary[]>()
    for (const p of projects) {
      const list = byType.get(p.type)
      if (list) list.push(p)
      else byType.set(p.type, [p])
    }
    const known = TYPE_ORDER.filter((t) => byType.has(t))
    const unknown = [...byType.keys()].filter((t) => !TYPE_ORDER.includes(t)).sort()
    return [...known, ...unknown].map((type) => ({ type, items: byType.get(type) ?? [] }))
  }, [projects])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-grid flex-1 px-5 sm:px-8">
        {/* ── Hero：标题 + 说明 + 总览统计 ── */}
        <section className="animate-rise py-14 sm:py-20">
          <span className="glow-primary inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Trophy className="size-3.5" aria-hidden />
            竞赛获奖项目汇编
          </span>
          <h1 className="text-tech-gradient mt-5 max-w-3xl text-display font-bold tracking-tight">
            记录每一个走上领奖台的项目
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            收录历年各级各类学科竞赛的获奖项目，逐项保留立项背景、技术方案、
            参与人员与完整的答辩材料。按赛道分类，可按级别、等级与年份检索。
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={<LayoutGrid />} label="收录项目" value={facets?.total} unit="项" />
            <StatCard icon={<Trophy />} label="国家级获奖" value={facets?.national} unit="项" />
            <StatCard icon={<Medal />} label="省级获奖" value={facets?.provincial} unit="项" />
            <StatCard icon={<ChartColumn />} label="年份跨度" value={span} />
          </dl>
        </section>

        {/* ── 检索 ── */}
        <section className="tech-card rounded-2xl border border-primary/25 bg-card/80 p-5 shadow-card backdrop-blur-md sm:p-6">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            searchInput={searchInput}
            onSearchInput={setSearchInput}
            facets={facets}
            total={projects.length}
            loading={loading}
          />
        </section>

        {/* ── 分组卡片 ── */}
        <section className="pb-24 pt-12">
          {error ? (
            <EmptyState
              icon={<ServerOff />}
              title={error}
              description="请确认后端服务已在 localhost:8080 启动"
            />
          ) : loading && projects.length === 0 ? (
            <CardSkeleton />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="没有匹配的项目"
              description="调整检索条件或换个关键词试试"
            />
          ) : (
            <div className={`space-y-14 transition-opacity duration-150 ${loading ? "opacity-50" : ""}`}>
              {groups.map((group) => (
                <section key={group.type} aria-labelledby={`group-${group.type}`}>
                  <SectionHeading
                    title={typeLabel(group.type)}
                    type={group.type}
                    count={group.items.length}
                  />
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode
  label: string
  value?: number | string | null
  unit?: string
}) {
  return (
    <div className="tech-card flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card/80 p-4 shadow-card backdrop-blur-md sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-glow-primary mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-primary">
          {value ?? "—"}
          {unit && value != null && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
          )}
        </dd>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[16/10] bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
