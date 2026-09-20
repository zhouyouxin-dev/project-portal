import { cn } from "@/lib/utils"
import { TYPE_HUE, TYPE_ORDER } from "@/types"
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
 * 分组 / 区块标题（浅色 HUD 混合风）：
 * ── 赛道色渐变图标芯片 + TRACK_0x 等宽代码 + 标题 + 同色计数胶囊
 * ── 赛道色能量线向右淡出，末端一枚青绿短刻度收尾
 * ── 色相取 TYPE_HUE（与封面占位渐变同一套映射），未知赛道兜底 210 蓝
 */
export function SectionHeading({ title, type, icon, count, description, className }: SectionHeadingProps) {
  const hue = (type && TYPE_HUE[type]) ?? 210
  const trackIndex = type ? TYPE_ORDER.indexOf(type) : -1
  const trackCode = trackIndex >= 0 ? `TRACK_${String(trackIndex + 1).padStart(2, "0")}` : "TRACK__"
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
        <p className="track-code font-mono text-xs font-medium leading-none tracking-[0.2em]">
          {trackCode}
        </p>
        <h2 className="mt-1 text-xl font-semibold leading-none tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {count != null && (
        <span className="track-count ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums">
          {count} 项
        </span>
      )}
      <span aria-hidden className="track-line hidden flex-1 sm:block" />
      <span aria-hidden className="track-tick hidden shrink-0 sm:block" />
    </div>
  )
}
