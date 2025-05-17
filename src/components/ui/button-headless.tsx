"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Definición de variantes usando class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/30",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/70",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/90",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground active:bg-accent/70",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/90",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
      state: {
        default: "",
        loading: "opacity-70 pointer-events-none",
        disabled: "opacity-50 pointer-events-none",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        state: "loading",
        className: "bg-primary/80",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

// Tipos para las props
interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

/**
 * ButtonHeadless - Componente base sin estilos para botones
 * 
 * Este componente maneja la lógica y accesibilidad, pero no aplica estilos directamente.
 * Los estilos deben ser manejados por el componente que lo envuelva.
 */
const ButtonHeadless = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    state,
    asChild = false,
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    // Determinar el estado del botón
    const buttonState = React.useMemo(() => {
      if (disabled) return "disabled"
      if (isLoading) return "loading"
      return state || "default"
    }, [disabled, isLoading, state])

    // Renderizar el componente raíz (button o Slot)
    const Comp = asChild ? Slot : "button"
    
    // Clases base para accesibilidad
    const baseClasses = "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    
    // Renderizar el botón
    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-state={buttonState}
        data-variant={variant}
        data-size={size}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseClasses,
          buttonVariants({ variant, size, state: buttonState, className })
        )}
        {...props}
      >
        {isLoading && (
          <span className="inline-flex items-center" aria-hidden="true">
            {/* Aquí iría el spinner/loader */}
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="sr-only">Cargando...</span>
          </span>
        )}
        {leftIcon && !isLoading && (
          <span className="inline-flex" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="inline-flex" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
ButtonHeadless.displayName = "ButtonHeadless"

export { ButtonHeadless, buttonVariants }
export type { ButtonProps }
