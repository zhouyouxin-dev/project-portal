import { formatAwardDate, type Award } from "@/types"
import { AwardBadge } from "@/components/AwardBadge"

/** 获奖记录表：圆角容器、灰底表头、行间细线；等级列用奖牌色徽章 */
export function AwardTable({ awards }: { awards: Award[] }) {
  if (awards.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无获奖记录。</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
              <th className="w-10 px-4 py-2.5">序</th>
              <th className="px-4 py-2.5">比赛名称</th>
              <th className="whitespace-nowrap px-4 py-2.5">奖项</th>
              <th className="hidden px-4 py-2.5 sm:table-cell">主办单位</th>
              <th className="hidden whitespace-nowrap px-4 py-2.5 md:table-cell">获奖日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {awards.map((award, i) => (
              <tr key={award.id ?? i} className="transition-colors duration-150 hover:bg-accent/40">
                <td className="px-4 py-3.5 align-top text-xs tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <span className="font-medium">{award.competition}</span>
                  {/* 窄屏放不下主办单位那一列，折到比赛名称下面，而不是直接丢掉 */}
                  {award.organizer && (
                    <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                      {award.organizer}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <AwardBadge award={award} variant="soft" size="sm" />
                </td>
                <td className="hidden px-4 py-3.5 align-top text-muted-foreground sm:table-cell">
                  {award.organizer || "—"}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3.5 align-top tabular-nums text-muted-foreground md:table-cell">
                  {formatAwardDate(award.awardDate) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
