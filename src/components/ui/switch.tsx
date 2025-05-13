"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  variant?: "pill" | "rectangular"
}

function Switch({
  className,
  variant = "pill",
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-6 w-11 shrink-0 items-center border-2 border-transparent shadow-sm transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "pill" ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block h-5 w-5 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          variant === "pill" ? "rounded-full" : "rounded-sm"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
