"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Definición de variantes usando class-variance-authority
const inputVariants = cva(
  "flex h-10 w-full rounded-lg border-2 bg-card/50 px-4 py-2 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "border-input/60 focus-visible:border-primary/60 focus-visible:ring-primary/30",
        error: "border-destructive/50 ring-2 ring-destructive/20 focus-visible:border-destructive/70 focus-visible:ring-destructive/30",
        success: "border-success/50 ring-1 ring-success/20 focus-visible:border-success/70 focus-visible:ring-success/30",
        ghost: "border-transparent bg-transparent focus-visible:border-input/60",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
      },
      state: {
        default: "",
        disabled: "cursor-not-allowed opacity-60 bg-input/20 border-input/30",
        loading: "opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

// Tipos para las props
interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  asChild?: boolean
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  isLoading?: boolean
}

/**
 * InputHeadless - Componente base sin estilos para campos de entrada
 * 
 * Este componente maneja la lógica y accesibilidad, pero no aplica estilos directamente.
 * Los estilos deben ser manejados por el componente que lo envuelva.
 */
const InputHeadless = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    state,
    asChild = false,
    disabled = false,
    isLoading = false,
    leftElement,
    rightElement,
    ...props
  }, ref) => {
    // Determinar el estado del input
    const inputState = React.useMemo(() => {
      if (disabled) return "disabled"
      if (isLoading) return "loading"
      return state || "default"
    }, [disabled, isLoading, state])

    // Renderizar el componente raíz (input o Slot)
    const Comp = asChild ? Slot : "input"
    
    // Clases base para accesibilidad
    const baseClasses = "outline-none transition-all duration-200 ease-in-out"
    
    // Renderizar el input
    return (
      <div className="relative w-full">
        {leftElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftElement}
          </div>
        )}
        <Comp
          ref={ref}
          data-slot="input"
          data-variant={variant}
          data-size={size}
          data-state={inputState}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          className={cn(
            baseClasses,
            inputVariants({ variant, size, state: inputState }),
            leftElement && "pl-10",
            rightElement && "pr-10",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightElement}
          </div>
        )}
      </div>
    )
  }
)
InputHeadless.displayName = "InputHeadless"

export { InputHeadless, inputVariants }
export type { InputProps }
