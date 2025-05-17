import * as React from "react"
import { ButtonHeadless, buttonVariants, type ButtonProps as ButtonHeadlessProps } from "./button-headless"
import { cn } from "@/lib/utils"

// Re-exportar tipos y variantes para mantener la compatibilidad
export { buttonVariants }
export type { ButtonHeadlessProps as ButtonProps }

/**
 * Button - Componente de botón con estilos predefinidos
 * 
 * Este componente envuelve ButtonHeadless añadiendo estilos específicos.
 * Para un control total, usa directamente ButtonHeadless.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonHeadlessProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <ButtonHeadless
        ref={ref}
        className={cn(
          "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
          className
        )}
        variant={variant}
        size={size}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
