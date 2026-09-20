import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { AWARD_GRADES, AWARD_LEVELS } from "@/types"
import { emptyAward, type AwardDraft } from "@/pages/admin/award-draft"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AwardEditorProps {
  awards: AwardDraft[]
  onChange: (next: AwardDraft[]) => void
}

/**
 * 多条获奖记录的编辑。一个项目在省赛与国赛各拿一个奖是常态，
 * 所以这里是可增删的列表，而不是几个平铺字段。
 */
export function AwardEditor({ awards, onChange }: AwardEditorProps) {
  const patch = (index: number, next: Partial<AwardDraft>) => {
    onChange(awards.map((a, i) => (i === index ? { ...a, ...next } : a)))
  }

  const remove = (index: number) => {
    onChange(awards.filter((_, i) => i !== index))
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= awards.length) return
    const next = [...awards]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {awards.length === 0 && (
        <p className="text-sm text-muted-foreground">
          还没有获奖记录。没有记录的项目在前台会标注「暂未录入获奖」。
        </p>
      )}

      {awards.map((award, i) => (
        <fieldset key={i} className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <legend className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
              记录 {i + 1}
            </legend>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="上移"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, 1)}
                disabled={i === awards.length - 1}
                aria-label="下移"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(i)}
                aria-label="删除记录"
                className="hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="比赛名称 *">
              <Input
                required
                value={award.competition}
                onChange={(e) => patch(i, { competition: e.target.value })}
                placeholder="如：中国国际大学生创新大赛"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="赛事级别">
                <Select value={award.level} onValueChange={(v) => patch(i, { level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AWARD_LEVELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="获奖等级">
                <Select value={award.grade} onValueChange={(v) => patch(i, { grade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AWARD_GRADES).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="主办单位">
                <Input
                  value={award.organizer}
                  onChange={(e) => patch(i, { organizer: e.target.value })}
                  placeholder="如：教育部"
                />
              </Field>
              <Field label="获奖日期">
                <Input
                  type="date"
                  value={award.awardDate}
                  onChange={(e) => patch(i, { awardDate: e.target.value })}
                  className="tabular-nums"
                />
              </Field>
            </div>
          </div>
        </fieldset>
      ))}

      <Button type="button" variant="outline" onClick={() => onChange([...awards, emptyAward()])}>
        <Plus />
        添加获奖记录
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
