"use client"

import * as React from "react"
import { Input } from "./input"
import { Slider } from "./slider"
import { cn } from "@/lib/utils"

interface SliderWithInputProps extends React.ComponentPropsWithoutRef<typeof Slider> {
  /** Clase personalizada para el contenedor del input */
  inputClassName?: string
  /** Función para formatear el valor mostrado en el input */
  formatDisplayValue?: (value: number) => string
  /** Callback cuando cambia el valor del input */
  onInputChange?: (value: number) => void
  /** Valor mínimo permitido */
  min?: number
  /** Valor máximo permitido */
  max?: number
  /** Incremento/decremento del valor */
  step?: number
  /** Número de decimales a mostrar/permitir */
  precision?: number
  /** Etiqueta accesible para el input */
  'aria-label'?: string
  /** Clase para el contenedor del slider */
  sliderContainerClass?: string
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
  'aria-label': ariaLabel = 'Valor numérico',
  sliderContainerClass,
  ...props 
}, ref) => {
  // Determinar el valor actual para mostrarlo en el input
  const currentValue = React.useMemo(() => {
    if (Array.isArray(value) && value.length > 0) {
      return value[0]
    }
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return defaultValue[0]
    }
    return min
  }, [value, defaultValue, min])

  // Estado para rastrear si el input está enfocado
  const [isInputFocused, setIsInputFocused] = React.useState(false)

  // Función para formatear el valor de manera inteligente según su magnitud
  const formatValueForDisplay = React.useCallback((value: number): string => {
    if (formatDisplayValue) {
      return formatDisplayValue(value);
    }
    
    // Para valores muy pequeños (científicos)
    if (Math.abs(value) < 0.001 && value !== 0) {
      return value.toExponential(2);
    }
    
    // Para valores enteros
    if (Number.isInteger(Number(value)) || precision === 0) {
      return Math.round(value).toString();
    }
    
    // Para valores con decimales
    return value.toFixed(precision);
  }, [formatDisplayValue, precision]);

  // Estado local para el valor del input
  const [inputValue, setInputValue] = React.useState<string>(
    formatValueForDisplay(currentValue)
  )

  // Actualizar el input cuando cambia el slider o el valor actual
  React.useEffect(() => {
    // Si el input no está enfocado o el valor actual es diferente al mostrado
    const currentNumericValue = parseFloat(inputValue) || 0;
    if (!isInputFocused || Math.abs(currentNumericValue - currentValue) > Number.EPSILON) {
      setInputValue(formatValueForDisplay(currentValue));
    }
  }, [currentValue, formatValueForDisplay, isInputFocused, inputValue])

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir valores vacíos temporalmente para mejor UX al borrar
    if (e.target.value === '') {
      setInputValue('')
      return
    }
    
    // Validar que sea un número o un punto decimal
    const numRegex = new RegExp(`^-?\\d*\\.?\\d*$`)
    if (numRegex.test(e.target.value)) {
      setInputValue(e.target.value)
    }
  }

  // Aplicar el valor cuando el input pierde el foco o se presiona Enter
  const handleInputBlur = () => {
    setIsInputFocused(false)
    
    // Si el input está vacío, restaurar el valor anterior
    if (inputValue === '') {
      setInputValue(formatValueForDisplay(currentValue))
      return
    }
    
    const parsedValue = parseFloat(inputValue)
    if (!isNaN(parsedValue)) {
      // Asegurar que el valor está dentro de los límites
      const clampedValue = Math.min(Math.max(parsedValue, min), max)
      
      // Redondear al step más cercano
      const steppedValue = Math.round(clampedValue / step) * step
      
      // Formatear de nuevo para consistencia
      const formattedValue = formatValueForDisplay(steppedValue)
      setInputValue(formattedValue)
      
      // Notificar el cambio solo si es diferente al valor actual
      if (Math.abs(steppedValue - currentValue) > Number.EPSILON) {
        if (onValueChange) {
          onValueChange([steppedValue])
        }
        if (onInputChange) {
          onInputChange(steppedValue)
        }
      }
    } else {
      // Si no es un número válido, volver al valor actual
      setInputValue(formatValueForDisplay(currentValue))
    }
  }

  // Manejar teclas especiales
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.currentTarget.blur()
        break
      case 'Escape':
        // Restaurar valor original al presionar Escape
        setInputValue(formatValueForDisplay(currentValue))
        e.currentTarget.blur()
        break
      case 'ArrowUp':
      case 'ArrowDown':
        // Prevenir el comportamiento por defecto para manejar nosotros el incremento/decremento
        e.preventDefault()
        const direction = e.key === 'ArrowUp' ? 1 : -1
        const newValue = parseFloat((Math.min(Math.max(currentValue + (direction * step), min), max)).toFixed(precision))
        
        // Actualizar el valor mostrado inmediatamente
        setInputValue(formatValueForDisplay(newValue))
        
        // Notificar el cambio
        if (onValueChange) {
          onValueChange([newValue])
        }
        if (onInputChange) {
          onInputChange(newValue)
        }
        break
    }
  }

  // Calcular el ancho del input basado en el valor máximo
  const getInputWidth = () => {
    const maxLength = Math.max(
      min.toString().length,
      max.toString().length,
      inputValue.length
    )
    // Ancho base + un poco de espacio extra por carácter
    return `${Math.min(Math.max(4, maxLength) * 0.8, 10)}rem`
  }

  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      <div className="flex items-center gap-3 group w-full">
        <div className={cn("flex-1 min-w-0", sliderContainerClass)}>
          <Slider
            ref={ref}
            className="w-full group-hover:opacity-100 transition-opacity duration-200"
            value={Array.isArray(value) ? value : undefined}
            defaultValue={Array.isArray(defaultValue) ? defaultValue : undefined}
            min={min}
            max={max}
            step={step}
            onValueChange={onValueChange}
            aria-label={`${ariaLabel} (deslizador)`}
            {...props}
          />
        </div>
        <div className="flex items-center">
          <Input
            type="text"
            style={{ width: getInputWidth() }}
            className={cn(
              "h-8 px-2 py-1 text-right text-sm transition-all duration-200",
              "border border-input rounded-md bg-background hover:border-primary/50",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "focus-visible:border-primary focus-visible:ring-offset-0",
              inputClassName
            )}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            aria-label={ariaLabel}
            title={inputValue}
          />
          {props['aria-label']?.includes('porcentaje') && (
            <span className="ml-1 text-sm text-muted-foreground">%</span>
          )}
        </div>
      </div>
    </div>
  )
})

SliderWithInput.displayName = "SliderWithInput"

export { SliderWithInput }