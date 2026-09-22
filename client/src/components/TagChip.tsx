import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface TagChipProps {
  name: string
  active?: boolean
  className?: string
}

/**
 * 技术标签胶囊，点击跳到按该标签筛选的首页。
 * 始终渲染为 Link；卡片里配合「拉伸链接」布局使用（见 ProjectCard），不会出现 a 套 a。
 */
export function TagChip({ name, active = false, className }: TagChipProps) {
  return (
    <Link
      to={`/?tag=${encodeURIComponent(name)}`}
      className={cn(
        "inline-flex h-6 max-w-full cursor-pointer items-center rounded-full border px-2.5 text-xs font-medium transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/15 bg-primary/10 text-primary/80 hover:border-primary/30 hover:bg-primary/15 hover:text-primary",
        className,
      )}
    >
      <span className="truncate">{name}</span>
    </Link>
  )
}
