import { useEffect } from "react"

const SUFFIX = "竞赛获奖项目库"

/**
 * 设置文档标题，卸载时还原。
 * 传 null 表示数据还没到，此时不动标题，避免闪烁成「加载中」。
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = title === SUFFIX ? SUFFIX : `${title} | ${SUFFIX}`
    return () => {
      document.title = previous
    }
  }, [title])
}
