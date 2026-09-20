import { cn } from "@/lib/utils"
import { TYPE_HUE } from "@/types"
import { TypeIcon } from "@/components/TypeIcon"

interface SectionHeadingProps {
  title: string
  /** 传赛道则左侧显示赛道图标，且整条头部采用该赛道的专属色相 */
  type?: string
  icon?: React.ReactNode
  count?: number
  description?: string
  className?: string
}

/**
 * 分组 / 区块标题（科技风）：
 * ── 赛道色渐变图标芯片 + 标题 + 同色计数胶囊 + 向右延伸的赛道色能量线
 * ── 色相取 TYPE_HUE（与封面占位渐变同一套映射），未知赛道兜底 210 蓝
 */
export function SectionHeading({ title, type, icon, count, description, className }: SectionHeadingProps) {
  const hue = (type && TYPE_HUE[type]) ?? 210
  const leading = icon ?? (type ? <TypeIcon type={type} className="size-5" /> : null)

  return (
    <div
      className={cn("mb-6 flex items-center gap-3", className)}
      style={{ "--track-hue": hue } as React.CSSProperties}
    >
      {leading && (
        <span className="track-chip flex size-10 shrink-0 items-center justify-center rounded-lg text-white">
          {leading}
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {count != null && (
        <span className="track-count ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums">
          {count} 项
        </span>
      )}
      <span aria-hidden className="track-line hidden flex-1 sm:block" />
    </div>
  )
}
