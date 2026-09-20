import { Award as AwardIcon, Medal, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { gradeLabel, levelLabel, medalTone, type Award, type MedalTone } from "@/types"

interface AwardBadgeProps {
  award: Award
  size?: "sm" | "md"
  /** solid 叠在图片上；soft 用在表格、后台等浅色底上 */
  variant?: "solid" | "soft"
  className?: string
}

const SOLID: Record<MedalTone, string> = {
  gold: "bg-medal-gold text-medal-gold-foreground",
  silver: "bg-medal-silver text-medal-silver-foreground",
  bronze: "bg-medal-bronze text-medal-bronze-foreground",
  plain: "bg-medal-plain text-medal-plain-foreground",
}

const SOFT: Record<MedalTone, string> = {
  gold: "bg-medal-gold/20 text-medal-gold-foreground dark:text-medal-gold",
  silver: "bg-medal-silver/25 text-medal-silver-foreground dark:text-medal-silver",
  bronze: "bg-medal-bronze/20 text-medal-bronze-foreground dark:text-medal-bronze",
  plain: "bg-medal-plain/60 text-medal-plain-foreground",
}

const ICONS: Record<MedalTone, typeof Trophy> = {
  gold: Trophy,
  silver: Medal,
  bronze: Medal,
  plain: AwardIcon,
}

/**
 * 「国家级 · 一等奖」徽章。
 * 全站唯一的彩色：特等/一等=金、二等=银、三等=铜、其余=灰。
 */
export function AwardBadge({ award, size = "sm", variant = "solid", className }: AwardBadgeProps) {
  const tone = medalTone(award.grade)
  const Icon = ICONS[tone]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-medium",
        size === "sm" ? "h-6 gap-1 px-2 text-xs [&_svg]:size-3" : "h-8 gap-1.5 px-3 text-sm [&_svg]:size-4",
        variant === "solid" ? SOLID[tone] : SOFT[tone],
        className,
      )}
    >
      <Icon aria-hidden strokeWidth={2.25} />
      <span>{levelLabel(award.level)}</span>
      <span aria-hidden className="opacity-50">
        ·
      </span>
      <span>{gradeLabel(award.grade)}</span>
    </span>
  )
}
