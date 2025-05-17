"use client"

import * as React from "react"
import { Switch as HeadlessSwitch } from "@headlessui/react"

import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Estado controlado del switch */
  checked?: boolean
  /** Estado inicial no controlado */
  defaultChecked?: boolean
  /** Callback cuando cambia el estado */
  onChange?: (checked: boolean) => void
  /** Si el switch está deshabilitado */
  disabled?: boolean
  /** Variante de estilo */
  variant?: "pill" | "rectangular"
  /** Clase personalizada */
  className?: string
  /** Contenido del switch (opcional) */
  children?: React.ReactNode | (({ checked }: { checked: boolean }) => React.ReactNode)
}

/**
 * Componente Switch usando Headless UI
 * Optimizado para tema oscuro exclusivo
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onChange, disabled, variant = "pill", ...props }, ref) => {
    // Para modo no controlado (cuando checked es undefined)
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false)
    
    // Determinamos si es un componente controlado
    const isControlled = checked !== undefined
    
    // El valor actual a usar para renderizado
    const checkedValue = isControlled ? checked : internalChecked
    
    // Manejador de cambios optimizado para evitar ciclos
    const handleChange = React.useCallback((newChecked: boolean) => {
      // Solo actualizamos el estado interno en modo no controlado
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      
      // Notificamos al componente padre
      if (onChange) {
        onChange(newChecked)
      }
    }, [isControlled, onChange])
    
    return (
      <HeadlessSwitch
        ref={ref}
        checked={checkedValue}
        onChange={handleChange}
        disabled={disabled}
        data-slot="switch"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center border-2 border-transparent shadow-sm",
          "transition-colors duration-200 ease-in-out",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checkedValue ? "bg-primary" : "bg-muted",
          variant === "pill" ? "rounded-full" : "rounded-md",
          className
        )}
        {...props}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block h-5 w-5 shadow-lg ring-0",
            "transition-transform duration-200 ease-bounce",
            checkedValue ? "translate-x-5 bg-primary-foreground" : "translate-x-0 bg-card",
            variant === "pill" ? "rounded-full" : "rounded-sm"
          )}
        />
      </HeadlessSwitch>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
