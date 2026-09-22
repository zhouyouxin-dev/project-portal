import { cn } from "@/lib/utils"
import { typeTheme } from "@/lib/type-theme"
import { TypeIcon } from "@/components/TypeIcon"

interface SectionHeadingProps {
  title: string
  /** 传赛道则左侧显示赛道专属渐变图标块 */
  type?: string
  icon?: React.ReactNode
  count?: number
  description?: string
  className?: string
}

/** 分组 / 区块标题：赛道渐变图标块 + 标题 + 右侧彩色计数胶囊 + 底部渐变线 */
export function SectionHeading({ title, type, icon, count, description, className }: SectionHeadingProps) {
  const theme = typeTheme(type ?? "other")
  const leading = icon ?? (type ? <TypeIcon type={type} className="size-5" /> : null)

  return (
    <div className={cn("group mb-6", className)}>
      <div className="flex items-center gap-3">
        {leading && (
          <span
            className={cn(
              "relative flex size-10 shrink-0 items-center justify-center rounded-lg shadow-[0_4px_14px_-2px_rgb(59_130_246_/_0.35)] transition-transform duration-200 group-hover:scale-105 [&_svg]:drop-shadow-sm",
              theme.tile,
            )}
          >
            {leading}
            {/* 图标块角落网格点缀 */}
            <span
              aria-hidden
              className="tech-grid pointer-events-none absolute inset-0 rounded-lg opacity-40 [mask-image:radial-gradient(circle_at_top_right,black,transparent_75%)]"
            />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {count != null && (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
              theme.soft,
            )}
          >
            {count} 项
          </span>
        )}
      </div>
      {/* 标题下渐变分隔线 */}
      <div aria-hidden className={cn("mt-3 h-0.5 w-24 rounded-full bg-gradient-to-r opacity-70", theme.bar)} />
    </div>
  )
}
