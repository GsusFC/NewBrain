"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  min: number
  max: number
  step?: number
  value: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  dir?: "ltr" | "rtl"
}

/**
 * Componente Slider personalizado que reemplaza la implementación de Radix UI
 * Optimizado para evitar bucles de renderizado y proporcionar una experiencia fluida.
 */
const SliderComponent = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      min = 0,
      max = 100,
      step = 1,
      value = [0],
      onValueChange,
      onValueCommit,
      disabled = false,
      orientation = "horizontal",
      dir = "ltr",
      ...props
    },
    ref
  ) => {
    // Referencias para los elementos DOM
    const trackRef = React.useRef<HTMLDivElement>(null)
    const thumbRefs = React.useRef<(HTMLDivElement | null)[]>([])
    
    // Estado interno controlado para prevenir bucles de actualización
    const [internalValue, setInternalValue] = React.useState<number[]>(value)
    const [isDragging, setIsDragging] = React.useState<boolean>(false)
    const [activeThumbIndex, setActiveThumbIndex] = React.useState<number>(-1)
    const isInternalChangeRef = React.useRef(false)
    
    // Sincronizar el valor interno cuando cambia el valor de prop, solo si no es un cambio interno
    React.useEffect(() => {
      if (!isInternalChangeRef.current && JSON.stringify(value) !== JSON.stringify(internalValue)) {
        setInternalValue(value)
      }
      isInternalChangeRef.current = false
    }, [value, internalValue])
    
    // Calcular el porcentaje del valor para el estilo
    const getPercentage = (val: number) => {
      return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100))
    }
    
    // Convertir posición a valor
    const positionToValue = (position: number, trackRect: DOMRect) => {
      const isVertical = orientation === "vertical"
      const isRtl = dir === "rtl" && !isVertical
      
      const length = isVertical ? trackRect.height : trackRect.width
      const thumbPosition = isVertical
        ? trackRect.height - position + trackRect.top
        : position - trackRect.left
      
      let percentage = thumbPosition / length
      if (isRtl) {
        percentage = 1 - percentage
      }
      
      let newValue = min + percentage * (max - min)
      
      // Aplicar el paso (step)
      if (step > 0) {
        newValue = Math.round(newValue / step) * step
      }
      
      return Math.max(min, Math.min(max, newValue))
    }
    
    // Actualizar el valor cuando cambia la posición del pulgar
    const updateValue = (index: number, value: number) => {
      const newValues = [...internalValue]
      newValues[index] = value
      
      // Ordenar valores si hay múltiples pulgares
      if (newValues.length > 1) {
        const isRtl = dir === "rtl" && orientation !== "vertical"
        const sortedNewValues = [...newValues].sort(isRtl ? (a, b) => b - a : (a, b) => a - b)
        
        if (JSON.stringify(sortedNewValues) !== JSON.stringify(newValues)) {
          // Si al ordenar cambiaron los valores, encontrar el nuevo índice del pulgar activo
          const newActiveIndex = sortedNewValues.indexOf(newValues[index])
          if (newActiveIndex !== index) {
            setActiveThumbIndex(newActiveIndex)
          }
          newValues.splice(0, newValues.length, ...sortedNewValues)
        }
      }
      
      isInternalChangeRef.current = true
      setInternalValue(newValues)
      
      // Notificar el cambio 
      if (onValueChange) {
        // Usar setTimeout para evitar ciclos de renderizado
        setTimeout(() => {
          onValueChange(newValues)
        }, 0)
      }
    }
    
    // Iniciar arrastre
    const startDragging = (event: React.PointerEvent, index: number) => {
      if (disabled) return
      
      event.preventDefault()
      setIsDragging(true)
      setActiveThumbIndex(index)
      
      // Capturar eventos de puntero para manejar el arrastre fuera del componente
      if (thumbRefs.current[index]) {
        thumbRefs.current[index]?.setPointerCapture(event.pointerId)
      }
      
      handlePointerMove(event)
    }
    
    // Finalizar arrastre
    const stopDragging = () => {
      if (isDragging && onValueCommit) {
        onValueCommit(internalValue)
      }
      setIsDragging(false)
      setActiveThumbIndex(-1)
    }
    
    // Manejar movimiento de puntero durante el arrastre
    const handlePointerMove = (event: React.PointerEvent) => {
      if (!isDragging || activeThumbIndex === -1 || !trackRef.current) return
      
      const trackRect = trackRef.current.getBoundingClientRect()
      const isVertical = orientation === "vertical"
      const position = isVertical ? event.clientY : event.clientX
      
      const newValue = positionToValue(position, trackRect)
      updateValue(activeThumbIndex, newValue)
    }
    
    // Manejar clic en la pista
    const handleTrackPointerDown = (event: React.PointerEvent) => {
      if (disabled) return
      
      const trackRect = trackRef.current?.getBoundingClientRect()
      if (!trackRect) return
      
      // Encontrar el pulgar más cercano al punto de clic
      const isVertical = orientation === "vertical"
      const position = isVertical ? event.clientY : event.clientX
      const clickValue = positionToValue(position, trackRect)
      
      let closestThumbIndex = 0
      let minDistance = Math.abs(internalValue[0] - clickValue)
      
      for (let i = 1; i < internalValue.length; i++) {
        const distance = Math.abs(internalValue[i] - clickValue)
        if (distance < minDistance) {
          minDistance = distance
          closestThumbIndex = i
        }
      }
      
      updateValue(closestThumbIndex, clickValue)
      startDragging(event, closestThumbIndex)
    }
    
    // Construir los elementos del pulgar (thumb)
    const thumbs = internalValue.map((val, index) => {
      const percentage = getPercentage(val)
      const isVertical = orientation === "vertical"
      const isActive = activeThumbIndex === index
      
      const style: React.CSSProperties = isVertical
        ? { bottom: `${percentage}%` }
        : { left: `${percentage}%` }
      
      return (
        <div
          key={index}
          ref={(el) => (thumbRefs.current[index] = el)}
          className={cn(
            "absolute block h-4 w-4 rounded-md border-2 border-primary bg-primary/20 dark:bg-background shadow-md transition-colors",
            "hover:bg-primary/40 dark:hover:bg-primary/20",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
            {
              "bg-primary/50 dark:bg-primary/30": isActive,
              "cursor-not-allowed opacity-50": disabled,
            }
          )}
          style={style}
          data-dragging={isActive ? "true" : undefined}
          onPointerDown={(e) => startDragging(e, index)}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          aria-valuenow={val}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-orientation={orientation}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
        />
      )
    })
    
    // Calcular el ancho y la posición del rango para la visualización
    const rangeStyle: React.CSSProperties = { width: "0%" }
    
    if (internalValue.length === 1) {
      // Caso simple con un solo valor
      const percentage = getPercentage(internalValue[0])
      if (orientation === "vertical") {
        rangeStyle.height = `${percentage}%`
        rangeStyle.bottom = "0"
      } else {
        rangeStyle.width = `${percentage}%`
      }
    } else if (internalValue.length > 1) {
      // Caso de rango (dos o más valores)
      const minVal = Math.min(...internalValue)
      const maxVal = Math.max(...internalValue)
      const minPercentage = getPercentage(minVal)
      const maxPercentage = getPercentage(maxVal)
      
      if (orientation === "vertical") {
        rangeStyle.height = `${maxPercentage - minPercentage}%`
        rangeStyle.bottom = `${minPercentage}%`
      } else {
        rangeStyle.width = `${maxPercentage - minPercentage}%`
        rangeStyle.left = `${minPercentage}%`
      }
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex touch-none select-none items-center",
          orientation === "vertical" ? "h-full flex-col" : "w-full",
          className
        )}
        {...props}
      >
        <div
          ref={trackRef}
          className={cn(
            "relative overflow-hidden rounded-md",
            orientation === "vertical"
              ? "h-full w-1.5"
              : "h-1.5 w-full",
            "bg-muted"
          )}
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className={cn("absolute bg-primary", orientation === "vertical" ? "w-full" : "h-full")}
            style={rangeStyle}
          />
        </div>
        {thumbs}
      </div>
    )
  }
)
SliderComponent.displayName = "Slider"

// Optimización con memoización para prevenir re-renderizados innecesarios
const Slider = React.memo(
  SliderComponent,
  (prevProps, nextProps) => {
    // Comparar props relevantes
    if (prevProps.disabled !== nextProps.disabled) return false
    if (prevProps.min !== nextProps.min) return false
    if (prevProps.max !== nextProps.max) return false
    if (prevProps.step !== nextProps.step) return false
    if (prevProps.orientation !== nextProps.orientation) return false
    if (prevProps.dir !== nextProps.dir) return false
    
    // Comparación profunda de value
    const prevValue = prevProps.value || []
    const nextValue = nextProps.value || []
    if (prevValue.length !== nextValue.length) return false
    for (let i = 0; i < prevValue.length; i++) {
      if (prevValue[i] !== nextValue[i]) return false
    }
    
    return true
  }
)

export { Slider }
