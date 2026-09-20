export interface Award {
  id: number
  competition: string
  level: string
  grade: string
  organizer: string | null
  awardDate: string | null
  certificateUrl: string | null
}

export interface Attachment {
  id: number
  kind: string
  originalName: string
  contentType: string | null
  sizeBytes: number
  url: string
}

export interface ProjectSummary {
  id: number
  slug: string
  title: string
  summary: string | null
  coverUrl: string | null
  type: string
  status: string
  year: number
  members: string | null
  advisors: string | null
  department: string | null
  sortOrder: number
  visibility: string
  tags: string[]
  awards: Award[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface ProjectTag {
  id: number
  name: string
  category: string
}

export interface ProjectDetail {
  id: number
  slug: string
  title: string
  summary: string | null
  coverUrl: string | null
  type: string
  status: string
  year: number
  demoUrl: string | null
  repoUrl: string | null
  members: string | null
  advisors: string | null
  department: string | null
  content: string | null
  sortOrder: number
  visibility: string
  tags: ProjectTag[]
  awards: Award[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  category: string
}

/** 筛选面板候选项与总览统计，由 /api/projects/facets 提供，不随当前筛选收缩 */
export interface Facets {
  years: number[]
  types: string[]
  tags: string[]
  levels: string[]
  grades: string[]
  total: number
  national: number
  provincial: number
}

/** 赛道分类。改这里要同步改后端 ProjectService.TYPES */
export const PROJECT_TYPES: Record<string, string> = {
  ai: "人工智能",
  software: "软件应用",
  hardware: "智能硬件",
  iot: "物联网",
  bigdata: "大数据",
  business: "商业创新",
  other: "其他",
}

/** 赛道在目录中的排列顺序，与后端 facets 返回的顺序一致 */
export const TYPE_ORDER = Object.keys(PROJECT_TYPES)

/**
 * 赛道色相（HSL 的 H 值）。只用于「无封面」时的占位渐变，
 * 明度与饱和度由 index.css 里的 .cover-placeholder 统一控制。
 */
export const TYPE_HUE: Record<string, number> = {
  ai: 262,
  software: 214,
  hardware: 20,
  iot: 160,
  bigdata: 190,
  business: 340,
  other: 220,
}

export function typeHue(type: string): number {
  return TYPE_HUE[type] ?? 220
}

/** 赛事级别，由高到低。顺序即权重 */
export const AWARD_LEVELS: Record<string, string> = {
  international: "国际级",
  national: "国家级",
  provincial: "省级",
  municipal: "市级",
  school: "校级",
}

/** 获奖等级，由高到低。顺序即权重 */
export const AWARD_GRADES: Record<string, string> = {
  special: "特等奖",
  first: "一等奖",
  second: "二等奖",
  third: "三等奖",
  excellence: "优秀奖",
}

const LEVEL_KEYS = Object.keys(AWARD_LEVELS)
const GRADE_KEYS = Object.keys(AWARD_GRADES)

export const PROJECT_STATUS: Record<string, string> = {
  ongoing: "进行中",
  done: "已完成",
  archived: "已归档",
}

export const ATTACHMENT_KINDS: Record<string, string> = {
  ppt: "演示文稿",
  video: "演示视频",
  doc: "文档",
  other: "其他材料",
}

export function typeLabel(type: string): string {
  return PROJECT_TYPES[type] || type
}

export function levelLabel(level: string): string {
  return AWARD_LEVELS[level] || level
}

export function gradeLabel(grade: string): string {
  return AWARD_GRADES[grade] || grade
}

export function statusLabel(status: string): string {
  return PROJECT_STATUS[status] || status
}

export function kindLabel(kind: string): string {
  return ATTACHMENT_KINDS[kind] || kind
}

/** 未知值排到最后，与后端 Award.levelRank / gradeRank 的处理一致 */
function rank(value: string, keys: string[]): number {
  const i = keys.indexOf(value)
  return i < 0 ? keys.length : i
}

export function levelRank(level: string): number {
  return rank(level, LEVEL_KEYS)
}

export function gradeRank(grade: string): number {
  return rank(grade, GRADE_KEYS)
}

/**
 * 代表奖项：后端已按「级别从高到低 → 等级从高到低」排好序，
 * 这里取第一条即可，不必在前端重排。
 */
export function topAward(awards: Award[]): Award | null {
  return awards.length > 0 ? awards[0] : null
}

/** 奖牌色调：全站唯一的彩色，只按获奖等级分配 */
export type MedalTone = "gold" | "silver" | "bronze" | "plain"

export function medalTone(grade: string): MedalTone {
  switch (grade) {
    case "special":
    case "first":
      return "gold"
    case "second":
      return "silver"
    case "third":
      return "bronze"
    default:
      return "plain"
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

/** 「张三、李四」→ 展示用；后端存的是自由文本，这里只做空白清理 */
export function formatNameList(raw: string | null | undefined): string {
  if (!raw) return ""
  return raw
    .split(/[,、，;；]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("、")
}

/** 获奖日期形如 2025-10-18，只取到年月日；后端可能给 null */
export function formatAwardDate(date: string | null): string {
  if (!date) return ""
  const parts = date.split("-")
  if (parts.length < 3) return date
  return `${parts[0]}.${parts[1]}.${parts[2]}`
}
