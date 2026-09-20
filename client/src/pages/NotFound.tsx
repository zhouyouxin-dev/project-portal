import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { useDocumentTitle } from "@/hooks/use-document-title"

export default function NotFound() {
  useDocumentTitle("页面不存在")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar section="404" />

      <main className="mx-auto flex w-full max-w-grid flex-1 items-center justify-center px-5 sm:px-8">
        <div className="w-full max-w-md animate-rise py-20 text-center">
          <p className="text-[6rem] font-bold leading-none tracking-tighter text-muted-foreground/30">
            404
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">这里什么都没有</h1>
          <p className="mt-3 text-base text-muted-foreground">
            你访问的地址不存在，可能是链接已失效，或者该项目还是草稿状态。
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/">
              <ArrowLeft />
              返回全部项目
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
