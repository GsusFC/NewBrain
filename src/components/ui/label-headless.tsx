"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Componente Label personalizado que reemplaza la implementación de Radix UI
 * Implementado como un elemento HTML label simple con estilos cohesivos
 */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, htmlFor, ...props }, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-xs leading-none font-medium select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
Label.displayName = "Label"

export { Label }
