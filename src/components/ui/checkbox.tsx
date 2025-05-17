"use client"

import * as React from "react"
import { Checkbox as HeadlessCheckbox, type CheckboxProps as HeadlessCheckboxProps } from "./checkbox-headless"
import { cn } from "@/lib/utils"

// Re-exportar tipos para mantener la compatibilidad
export type { HeadlessCheckboxProps as CheckboxProps }

/**
 * Checkbox - Componente de casilla de verificación con estilos predefinidos
 * 
 * Este componente envuelve HeadlessCheckbox añadiendo estilos específicos.
 * Para un control total, usa directamente HeadlessCheckbox.
 */
const Checkbox = React.forwardRef<HTMLButtonElement, HeadlessCheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <HeadlessCheckbox
        ref={ref}
        className={cn(
          "relative h-5 w-5 shrink-0 rounded border-2 border-input/80",
          "transition-all duration-200 ease-in-out",
          "hover:border-primary/60 hover:bg-background/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-input/80 disabled:hover:bg-transparent",
          "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
          "data-[state=checked]:hover:bg-primary/90 data-[state=checked]:hover:border-primary/90",
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
