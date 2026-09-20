import { cn } from "@/lib/utils"
import { TypeIcon } from "@/components/TypeIcon"

interface SectionHeadingProps {
  title: string
  /** 传赛道则左侧显示赛道图标 */
  type?: string
  icon?: React.ReactNode
  count?: number
  description?: string
  className?: string
}

/** 分组 / 区块标题：图标块 + 标题 + 右侧计数胶囊 */
export function SectionHeading({ title, type, icon, count, description, className }: SectionHeadingProps) {
  const leading = icon ?? (type ? <TypeIcon type={type} className="size-5" /> : null)

  return (
    <div className={cn("mb-6 flex items-center gap-3", className)}>
      {leading && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          {leading}
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {count != null && (
        <span className="ml-auto shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {count} 项
        </span>
      )}
    </div>
  )
}
