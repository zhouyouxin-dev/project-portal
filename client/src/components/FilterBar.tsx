import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  gradeLabel,
  levelLabel,
  typeLabel,
  type Facets,
} from "@/types"

export const ALL = "__all__"

export interface FilterState {
  q: string
  type: string
  level: string
  grade: string
  year: string
  tag: string
}

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  /** 搜索框的即时值，与 filters.q 分离以便做防抖 */
  searchInput: string
  onSearchInput: (value: string) => void
  facets: Facets | null
  total: number
  loading: boolean
}

interface Option {
  value: string
  label: string
}

const EMPTY: FilterState = {
  q: "",
  type: ALL,
  level: ALL,
  grade: ALL,
  year: ALL,
  tag: ALL,
}

/**
 * 检索区：搜索框 + 每个维度一行胶囊按钮。
 * 所有可选项直接可见，不藏在下拉里；窄屏下每行横向滑动。
 */
export function FilterBar({
  filters,
  onChange,
  searchInput,
  onSearchInput,
  facets,
  total,
  loading,
}: FilterBarProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const hasFilter =
    Boolean(filters.q) ||
    filters.type !== ALL ||
    filters.level !== ALL ||
    filters.grade !== ALL ||
    filters.year !== ALL ||
    filters.tag !== ALL

  // 候选项一律取自 facets：后端已按级别 / 等级的高低顺序排好，前端不再重排
  const levelOptions = withAll((facets?.levels ?? []).map((v) => ({ value: v, label: levelLabel(v) })))
  const gradeOptions = withAll((facets?.grades ?? []).map((v) => ({ value: v, label: gradeLabel(v) })))
  const typeOptions = withAll((facets?.types ?? []).map((v) => ({ value: v, label: typeLabel(v) })))
  const yearOptions = withAll((facets?.years ?? []).map((y) => ({ value: String(y), label: String(y) })))
  const tagOptions = withAll((facets?.tags ?? []).map((t) => ({ value: t, label: t })))

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="portal-search"
            type="search"
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder="搜索项目名称、简介、成员或指导教师"
            aria-label="检索项目"
            className="h-11 w-full rounded-full border border-primary/25 bg-card pl-11 pr-4 text-sm shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <span className="hidden shrink-0 text-sm tabular-nums text-muted-foreground sm:inline">
          {loading ? "···" : `${total} 项`}
        </span>
        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchInput("")
              onChange(EMPTY)
            }}
          >
            <X />
            清除
          </Button>
        )}
      </div>

      <div className="mt-3 divide-y divide-border/70">
        {levelOptions.length > 1 && (
          <FilterRow
            label="赛事级别"
            options={levelOptions}
            value={filters.level}
            onSelect={(v) => set({ level: v })}
          />
        )}
        {gradeOptions.length > 1 && (
          <FilterRow
            label="获奖等级"
            options={gradeOptions}
            value={filters.grade}
            onSelect={(v) => set({ grade: v })}
          />
        )}
        {typeOptions.length > 1 && (
          <FilterRow
            label="赛道"
            options={typeOptions}
            value={filters.type}
            onSelect={(v) => set({ type: v })}
          />
        )}
        {yearOptions.length > 1 && (
          <FilterRow
            label="年份"
            options={yearOptions}
            value={filters.year}
            onSelect={(v) => set({ year: v })}
            mono
          />
        )}
        {tagOptions.length > 1 && (
          <FilterRow
            label="技术标签"
            options={tagOptions}
            value={filters.tag}
            onSelect={(v) => set({ tag: v })}
          />
        )}
      </div>
    </div>
  )
}

function withAll(options: Option[]): Option[] {
  return [{ value: ALL, label: "全部" }, ...options]
}

function FilterRow({
  label,
  options,
  value,
  onSelect,
  mono,
}: {
  label: string
  options: Option[]
  value: string
  onSelect: (value: string) => void
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="w-16 shrink-0 pt-1.5 text-xs font-medium text-muted-foreground">{label}</span>
      {/* 窄屏横向滑动、宽屏换行：候选项多的时候（标签）不会把页面撑得太长 */}
      <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors duration-150",
                mono && "tabular-nums",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-primary/15 bg-primary/10 text-primary/80 hover:border-primary/30 hover:bg-primary/15 hover:text-primary",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
