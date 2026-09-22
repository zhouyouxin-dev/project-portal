/**
 * 赛道主题：每个板块一套渐变 + 强调色，让分组区块各有辨识度。
 * 类名必须写完整字面量（不能拼接），tailwind 的 content 扫描才能生成对应样式。
 */
export interface TypeTheme {
  /** 图标块：渐变底 + 白色图标 */
  tile: string
  /** 强调文字色 */
  text: string
  /** 浅底胶囊 / 计数徽标 */
  soft: string
  /** 顶部色条 / 描边渐变 */
  bar: string
}

export const TYPE_THEMES: Record<string, TypeTheme> = {
  ai: {
    tile: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
    text: "text-violet-600 dark:text-violet-400",
    soft: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    bar: "from-violet-500 to-indigo-500",
  },
  software: {
    tile: "bg-gradient-to-br from-blue-500 to-cyan-400 text-white",
    text: "text-blue-600 dark:text-blue-400",
    soft: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    bar: "from-blue-500 to-cyan-400",
  },
  hardware: {
    tile: "bg-gradient-to-br from-orange-500 to-amber-500 text-white",
    text: "text-orange-600 dark:text-orange-400",
    soft: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    bar: "from-orange-500 to-amber-400",
  },
  iot: {
    tile: "bg-gradient-to-br from-emerald-500 to-teal-400 text-white",
    text: "text-emerald-600 dark:text-emerald-400",
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    bar: "from-emerald-500 to-teal-400",
  },
  bigdata: {
    tile: "bg-gradient-to-br from-cyan-500 to-sky-500 text-white",
    text: "text-cyan-600 dark:text-cyan-400",
    soft: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    bar: "from-cyan-500 to-sky-400",
  },
  business: {
    tile: "bg-gradient-to-br from-pink-500 to-rose-400 text-white",
    text: "text-pink-600 dark:text-pink-400",
    soft: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
    bar: "from-pink-500 to-rose-400",
  },
  other: {
    tile: "bg-gradient-to-br from-slate-500 to-slate-400 text-white",
    text: "text-slate-600 dark:text-slate-400",
    soft: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    bar: "from-slate-500 to-slate-400",
  },
}

/** 未知赛道兜底用蓝色系 */
export function typeTheme(type: string): TypeTheme {
  return TYPE_THEMES[type] ?? TYPE_THEMES.other
}
