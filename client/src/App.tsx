import { Suspense, lazy } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import Home from "@/pages/Home"

// 详情页与后台都按需加载：marked / dompurify 只在真正打开正文时才下载
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"))
const NotFound = lazy(() => import("@/pages/NotFound"))
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"))
const Login = lazy(() => import("@/pages/admin/Login"))
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"))
const ProjectForm = lazy(() => import("@/pages/admin/ProjectForm"))
const TagsManager = lazy(() => import("@/pages/admin/TagsManager"))

export default function App() {
  return (
    // attribute="class" 必须显式指定：next-themes 默认写 data-theme，
    // 而 Tailwind 的 darkMode 配置读的是 class，缺了这行暗色样式一条都不会生效
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="portal-theme-v3"
      disableTransitionOnChange
    >
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="project/new" element={<ProjectForm />} />
              <Route path="project/:id" element={<ProjectForm />} />
              <Route path="tags" element={<TagsManager />} />
            </Route>
            {/* 未匹配的路径给出明确的 404，而不是静默跳回首页让人以为点错了 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
