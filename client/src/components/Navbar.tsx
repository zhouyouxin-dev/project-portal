import { Link } from "react-router-dom"
import { useTheme } from "next-themes"
import { Lock, Moon, Sun, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  /** 站名右侧的当前位置标注，例如详情页所属赛道 */
  section?: string
}

export function Navbar({ section }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-grid items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 font-semibold">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-4" aria-hidden />
          </span>
          <span className="truncate">竞赛获奖项目库</span>
          {section && (
            <span className="hidden truncate text-sm font-normal text-muted-foreground sm:inline">
              / {section}
            </span>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {/*
            两个图标都渲染、靠 dark: 变体切换显示：首帧 resolvedTheme 尚未确定时
            也不会闪出错误的图标，且不需要 mounted 状态与 effect
          */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="切换明暗主题"
          >
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:block" />
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <Lock className="size-3.5" />
              管理
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
