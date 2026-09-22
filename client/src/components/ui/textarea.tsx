import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm leading-relaxed shadow-sm outline-none transition-[border-color,box-shadow] duration-150",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
