"use client"

import * as React from "react"
import { Switch as HeadlessSwitch, type SwitchProps as HeadlessSwitchProps } from "./switch-headless"
import { cn } from "@/lib/utils"

// Re-exportar tipos para mantener la compatibilidad
export type { HeadlessSwitchProps as SwitchProps }

/**
 * Switch - Componente de interruptor con estilos predefinidos
 * 
 * Este componente envuelve HeadlessSwitch añadiendo estilos específicos.
 * Para un control total, usa directamente HeadlessSwitch.
 */
const Switch = React.forwardRef<HTMLButtonElement, HeadlessSwitchProps>(
  ({ className, variant = "pill", ...props }, ref) => {
    return (
      <HeadlessSwitch
        ref={ref}
        variant={variant}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 items-center border-2 border-transparent shadow-sm transition-all duration-300 outline-none",
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/80",
          "data-[state=unchecked]:hover:bg-input/90 data-[state=checked]:hover:bg-primary/90",
          "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "pill" ? "rounded-full" : "rounded-md",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <span
            data-slot="switch-thumb"
            className={cn(
              "pointer-events-none block h-5 w-5 shadow-lg ring-0 transition-all duration-300 ease-in-out",
              checked ? "bg-primary-foreground" : "bg-foreground",
              checked ? "translate-x-5" : "translate-x-0",
              checked ? "scale-90" : "scale-100",
              variant === "pill" ? "rounded-full" : "rounded-sm"
            )}
          />
        )}
      </HeadlessSwitch>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
