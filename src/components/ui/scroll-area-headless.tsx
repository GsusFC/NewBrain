"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportRef?: React.RefObject<HTMLDivElement>
  scrollHideDelay?: number
}

/**
 * Componente ScrollArea personalizado que reemplaza la implementación de Radix UI
 * Optimizado para evitar problemas de renderizado y ciclos infinitos
 */
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, viewportRef, scrollHideDelay = 600, ...props }, ref) => {
    // Referencias internas para los elementos DOM
    const rootRef = React.useRef<HTMLDivElement>(null)
    const internalViewportRef = React.useRef<HTMLDivElement>(null)
    const thumbRef = React.useRef<HTMLDivElement>(null)
    
    // Estado para controlar la visibilidad de la barra de desplazamiento
    const [showScrollbar, setShowScrollbar] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [thumbTop, setThumbTop] = React.useState(0)
    const [thumbHeight, setThumbHeight] = React.useState(0)
    
    // Referencias para temporizadores
    const hideTimeoutRef = React.useRef<number | null>(null)
    const scrollStartPosRef = React.useRef(0)
    const thumbStartPosRef = React.useRef(0)
    
    // Función para obtener el viewport actual (siempre fresco)
    const getViewportEl = React.useCallback(() => {
      return viewportRef?.current ?? internalViewportRef.current
    }, [viewportRef, internalViewportRef])
    
    // Memoizar el contenido para evitar renderizados innecesarios
    const content = React.useMemo(() => children, [children])
    
    // Calcular las dimensiones del "thumb" (la parte arrastrable de la barra de desplazamiento)
    const updateThumbPosition = React.useCallback(() => {
      const viewportEl = getViewportEl()
      if (!viewportEl) return
      
      const { scrollTop, scrollHeight, clientHeight } = viewportEl
      
      // Solo mostrar barra de desplazamiento si hay suficiente contenido
      const hasScroll = scrollHeight > clientHeight
      
      if (hasScroll) {
        // Calcular la proporción del thumb
        const thumbRatio = clientHeight / scrollHeight
        const newThumbHeight = Math.max(20, clientHeight * thumbRatio)
        const denom = scrollHeight - clientHeight || 1 // Evitar división por cero
        const scrollRatio = scrollTop / denom
        const newThumbTop = scrollRatio * (clientHeight - newThumbHeight)
        
        setThumbHeight(newThumbHeight)
        setThumbTop(newThumbTop)
        setShowScrollbar(true)
        
        // Iniciar temporizador para ocultar la barra cuando deje de desplazar
        if (hideTimeoutRef.current !== null && !isDragging) {
          window.clearTimeout(hideTimeoutRef.current)
        }
        
        if (!isDragging) {
          hideTimeoutRef.current = window.setTimeout(() => {
            setShowScrollbar(false)
            hideTimeoutRef.current = null
          }, scrollHideDelay)
        }
      } else {
        setShowScrollbar(false)
      }
    }, [getViewportEl, isDragging, scrollHideDelay])
    
    // Actualizar la posición del thumb cuando se desplaza el contenido
    const handleScroll = React.useCallback(() => {
      updateThumbPosition()
    }, [updateThumbPosition])
    
    // Manejador para toques en dispositivos táctiles
    const handleTouchStart = React.useCallback(() => {
      setShowScrollbar(true)
    }, [])
    
    // Manejador para el movimiento del puntero durante el arrastre
    const handleMove = React.useCallback((e: MouseEvent | TouchEvent) => {
      const viewportEl = getViewportEl()
      if (!viewportEl) return
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const delta = clientY - thumbStartPosRef.current
      const { scrollHeight, clientHeight } = viewportEl
      
      // Obtener el tamaño actual del thumb para evitar valores obsoletos
      const currentThumbHeight = thumbRef.current?.offsetHeight ?? thumbHeight
      const denom = clientHeight - currentThumbHeight || 1 // Evitar división por cero
      const scrollRatio = (scrollHeight - clientHeight) / denom
      
      viewportEl.scrollTop = scrollStartPosRef.current + delta * scrollRatio
    }, [])
    
    // Manejador para soltar el thumb
    const handlePointerUp = React.useCallback(() => {
      setIsDragging(false)
      
      // Iniciar temporizador para ocultar la barra después del arrastre
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowScrollbar(false)
      }, scrollHideDelay)
    }, [scrollHideDelay])
    
    // Iniciar el arrastre del thumb
    const handleThumbMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault()
      
      const viewportEl = getViewportEl()
      if (!viewportEl) return
      
      // Registrar posiciones iniciales
      scrollStartPosRef.current = viewportEl.scrollTop
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      thumbStartPosRef.current = clientY
      
      setIsDragging(true)
      
      // Agregar listeners temporales para el arrastre
      const handleMoveInternal = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        handleMove(e)
      }
      
      const cleanup = () => {
        document.removeEventListener('mousemove', handleMoveInternal as EventListener)
        document.removeEventListener('touchmove', handleMoveInternal as EventListener, { passive: false } as AddEventListenerOptions)
        document.removeEventListener('mouseup', cleanup)
        document.removeEventListener('touchend', cleanup)
        document.removeEventListener('touchcancel', cleanup)
        setIsDragging(false)
        
        // Iniciar temporizador para ocultar la barra después del arrastre
        hideTimeoutRef.current = window.setTimeout(() => {
          setShowScrollbar(false)
        }, scrollHideDelay)
      }
      
      document.addEventListener('mousemove', handleMoveInternal as EventListener)
      document.addEventListener('touchmove', handleMoveInternal as EventListener, { passive: false } as AddEventListenerOptions)
      document.addEventListener('mouseup', cleanup, { once: true })
      document.addEventListener('touchend', cleanup, { once: true })
      document.addEventListener('touchcancel', cleanup, { once: true })
    }, [viewportRef, thumbHeight, scrollHideDelay])
    
    // Mostrar/ocultar la barra de desplazamiento
    const handlePointerEnter = React.useCallback(() => {
      setShowScrollbar(true)
    }, [])
    
    const handlePointerLeave = React.useCallback(() => {
      if (!isDragging) {
        setShowScrollbar(false)
      }
    }, [isDragging])
    
    // Actualizar thumb cuando cambia el tamaño de la ventana
    React.useEffect(() => {
      const handleResize = () => {
        updateThumbPosition()
      }
      
      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }, [updateThumbPosition])
    
    // Efecto para configurar el observer de mutación y los event listeners
    React.useEffect(() => {
      const element = getViewportEl()
      if (!element) return
      
      // Configurar el observer de mutación para detectar cambios en el contenido
      const observer = new MutationObserver(updateThumbPosition)
      observer.observe(element, { childList: true, subtree: true })
      
      // Configurar el evento de scroll
      element.addEventListener('scroll', handleScroll, { passive: true })
      
      // Actualizar la posición inicial del thumb
      updateThumbPosition()
      
      // Configurar el evento de redimensionamiento
      const handleResize = () => {
        updateThumbPosition()
      }
      
      window.addEventListener("resize", handleResize)
      
      return () => {
        observer.disconnect()
        element.removeEventListener('scroll', handleScroll)
        
        // Limpiar temporizador
        if (hideTimeoutRef.current !== null) {
          window.clearTimeout(hideTimeoutRef.current)
        }
      }
    }, [viewportRef, updateThumbPosition])
    
    return (
      <div
        ref={rootRef}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        {...props}
      >
        <div
          ref={viewportRef || internalViewportRef}
          className="h-full w-full overflow-auto scrollbar-hide rounded-[inherit]"
          onScroll={handleScroll}
        >
          {content}
        </div>
        
        {/* Barra de desplazamiento personalizada */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-2.5 transition-opacity duration-300",
            showScrollbar ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            ref={thumbRef}
            className="bg-gray-400 rounded-full hover:bg-gray-500 transition-colors"
            role="scrollbar"
            aria-valuenow={Math.round((thumbTop / (rootRef.current?.clientHeight || 1)) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              width: "8px",
              height: `${thumbHeight}px`,
              position: "absolute",
              right: "2px",
              top: `${thumbTop}px`,
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onMouseDown={handleThumbMouseDown}
            onTouchStart={handleThumbMouseDown}
          />
        </div>
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

// Exportar el componente con memo para prevenir re-renderizados innecesarios
export const MemoizedScrollArea = React.memo(ScrollArea)
export { MemoizedScrollArea as ScrollArea }
