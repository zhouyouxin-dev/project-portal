import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Trophy } from "lucide-react"
import { api } from "@/lib/api"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useDocumentTitle("登录")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.login(username, password)
      navigate("/admin", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-[400px] animate-rise">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
              <Trophy className="size-6" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-semibold tracking-tight">登录管理后台</h1>
            <p className="mt-1 text-sm text-muted-foreground">竞赛获奖项目库</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
          >
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                用户名
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? "登录中…" : "登录"}
            </Button>

            {/* 默认凭据只在开发构建里提示，生产产物中这段会被彻底摇掉 */}
            {import.meta.env.DEV && (
              <p className="text-center text-xs text-muted-foreground">
                开发环境默认账号：admin / admin123
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              返回前台
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
