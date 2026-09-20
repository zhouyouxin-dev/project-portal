import { marked } from "marked"
import DOMPurify from "dompurify"

export interface Heading {
  id: string
  text: string
}

export interface RenderedMarkdown {
  html: string
  headings: Heading[]
}

let hookRegistered = false

/** 外链统一在新标签打开，并断开对 opener 的引用 */
function ensureHook() {
  if (hookRegistered) return
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      const href = node.getAttribute("href") ?? ""
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute("target", "_blank")
        node.setAttribute("rel", "noopener noreferrer")
      }
    }
  })
  hookRegistered = true
}

/**
 * Markdown → 消毒后的 HTML，并提取二级标题供目录使用。
 * 正文来自后台编辑器，仍按不可信内容处理：先 sanitize，再补 id，
 * 顺序不能反过来，否则等于把自己生成的属性也交给消毒器裁决。
 */
export function renderMarkdown(source?: string | null): RenderedMarkdown {
  if (!source) return { html: "", headings: [] }
  ensureHook()

  const raw = marked.parse(source, { async: false }) as string
  const clean = DOMPurify.sanitize(raw, { ADD_ATTR: ["target"] })

  const doc = new DOMParser().parseFromString(clean, "text/html")
  const headings: Heading[] = []
  doc.querySelectorAll("h2").forEach((el, i) => {
    // 用序号而非标题文本做 id：中文标题转 slug 容易撞车，也会带出编码问题
    const id = `section-${i}`
    el.id = id
    headings.push({ id, text: el.textContent?.trim() ?? "" })
  })

  return { html: doc.body.innerHTML, headings }
}
