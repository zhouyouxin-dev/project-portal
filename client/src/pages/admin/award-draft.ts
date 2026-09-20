/**
 * 后台表单里的获奖记录草稿形态。
 * <p>
 * 与 types/index.ts 的 Award 分开：那是后端返回的展示类型（字段可空、带 id），
 * 这里是表单的受控值（一律非空字符串，便于直接绑到 input）。
 * 单独成文件是为了让 AwardEditor.tsx 只导出组件，满足 react-refresh 的 HMR 约束。
 */
export interface AwardDraft {
  competition: string
  level: string
  grade: string
  organizer: string
  /** yyyy-MM-dd，与 input[type=date] 和后端 LocalDate 都对得上；空串表示未填 */
  awardDate: string
  certificateUrl: string
}

export function emptyAward(): AwardDraft {
  return {
    competition: "",
    level: "provincial",
    grade: "first",
    organizer: "",
    awardDate: "",
    certificateUrl: "",
  }
}
