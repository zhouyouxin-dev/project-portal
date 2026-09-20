import { useState } from "react"
import { cn } from "@/lib/utils"
import { typeHue } from "@/types"
import { TypeIcon } from "@/components/TypeIcon"

interface CoverImageProps {
  src?: string | null
  alt?: string
  /** 赛道，用于无封面时的占位配色与图标 */
  type: string
  /** 容器 class，默认 16:10；传 aspect-* 可覆盖 */
  className?: string
  iconClassName?: string
  /** 父级带 group 时，hover 图片轻微放大 */
  zoomOnHover?: boolean
  /** 叠加在图片上的内容（徽章、年份等），自行用 absolute 定位 */
  children?: React.ReactNode
}

/**
 * 统一封面：有图显示图，加载失败或没图时按赛道显示渐变占位 + 图标。
 * 所有卡片的图片区因此高度一致，不会出现有图无图两种高度。
 */
export function CoverImage({
  src,
  alt = "",
  type,
  className,
  iconClassName,
  zoomOnHover = false,
  children,
}: CoverImageProps) {
  // 记录加载失败的那个 src：换了新地址会自动重试，不需要 effect 重置
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <div className={cn("relative aspect-[16/10] overflow-hidden bg-muted", className)}>
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src!)}
          className={cn(
            "h-full w-full object-cover",
            zoomOnHover && "transition-transform duration-500 ease-out group-hover:scale-[1.04]",
          )}
        />
      ) : (
        <div
          className="cover-placeholder flex h-full w-full items-center justify-center"
          style={{ "--cover-hue": typeHue(type) } as React.CSSProperties}
        >
          <TypeIcon
            type={type}
            strokeWidth={1.5}
            className={cn("size-10 opacity-70", iconClassName)}
          />
        </div>
      )}
      {children}
    </div>
  )
}
