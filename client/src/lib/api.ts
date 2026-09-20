import type { Attachment, ProjectSummary, ProjectDetail, Facets } from "@/types"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** 与 fetch 的 AbortError 同名，调用方现有的 e.name === "AbortError" 判断继续有效 */
function abortError(): Error {
  const e = new Error("请求已取消")
  e.name = "AbortError"
  return e
}

/** 后端统一返回 { code, data } 或 { code, message }，这里做一次解包 */
function unwrap<T>(raw: string): T {
  let data: unknown = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }
  if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
    return (data as { data: T }).data
  }
  return data as T
}

function errorMessage(raw: string, status: number): string {
  try {
    const parsed = JSON.parse(raw) as { message?: string }
    if (parsed?.message) return parsed.message
  } catch {
    /* 非 JSON 响应，走下面的兜底文案 */
  }
  return `请求失败（${status}）`
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: options.body instanceof FormData
      ? options.headers
      : { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(text, res.status))
  }
  return unwrap<T>(text)
}

export interface UploadOptions {
  /** 0—100 的整数 */
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

/**
 * 带上传进度的 POST。
 * <p>
 * 用 XMLHttpRequest 而不是 fetch：fetch 至今没有可用的上传进度事件
 * （ReadableStream 上传在多数浏览器仍需 HTTP/2 且限制颇多），
 * 而 300MB 的视频没有进度条是无法接受的。
 */
function uploadWithProgress<T>(url: string, form: FormData, opts: UploadOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    // 认证走 HttpOnly Cookie，跨域开发代理下必须显式带上
    xhr.withCredentials = true

    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          opts.onProgress?.(Math.round((e.loaded / e.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      const text = xhr.responseText
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(unwrap<T>(text))
        } catch {
          reject(new ApiError(xhr.status, "响应解析失败"))
        }
      } else {
        reject(new ApiError(xhr.status, errorMessage(text, xhr.status)))
      }
    }

    xhr.onerror = () => reject(new ApiError(0, "网络中断，上传未完成"))
    xhr.ontimeout = () => reject(new ApiError(0, "上传超时"))
    xhr.onabort = () => reject(abortError())

    if (opts.signal) {
      if (opts.signal.aborted) {
        reject(abortError())
        return
      }
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(form)
  })
}

export interface ProjectQuery {
  type?: string
  status?: string
  year?: number | string
  tag?: string
  level?: string
  grade?: string
  q?: string
}

// 参数类型用 object 而非 Record<string, unknown>：interface 不带隐式索引签名，
// 直接传 ProjectQuery 会被 TS 拒绝
function toQueryString(query: object): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export const api = {
  // ── 公开接口 ──
  listProjects(query: ProjectQuery = {}, signal?: AbortSignal): Promise<ProjectSummary[]> {
    return request(`/api/projects${toQueryString(query)}`, { signal })
  },

  /** 筛选候选项（年份 / 赛道 / 标签 / 级别 / 等级），与列表分开取，避免选项随筛选收缩 */
  getFacets(signal?: AbortSignal): Promise<Facets> {
    return request("/api/projects/facets", { signal })
  },

  getProject(slug: string, signal?: AbortSignal): Promise<ProjectDetail> {
    return request(`/api/projects/${slug}`, { signal })
  },

  // ── 认证 ──
  login(username: string, password: string): Promise<void> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  },

  logout(): Promise<void> {
    return request("/api/auth/logout", { method: "POST" })
  },

  /** 未登录时后端返回 401，这里会抛 ApiError */
  me(signal?: AbortSignal): Promise<{ username: string }> {
    return request("/api/auth/me", { signal })
  },

  // ── 管理接口 ──
  adminListProjects(): Promise<ProjectSummary[]> {
    return request("/api/admin/projects")
  },

  adminGetProject(id: number): Promise<ProjectDetail> {
    return request(`/api/admin/projects/${id}`)
  },

  adminSaveProject(payload: Record<string, unknown>, id?: number): Promise<ProjectDetail> {
    return request(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    })
  },

  adminDeleteProject(id: number): Promise<void> {
    return request(`/api/admin/projects/${id}`, { method: "DELETE" })
  },

  adminListTags(): Promise<TagDto[]> {
    return request("/api/admin/tags")
  },

  adminSaveTag(payload: { name: string; category?: string }, id?: number): Promise<TagDto> {
    return request(id ? `/api/admin/tags/${id}` : "/api/admin/tags", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    })
  },

  adminDeleteTag(id: number): Promise<void> {
    return request(`/api/admin/tags/${id}`, { method: "DELETE" })
  },

  /** 封面图与获奖证书：≤5MB，服务端按魔数判定格式 */
  uploadFile(file: File): Promise<{ url: string }> {
    const form = new FormData()
    form.append("file", file)
    return request("/api/admin/upload", { method: "POST", body: form })
  },

  /** 演示材料：PPT ≤100MB、视频 ≤300MB。项目必须已存在（需要 projectId） */
  uploadAttachment(
    projectId: number,
    kind: string,
    file: File,
    opts?: UploadOptions,
  ): Promise<Attachment> {
    const form = new FormData()
    form.append("projectId", String(projectId))
    form.append("kind", kind)
    form.append("file", file)
    return uploadWithProgress<Attachment>("/api/admin/attachments", form, opts)
  },

  deleteAttachment(id: number): Promise<void> {
    return request(`/api/admin/attachments/${id}`, { method: "DELETE" })
  },
}

export interface TagDto {
  id: number
  name: string
  category: string
}
