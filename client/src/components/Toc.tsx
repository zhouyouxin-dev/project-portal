import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Heading } from "@/lib/markdown"

/**
 * 正文目录：跟随滚动高亮当前章节。
 * rootMargin 把判定区压到视口上部，避免滚到页面底部时最后几节同时命中。
 */
export function Toc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        )
        setActiveId(topmost.target.id)
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    )

    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)
    nodes.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24" aria-label="目录">
      <p className="eyebrow mb-3">目录</p>
      <ol className="border-l border-border">
        {headings.map((h) => {
          const active = activeId === h.id
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug transition-colors duration-150",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {h.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
