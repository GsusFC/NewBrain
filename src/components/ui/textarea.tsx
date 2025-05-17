import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border-2 border-input/60 bg-card/50 px-4 py-3 text-sm font-medium text-foreground",
        "transition-all duration-200 ease-in-out backdrop-blur-sm",
        "placeholder:text-muted-foreground/60 placeholder:font-normal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hover:border-input/80 hover:bg-card/70",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-input/20 disabled:border-input/30 disabled:hover:bg-card/50",
        "aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
