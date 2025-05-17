"use client"

import * as React from "react"
import { InputHeadless, inputVariants, type InputProps as InputHeadlessProps } from "./input-headless"
import { cn } from "@/lib/utils"

// Re-exportar tipos y variantes para mantener la compatibilidad
export { inputVariants }
export type { InputHeadlessProps as InputProps }

/**
 * Input - Componente de entrada de texto con estilos predefinidos
 * 
 * Este componente envuelve InputHeadless añadiendo estilos específicos.
 * Para un control total, usa directamente InputHeadless.
 */
const Input = React.forwardRef<HTMLInputElement, InputHeadlessProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <InputHeadless
        ref={ref}
        className={cn(
          "backdrop-blur-sm placeholder:text-muted-foreground/60 placeholder:font-normal",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary hover:file:bg-primary/5",
          "hover:border-input/80 hover:bg-card/70",
          "aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          className
        )}
        variant={variant}
        size={size}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
