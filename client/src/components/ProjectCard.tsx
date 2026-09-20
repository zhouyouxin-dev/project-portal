import { Link } from "react-router-dom"
import { topAward, typeLabel, type ProjectSummary } from "@/types"
import { AwardBadge } from "@/components/AwardBadge"
import { CoverImage } from "@/components/CoverImage"
import { TagChip } from "@/components/TagChip"
import { TypeIcon } from "@/components/TypeIcon"

const MAX_TAGS = 3

interface ProjectCardProps {
  project: ProjectSummary
}

/**
 * 项目卡片：封面（叠奖项徽章与年份）+ 标题 + 摘要 + 标签。
 *
 * 用「拉伸链接」而非把整张卡片包成 <a>：标题里的 Link 通过 after 伪元素铺满卡片，
 * 标签胶囊自己也是 Link 并抬高 z-index。这样没有 a 套 a 的无效 HTML，
 * 也不需要在标签点击里 stopPropagation。
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const award = topAward(project.awards)
  const extraTags = Math.max(0, project.tags.length - MAX_TAGS)

  return (
    <article className="tech-card tech-corner group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card/85 shadow-card backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30">
      {/* HUD 恒亮瞄准角：右上角电光蓝直角标，悬浮时增亮 */}
      <span aria-hidden className="hud-corner hud-corner-tr" />
      <CoverImage src={project.coverUrl} type={project.type} zoomOnHover>
        {award && <AwardBadge award={award} size="sm" className="absolute left-3 top-3 shadow-sm" />}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
          {project.year}
        </span>
      </CoverImage>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            <Link
              to={`/project/${project.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </Link>
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <TypeIcon type={project.type} className="size-3.5" />
            <span>{typeLabel(project.type)}</span>
            {project.awards.length > 1 && (
              <>
                <span aria-hidden>·</span>
                <span>共 {project.awards.length} 项获奖</span>
              </>
            )}
          </p>
        </div>

        {project.summary && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
        )}

        {project.tags.length > 0 && (
          <div className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-1">
            {project.tags.slice(0, MAX_TAGS).map((tag) => (
              <TagChip key={tag} name={tag} />
            ))}
            {extraTags > 0 && (
              <span className="inline-flex h-6 items-center rounded-full px-1.5 text-xs text-muted-foreground">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
