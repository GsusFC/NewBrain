'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { VectorGrid } from './VectorGrid';
import { LeftControlPanelWithStore } from './controls/LeftControlPanelWithStore';
import { cn } from '@/lib/utils';
import { RightControlPanelWithStore } from './controls/RightControlPanelWithStore';
import type { 
  VectorGridProps, 
  VectorGridRef, 
  AspectRatioOption, 
  GridSettings, 
  VectorSettings 
} from './core/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Nuevo hook para dimensionamiento centralizado
import { useGridDimensions } from '@/hooks/vector/useGridDimensions';

// Importar el store centralizado y hooks selectores
import { 
  useAnimationSettings,
  useGridSettings,
  useVectorSettings,
  useRenderSettings,
  useExportableState,
  useUpdateProps,
  useMouseInteraction
} from './store/improved/hooks';

import { useGridContainer } from './core/hooks/useGridContainer';
import { useVectorAnimationOptimized } from './core/hooks/useVectorAnimationOptimized';
import { useVectorGrid } from './core/useVectorGrid';

/**
 * VectorPlayground con arquitectura mejorada utilizando Zustand y selectores
 * Esta versión elimina los ciclos de renderizado y optimiza el rendimiento general
 */
export const VectorPlaygroundWithStore: React.FC = () => {
  // Referencias para componentes DOM
  const vectorGridRef = useRef<VectorGridRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeElementRef = useRef<Element | null>(null);
  
  // Estado local UI (solo para feedback visual)
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [fade, setFade] = useState(1);
  
  // Custom hook para las dimensiones del contenedor
  const { containerSize } = useGridContainer(containerRef);
  
  // Determinar si estamos en modo desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Hooks selectores para diferentes partes del estado global
  const {
    animationType, 
    animationProps, 
    easingFactor,
    timeScale,
    isPaused, 
    dynamicLengthEnabled, 
    dynamicWidthEnabled,
    dynamicIntensity,
    togglePause,
    setAnimationType
  } = useAnimationSettings();
  
  const {
    gridSettings,
    aspectRatio,
    customAspectRatio,
    setGridSettings,
    setAspectRatio
  } = useGridSettings();
  
  // Nuevo hook para cálculo preciso de dimensiones y centrado
  const {
    width,
    height,
    gridOffsetX,
    gridOffsetY,
    effectiveWidth,
    effectiveHeight
  } = useGridDimensions({
    aspectRatio: aspectRatio as AspectRatioOption,
    containerRef,
    margin: gridSettings?.margin ?? 20,
    forceRecalculation: isRecalculating,
    debug: true // Activar debug en el hook
  });
  
  // Log de dimensiones solo en desarrollo
  useEffect(() => {
    if (!isDevelopment) return;
    
    console.log('VectorPlaygroundWithStore - Dimensiones calculadas:', {
      width,
      height,
      gridOffsetX,
      gridOffsetY,
      effectiveWidth,
      effectiveHeight
    });
  }, [width, height, gridOffsetX, gridOffsetY, effectiveWidth, effectiveHeight]);
  
  const { 
    vectorSettings,
    setVectorSettings
  } = useVectorSettings();
  
  const {
    renderAsCanvas,
    throttleMs,
    backgroundColor,
    toggleRenderer,
    setThrottleMs
  } = useRenderSettings();
  
  const { setMousePosition } = useMouseInteraction();
  const updateProps = useUpdateProps();
  
  // Generar vectores iniciales con useVectorGrid al nivel superior
  // Nota: Aseguramos dimensiones válidas con los valores de containerSize mejorados
  const { initialVectors: gridInitialVectors } = useVectorGrid({
    dimensions: {
      width: containerSize.width,
      height: containerSize.height
    },
    gridSettings: {
      rows: gridSettings.rows,
      cols: gridSettings.cols,
      spacing: gridSettings.spacing,
      margin: gridSettings.margin,
      aspectRatio: gridSettings.aspectRatio || 'auto'
    },
    vectorSettings: {
      vectorShape: vectorSettings.vectorShape,
      initialRotation: vectorSettings.initialRotation || 0
    },
    debugMode: false
  });

  // Vectores iniciales memorizados
  const initialVectors = useMemo(() => {
    console.log('📈 useVectorGrid generó vectores:', gridInitialVectors.length);
    
    // Ya no es necesario verificar dimensiones aquí porque useGridContainer
    // siempre proporciona dimensiones válidas
    return gridInitialVectors;
  }, [gridInitialVectors]);
  
  // Vectores animados con nuestro hook optimizado
  const { 
    animatedVectors, 
    triggerPulse: hookTriggerPulse,
    setAnimatedVectors 
  } = useVectorAnimationOptimized(
    initialVectors,
    { 
      width: containerSize.width || 800, 
      height: containerSize.height || 600 
    },
    () => console.log('Pulso completado'), // onPulseComplete callback
    () => console.log('Todos los pulsos completados') // onAllPulsesComplete callback
  );
  
  // Efecto para regenerar vectores cuando cambia la configuración
  useEffect(() => {
    if (initialVectors.length > 0) {
      setAnimatedVectors(initialVectors);
    }
  }, [initialVectors, setAnimatedVectors]);
  
  // Efecto para actualizar el fade cuando cambia el estado de pausa
  useEffect(() => {
    setFade(isPaused ? 0.7 : 1);
  }, [isPaused]);
  
  // Handler para disparar el pulso - ya no necesario con la arquitectura completa de Zustand
  // La funcionalidad de trigger pulse ahora está integrada directamente en el LeftControlPanelWithStore
  const handleTriggerPulse = useCallback(() => {
    if (vectorGridRef.current) {
      vectorGridRef.current.triggerPulse();
    } else if (typeof hookTriggerPulse === 'function') {
      // Verificar que la función existe y llamarla con los argumentos correctos
      // La función espera centerX y centerY como números entre 0 y 1
      hookTriggerPulse(0.5, 0.5);
    }
  }, [hookTriggerPulse]);
  
  // Handler para eventos de ratón
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Actualizar posición del ratón en el store
    setMousePosition({ x, y });
  }, [setMousePosition]);
  
  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: null, y: null });
  }, [setMousePosition]);
  
  // Handler para clicks en vectores
  const handleVectorClick = useCallback((item, event) => {
    console.log('Vector clicked:', item, event);
    // Implementar lógica adicional según necesidad
  }, []);
  
  // Handler para la tecla espacio (pausa)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Actualizar la referencia al elemento activo
    activeElementRef.current = document.activeElement;
    
    // Solo activar si la tecla es espacio y no está enfocado un input, textarea o elemento similar
    if (e.code === 'Space' && activeElementRef.current) {
      const tagName = (activeElementRef.current as HTMLElement).tagName.toLowerCase();
      const isEditable = (activeElementRef.current as HTMLElement).isContentEditable;
      
      // Verificar que no estemos en un campo editable
      if (!['input', 'textarea', 'select', 'button'].includes(tagName) && !isEditable) {
        e.preventDefault();  
        togglePause();
      }
    }
  }, [togglePause]);
  
  // Efecto para manejar la pausa con la tecla espacio
  useEffect(() => {
    // Obtener el elemento activo para verificar si debemos activar el shortcut
    activeElementRef.current = document.activeElement;
    
    // Añadir event listener global
    window.addEventListener('keydown', handleKeyDown);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Efecto para recalcular la cuadrícula cuando cambia el tamaño del contenedor
  useEffect(() => {
    // Solo procedemos si tenemos un aspect ratio válido y dimensiones de contenedor razonables
    if (aspectRatio && 
        aspectRatio !== 'auto' && 
        containerSize.width > 10 && 
        containerSize.height > 10) {
      
      // Indicamos que estamos recalculando (para UI feedback)
      setIsRecalculating(true);
      
      // Pequeño timeout para permitir que la UI se actualice
      const timeoutId = setTimeout(() => {
        setIsRecalculating(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [aspectRatio, containerSize, customAspectRatio]);
  
  // Obtener todas las props necesarias para el componente VectorGrid
  const vectorGridProps = useExportableState();
  
  // Debug temporal para identificar el problema de vectores no visibles
  useEffect(() => {
    console.group('🔍 Depuración VectorGrid');
    console.log('Dimensiones del contenedor:', containerSize);
    console.log('Dimensiones efectivas:', { width: effectiveWidth, height: effectiveHeight });
    console.log('Grid Settings:', gridSettings);
    console.log('Vector Settings:', vectorSettings);
    console.log('Vectores iniciales:', initialVectors.length);
    console.log('Vectores animados:', animatedVectors.length);
    console.log('Render mode:', renderAsCanvas ? 'Canvas' : 'SVG');
    console.groupEnd();
  }, [containerSize, effectiveWidth, effectiveHeight, gridSettings, vectorSettings, initialVectors.length, animatedVectors.length, renderAsCanvas]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[360px_1fr_360px] w-full h-[100dvh] overflow-hidden bg-background/30">
      {/* Columna 1: Panel Izquierdo (Animaciones) - Versión Zustand */}
      <div className="shadow-md md:shadow-inner md:shadow-r overflow-auto bg-card/95 backdrop-blur-sm order-1 md:order-1 transition-all">
        <LeftControlPanelWithStore />
      </div>
      
      {/* Columna 2: Área Principal */}
      <div className="flex flex-col bg-background order-2 md:order-2">
        {/* Menú Superior */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="renderMode" className="text-xs font-medium">Canvas</Label>
              <Switch 
                id="renderMode"
                checked={renderAsCanvas}
                onChange={toggleRenderer}
                aria-label="Cambiar modo de renderizado"
              />
              <Label htmlFor="renderMode" className="text-xs font-medium">SVG</Label>
            </div>
            
            <div className="flex items-center space-x-1">
              <Label htmlFor="fpsInput" className="text-xs font-medium">FPS</Label>
              <Input
                id="fpsInput"
                type="number"
                min={1}
                max={240}
                value={throttleMs ? (1000 / throttleMs).toFixed(0) : '60'} 
                onChange={(e) => {
                  const fps = parseInt(e.target.value, 10);
                  if (!isNaN(fps) && fps > 0 && fps <= 240) {
                    setThrottleMs(1000 / fps);
                  }
                }}
                aria-label="Cuadros por segundo"
                className="w-16 text-center"
              />
            </div>
          </div>
          
          {/* Selector de tema */}
          <div className="flex items-center">
            <ThemeToggle />
            
            {/* Info */}
            <div className="text-sm font-medium">
              {gridSettings?.rows && gridSettings?.cols 
                ? `${gridSettings.rows}×${gridSettings.cols} | ${animationType}` 
                : 'Cargando...'}
            </div>
            
            {/* Botón de Pausa/Play mejorado */}
            <button 
              onClick={togglePause}
              className={cn(
                "relative p-2 rounded-full transition-all duration-200 group",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/70",
                isPaused 
                  ? "text-primary hover:bg-primary/10" 
                  : "text-foreground/80 hover:bg-muted/50"
              )}
              title={`${isPaused ? "Reanudar" : "Pausar"} [Espacio]`}
              aria-label={isPaused ? "Reanudar animación" : "Pausar animación"}
              aria-pressed={isPaused}
            >
              {/* Fondo de estado activo */}
              <span className={cn(
                "absolute inset-0 rounded-full bg-primary/5 opacity-0 transition-opacity duration-200",
                isPaused ? "opacity-100" : "group-hover:opacity-100"
              )} />
              
              {/* Icono de pausa/reproducción */}
              <span className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8",
                "transform transition-transform duration-200 group-active:scale-95"
              )}>
                {isPaused ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transform translate-x-0.5"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
              </span>
              
              {/* Efecto de ripple al hacer clic */}
              <span className={cn(
                "absolute inset-0 rounded-full bg-current opacity-0",
                "group-active:opacity-20 group-active:animate-ripple"
              )} />
            </button>
          </div>
        </div>
        {/* Área Principal */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden order-1 md:order-2 transition-all" role="main">
          <div
            className="relative h-full w-full bg-slate-900 dark:bg-slate-900 overflow-hidden flex items-center justify-center"
            ref={containerRef}
            aria-label="Animación de vectores"
            style={{
              opacity: fade,
              transition: 'opacity 0.3s ease-in-out',
              position: 'relative'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Indicador visual de recálculo */}
            {isRecalculating && (
              <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono animate-pulse">
                Recalculando grid...
              </div>
            )}
            
            <VectorGrid
              ref={vectorGridRef}
              width={effectiveWidth}
              height={effectiveHeight}
              backgroundColor="#1a1a1a" // Fondo oscuro para buen contraste
              onVectorClick={handleVectorClick}
              renderAsCanvas={renderAsCanvas}
              gridSettings={{
                ...gridSettings,
                // Reducir márgen para centrar mejor los vectores
                margin: Math.min(gridSettings.margin, 30),
                // Asegurar que el espaciado es proporcional a las dimensiones
                spacing: Math.max(15, Math.min(gridSettings.spacing, 40))
              }}
              vectorSettings={{
                ...vectorSettings,
                vectorColor: "#a3a3a3" // Color más claro para mejor contraste
              }}
              animationType={animationType}
              animationProps={animationProps}
              isPaused={isPaused}
              easingFactor={easingFactor}
              timeScale={timeScale}
              dynamicLengthEnabled={dynamicLengthEnabled}
              dynamicWidthEnabled={dynamicWidthEnabled}
              dynamicIntensity={dynamicIntensity}
              cullingEnabled={true} // Habilitar culling para mejor rendimiento
              debugMode={false} // DESACTIVAR DEBUG para evitar exceso de logs
            />
          </div>
        </div>
      </div>
      
      {/* Columna 3: Panel Derecho (Configuración) - Versión Zustand */}
      <div className="shadow-md md:shadow-inner md:shadow-l overflow-auto bg-card/95 backdrop-blur-sm order-3 md:order-3 transition-all">
        <RightControlPanelWithStore />
      </div>
      
      {/* Contador de renders (solo para desarrollo) */}
      {isDevelopment && (
        <div className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded">
          <div>Contenedor: {containerSize.width.toFixed(0)}×{containerSize.height.toFixed(0)}</div>
          <div>Animación: {animationType}</div>
          <div>FPS: {throttleMs ? (1000 / throttleMs).toFixed(1) : '60'}</div>
        </div>
      )}
    </div>
  );
};

export default VectorPlaygroundWithStore;
