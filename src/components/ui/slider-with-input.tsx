"use client"

import * as React from "react"
import { Input } from "./input"
import { Slider } from "./slider"
import { cn } from "@/lib/utils"

interface SliderWithInputProps extends React.ComponentPropsWithoutRef<typeof Slider> {
  // Propiedades específicas para el input numérico
  inputClassName?: string
  formatDisplayValue?: (value: number) => string
  onInputChange?: (value: number) => void
  step?: number
  min?: number
  max?: number
  precision?: number // Número de decimales a mostrar/permitir
}

const SliderWithInput = React.forwardRef<
  React.ElementRef<typeof Slider>,
  SliderWithInputProps
>(({ 
  className,
  inputClassName,
  value,
  defaultValue,
  onValueChange,
  onInputChange,
  formatDisplayValue,
  min = 0,
  max = 100,
  step = 1,
  precision = 0,
  ...props
}, ref) => {
  // Determinar el valor actual para mostrarlo en el input
  const currentValue = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value[0]
    }
    if (Array.isArray(defaultValue)) {
      return defaultValue[0]
    }
    return min
  }, [value, defaultValue, min])

  // Función para formatear el valor de manera inteligente según su magnitud
  const formatValueForDisplay = React.useCallback((value: number): string => {
    if (formatDisplayValue) {
      return formatDisplayValue(value);
    }
    
    // Para valores muy pequeños (científicos)
    if (Math.abs(value) < 0.001 && value !== 0) {
      // Usar notación científica para números muy pequeños
      return value.toExponential(2);
    }
    
    // Para valores normales pero con precisión
    return value.toFixed(precision);
  }, [formatDisplayValue, precision]);

  // Estado local para el valor del input
  const [inputValue, setInputValue] = React.useState<string>(
    formatValueForDisplay(currentValue)
  )

  // Actualizar el input cuando cambia el slider
  React.useEffect(() => {
    setInputValue(formatValueForDisplay(currentValue))
  }, [currentValue, formatValueForDisplay])

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Aplicar el valor cuando el input pierde el foco o se presiona Enter
  const handleInputBlur = () => {
    const parsedValue = parseFloat(inputValue)
    if (!isNaN(parsedValue)) {
      // Asegurar que el valor está dentro de los límites
      const clampedValue = Math.min(Math.max(parsedValue, min), max)
      
      // Redondear al step más cercano
      const steppedValue = Math.round(clampedValue / step) * step
      
      // Formatear de nuevo para consistencia
      setInputValue(formatValueForDisplay(steppedValue))
      
      // Notificar el cambio
      if (onValueChange) {
        onValueChange([steppedValue])
      }
      if (onInputChange) {
        onInputChange(steppedValue)
      }
    } else {
      // Si no es un número válido, volver al valor actual
      setInputValue(formatValueForDisplay(currentValue))
    }
  }

  // Manejar la tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Slider
          ref={ref}
          className="flex-1"
          value={Array.isArray(value) ? value : undefined}
          defaultValue={Array.isArray(defaultValue) ? defaultValue : undefined}
          min={min}
          max={max}
          step={step}
          onValueChange={onValueChange}
          {...props}
        />
        <Input
          type="text"
          className={cn("w-24 text-right", inputClassName)}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-label="Valor numérico"
          title={inputValue} // Añadir tooltip para mejor visibilidad
        />
      </div>
    </div>
  )
})

SliderWithInput.displayName = "SliderWithInput"

export { SliderWithInput }