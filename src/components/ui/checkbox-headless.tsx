"use client"

import * as React from "react"
import { Checkbox as HeadlessCheckbox } from "@headlessui/react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

/**
 * Componente Checkbox usando Headless UI para reemplazar la implementación de Radix UI
 */
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, disabled, ...props }, ref) => {
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
      <HeadlessCheckbox
        ref={ref}
        checked={checkedValue}
        onChange={handleChange}
        disabled={disabled}
        as="button"
        type="button"
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checkedValue ? "bg-primary text-primary-foreground" : "",
          className
        )}
        {...props}
      >
        {({ checked }) => (
          <div className={cn(
            "flex h-full w-full items-center justify-center text-current transition-opacity",
            checked ? "opacity-100" : "opacity-0"
          )}>
            <Check className="h-3 w-3" />
          </div>
        )}
      </HeadlessCheckbox>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
