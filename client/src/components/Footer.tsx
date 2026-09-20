import { Trophy } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-grid flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Trophy className="size-4" aria-hidden />
          竞赛获奖项目库
        </span>
        <span className="text-xs">© {new Date().getFullYear()} · React · Spring Boot</span>
      </div>
    </footer>
  )
}
