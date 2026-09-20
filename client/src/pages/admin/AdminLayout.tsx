import { useEffect, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { ExternalLink, LayoutGrid, LogOut, Tag, Trophy } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useDocumentTitle } from "@/hooks/use-document-title"

export default function AdminLayout() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)

  useDocumentTitle("管理后台")

  useEffect(() => {
    const ctrl = new AbortController()
    api
      .me(ctrl.signal)
      .then((user) => setUsername(user.username))
      .catch((e: Error) => {
        // 未登录时后端返回 401，request() 会抛错
        if (e.name !== "AbortError") navigate("/admin/login", { replace: true })
      })
    return () => ctrl.abort()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await api.logout()
    } finally {
      navigate("/admin/login", { replace: true })
    }
  }

  if (username === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">正在验证登录…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 侧栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">竞赛获奖项目库</p>
            <p className="text-xs text-muted-foreground">管理后台</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <AdminLink to="/admin" label="项目管理" icon={<LayoutGrid />} end />
          <AdminLink to="/admin/tags" label="标签管理" icon={<Tag />} />
        </nav>

        <div className="space-y-1 border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
              {username.slice(0, 1)}
            </span>
            <span className="truncate text-sm">{username}</span>
          </div>
          <button
            type="button"
            onClick={() => window.open("/", "_blank")}
            className={sideAction}
          >
            <ExternalLink />
            查看前台
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(sideAction, "hover:text-destructive")}
          >
            <LogOut />
            退出登录
          </button>
        </div>
      </aside>

      <div className="md:pl-[240px]">
        {/* 移动端顶栏 */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-5 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Trophy className="size-3.5" aria-hidden />
            </span>
            <span className="text-sm font-semibold">管理后台</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/admin" end className={mobileLink}>
              项目
            </NavLink>
            <NavLink to="/admin/tags" className={mobileLink}>
              标签
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="退出登录"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <main className="px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const sideAction =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground [&_svg]:size-4"

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150",
    isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
  )

function AdminLink({
  to,
  label,
  icon,
  end,
}: {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 [&_svg]:size-4",
          isActive
            ? "bg-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}
