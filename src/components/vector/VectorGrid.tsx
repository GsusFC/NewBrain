'use client'; // Si usas Next.js App Router

import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';

// Importar hook de throttle para optimizar eventos
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

// Importar utilidad de debounce para optimizar el ResizeObserver
import { debounce } from 'lodash';

// Importar utilidades de precisión para evitar errores de hidratación
import { fixPrecision } from '@/utils/precision';

// Importar hooks y tipos del núcleo del sistema de vectores
import { useVectorGrid } from './core/useVectorGrid'; 
import { useVectorAnimation } from './core/useVectorAnimation'; 
// Importar el VectorRenderer unificado
import { VectorRenderer } from './renderers/VectorRenderer';

// Importar el sistema de culling optimizado
import { applyCulling } from './core/culling';

// Importar función para obtener propiedades por defecto según tipo de animación
import { getDefaultPropsForType } from './core/animations/defaultProps';

// Importar hook de dimensiones actualizado
// Ya no usamos useContainerDimensions directamente en este componente

import type {
  VectorGridProps,
  VectorGridRef,
  AnimationSettings, 
  GridSettings, 
  VectorSettings,
} from './core/types';

// Establecer valores por defecto para evitar dimensiones null/undefined
// Este valor puede ser utilizado en el futuro si necesitamos dimensiones fijas
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_DIMENSIONS = { width: 800, height: 600 }; // Tamaño por defecto si no hay contenedor o props
const DEFAULT_GRID_SETTINGS: GridSettings = {
  rows: 15,
  cols: 20,
  spacing: 30,
  margin: 200
};
const DEFAULT_VECTOR_SETTINGS: VectorSettings = {
  vectorShape: 'arrow',
  vectorLength: 20,
  vectorWidth: 8,
  vectorColor: 'currentColor',
  strokeLinecap: 'round',
  rotationOrigin: 'center'
};
const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  animationType: 'smoothWaves',
  animationProps: {
    waveFrequency: 0.00025,
    waveAmplitude: 5
  },
  easingFactor: 0.05,
  timeScale: 1.0,
  dynamicLengthEnabled: true,
  dynamicWidthEnabled: false,
  dynamicIntensity: 0.7,
  isPaused: false
};

// Componente VectorGrid: Sistema de renderizado y animación de vectores
/**
 * VectorGrid - Componente para renderizar y animar una cuadrícula de vectores 2D.
 * 
 * @component
 * @example
 * ```tsx
 * <VectorGrid 
 *   gridSettings={{ rows: 20, cols: 30, spacing: 25, margin: 20 }}
 *   backgroundColor="#000"
 *   width={800} 
 *   height={600} 
 * />
 * ```
 */
// Actualizar las props para incluir cullingEnabled
interface ExtendedVectorGridProps extends VectorGridProps {
  /**
   * Habilita el sistema de culling para optimizar el renderizado de vectores
   * filtrando aquellos que están fuera del viewport o aplicando LOD
   * @default false
   */
  cullingEnabled?: boolean;
  
  /**
   * Callback para notificar cambios en la cantidad de vectores renderizados
   * Útil para debugging y métricas de rendimiento
   */
  onVectorCountChange?: (count: number) => void;
}

export const VectorGrid = forwardRef<VectorGridRef, ExtendedVectorGridProps>(
  (
    { 
      // Propiedades del Grid
      gridSettings,
      vectorSettings,
      backgroundColor = 'hsl(var(--background))',
      
      // Callback para métricas
      onVectorCountChange,

      // Propiedades de la animación
      animationType,
      animationProps,
      easingFactor,
      timeScale,
      dynamicLengthEnabled,
      dynamicWidthEnabled,
      dynamicIntensity,
      isPaused,
      throttleMs = 0, // 0 = sin throttle
      
      // Propiedades del contenedor
      width,
      height,
      containerFluid = true, // Por defecto, adaptarse al contenedor
      externalContainerRef,
      renderAsCanvas = false,
      debugMode = false,
      
      // Propiedades de optimización
      cullingEnabled = false, // Optimización de vectores fuera del viewport

      // Nuevas propiedades de aspecto
      aspectRatio = 'auto',
      customAspectRatio,
      
      // Callbacks
      onPulseComplete,
      onRenderFrame: _onRenderFrame, // Prefijado: no se usa internamente
    },
    ref
  ) => {
    const gridContainerRefInternal = useRef<HTMLDivElement>(null);
    const activeContainerRef = externalContainerRef || gridContainerRefInternal;
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
    
    // Estados para controlar la animación
    // Estado del disparador de pulso (number para timestamp)
    const [pulseTrigger, setPulseTrigger] = useState<number | null>(null);
    const [internalIsPaused, setInternalIsPaused] = useState<boolean>(isPaused || false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const [fade, setFade] = useState<number>(isPaused ? 0.6 : 1);
    
    // Sincronizar estado interno con prop isPaused
    useEffect(() => {
      setInternalIsPaused(isPaused || false);
    }, [isPaused]);
    
    // Efecto de transición cuando se pausa/reanuda la animación
    useEffect(() => {
      setFade(internalIsPaused ? 0.6 : 1);
    }, [internalIsPaused]);

    // Manejadores de eventos de ratón para React
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };
    
    // Aplicar throttle al evento de movimiento del mouse para mejor rendimiento
    const throttledMouseMove = useThrottledCallback(handleMouseMove, throttleMs || 16);
    
    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    // Estado para las dimensiones del contenedor con valores iniciales seguros
    const [containerSize, setContainerSize] = useState({
      width: !containerFluid && width ? width : (activeContainerRef.current?.clientWidth || DEFAULT_DIMENSIONS.width),
      height: !containerFluid && height ? height : (activeContainerRef.current?.clientHeight || DEFAULT_DIMENSIONS.height)
    });

    // Efecto para manejar el redimensionamiento cuando containerFluid es true
    // Definir updateSize con useCallback al nivel superior del componente - fuera del useEffect
    const updateSize = useCallback(() => {
      if (!activeContainerRef.current) return;
      
      const newWidth = activeContainerRef.current.clientWidth;
      const newHeight = activeContainerRef.current.clientHeight;
      
      // Solo actualizar si hay cambios significativos (más de 2px)
      if (
        Math.abs(newWidth - containerSize.width) > 2 || 
        Math.abs(newHeight - containerSize.height) > 2
      ) {
        setContainerSize({
          width: Math.max(newWidth, 10), // Garantizar dimensiones mínimas
          height: Math.max(newHeight, 10)
        });
        
        if (debugMode) {
          console.log('[VectorGrid] Actualización de dimensiones:', { newWidth, newHeight });
        }
      }
    }, [containerSize.width, containerSize.height, debugMode, activeContainerRef]);

    // Efecto para configurar el ResizeObserver
    useEffect(() => {
      if (!containerFluid || !activeContainerRef.current) return;
      
      // Configurar el ResizeObserver con debounce para reducir actualizaciones excesivas
      const debouncedUpdateSize = debounce(() => {
        requestAnimationFrame(updateSize); // Usar rAF para sincronizar con el ciclo de renderizado
      }, 100);
      
      resizeObserverRef.current = new ResizeObserver(debouncedUpdateSize);
      resizeObserverRef.current.observe(activeContainerRef.current);

      // Limpieza
      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
        debouncedUpdateSize.cancel(); // Cancelar debounce pendiente
      };
    }, [containerFluid]);

    // Usar las dimensiones actualizadas
    const actualWidth = !containerFluid && width ? width : containerSize.width;
    const actualHeight = !containerFluid && height ? height : containerSize.height;
    
    // Calcular las dimensiones finales del contenedor con validación para evitar valores inválidos
    const containerDimensions = useMemo(() => ({
      width: Math.max(width || containerSize.width || DEFAULT_DIMENSIONS.width, 10), // Garantizar mínimo 10px
      height: Math.max(height || containerSize.height || DEFAULT_DIMENSIONS.height, 10)
    }), [width, height, containerSize]);

    // Configuración final del grid con fallbacks para cada propiedad
    const finalGridSettings = useMemo<GridSettings>(() => ({
      rows: gridSettings?.rows ?? DEFAULT_GRID_SETTINGS.rows,
      cols: gridSettings?.cols ?? DEFAULT_GRID_SETTINGS.cols,
      spacing: gridSettings?.spacing ?? DEFAULT_GRID_SETTINGS.spacing,
      margin: gridSettings?.margin ?? DEFAULT_GRID_SETTINGS.margin
    }), [
      gridSettings?.rows, 
      gridSettings?.cols, 
      gridSettings?.spacing, 
      gridSettings?.margin
    ]);

    // Configuración final de los vectores
    const finalVectorSettings = useMemo<VectorSettings>(() => ({
      vectorShape: vectorSettings?.vectorShape ?? DEFAULT_VECTOR_SETTINGS.vectorShape,
      vectorLength: vectorSettings?.vectorLength ?? DEFAULT_VECTOR_SETTINGS.vectorLength,
      vectorWidth: vectorSettings?.vectorWidth ?? DEFAULT_VECTOR_SETTINGS.vectorWidth,
      vectorColor: vectorSettings?.vectorColor ?? DEFAULT_VECTOR_SETTINGS.vectorColor,
      strokeLinecap: vectorSettings?.strokeLinecap ?? DEFAULT_VECTOR_SETTINGS.strokeLinecap,
      rotationOrigin: vectorSettings?.rotationOrigin ?? DEFAULT_VECTOR_SETTINGS.rotationOrigin
    }), [
      vectorSettings?.vectorShape, 
      vectorSettings?.vectorLength, 
      vectorSettings?.vectorWidth,
      vectorSettings?.vectorColor,
      vectorSettings?.strokeLinecap,
      vectorSettings?.rotationOrigin
    ]);

    // Configuración final de la animación
    const finalAnimationSettings = useMemo(() => ({
      animationType: animationType ?? DEFAULT_ANIMATION_SETTINGS.animationType,
      animationProps: {
        ...(DEFAULT_ANIMATION_SETTINGS.animationProps),
        ...(animationType ? getDefaultPropsForType(animationType) : {}),
        ...(animationProps ?? {}),
      },
      isPaused: internalIsPaused, // Usar el estado interno que se sincroniza con las props
      easingFactor: easingFactor ?? DEFAULT_ANIMATION_SETTINGS.easingFactor,
      timeScale: timeScale ?? DEFAULT_ANIMATION_SETTINGS.timeScale,
      dynamicLengthEnabled: dynamicLengthEnabled ?? DEFAULT_ANIMATION_SETTINGS.dynamicLengthEnabled,
      dynamicWidthEnabled: dynamicWidthEnabled ?? DEFAULT_ANIMATION_SETTINGS.dynamicWidthEnabled,
      dynamicIntensity: dynamicIntensity ?? DEFAULT_ANIMATION_SETTINGS.dynamicIntensity,
      throttleMs
    }), [
      animationType, animationProps, internalIsPaused, easingFactor, timeScale,
      dynamicLengthEnabled, dynamicWidthEnabled, dynamicIntensity, throttleMs
    ]);

    // Hook useVectorGrid: genera la cuadrícula inicial de vectores
    const { initialVectors } = useVectorGrid({
      gridSettings: finalGridSettings,
      vectorSettings: finalVectorSettings,
      dimensions: containerDimensions,
    });
    
    // Asegurar que initialVectors existe y tiene elementos
    useEffect(() => {
      if (debugMode && (!initialVectors || initialVectors.length === 0)) {
        // eslint-disable-next-line no-console
        console.warn('[VectorGrid] initialVectors está vacío o no existe', { 
          dimensions: containerDimensions,
          gridSettings: finalGridSettings, 
          vectorSettings: finalVectorSettings
        });
      }
    }, [initialVectors, containerDimensions, finalGridSettings, finalVectorSettings, debugMode]);
    
    // Hook useVectorAnimation: calcula las animaciones de los vectores
    const { animatedVectors: rawAnimatedVectors } = useVectorAnimation({
      initialVectors: initialVectors, 
      dimensions: containerDimensions, 
      animationSettings: finalAnimationSettings,
      mousePosition: mousePosition, 
      containerRef: activeContainerRef,
      pulseTrigger: pulseTrigger,
      onPulseComplete, 
      onAllPulsesComplete: onPulseComplete 
    });
    
    // Aplicar culling optimizado con más padding para evitar pop-in en bordes
    const animatedVectors = useMemo(() => {
      // Verificación de seguridad para rawAnimatedVectors
      if (!rawAnimatedVectors || rawAnimatedVectors.length === 0) {
        return [];
      }
      
      if (cullingEnabled && containerDimensions.width > 0 && containerDimensions.height > 0) {
        // Aplicar el sistema de culling optimizado con padding aumentado para mejorar visibilidad
        const culledVectors = applyCulling(
          rawAnimatedVectors, 
          containerDimensions.width, 
          containerDimensions.height,
          { enableLOD: true, padding: 150 } // Aumentado de valores típicos (50-100) para evitar pop-in
        );
        
        // Log de depuración para ver el impacto del culling
        if (debugMode) {
          console.log('[VectorGrid] Culling aplicado:', {
            antes: rawAnimatedVectors.length,
            después: culledVectors.length,
            reducción: rawAnimatedVectors.length - culledVectors.length,
            porcentaje: ((rawAnimatedVectors.length - culledVectors.length) / rawAnimatedVectors.length * 100).toFixed(2) + '%'
          });
        }
        
        return culledVectors;
      }
      return rawAnimatedVectors;
    }, [rawAnimatedVectors, cullingEnabled, containerDimensions, debugMode]);

    // Notificar cambios en el conteo de vectores
    useEffect(() => {
      if (onVectorCountChange && animatedVectors) {
        onVectorCountChange(animatedVectors.length);
      }
      
      // Logging optimizado para debug (solo en modo de depuración)
      if (debugMode) {
        console.group('[VectorGrid] Debug Info');
        console.log('Dimensiones:', containerDimensions);
        console.log('Vectores iniciales:', initialVectors?.length || 0);
        console.log('Vectores tras animación:', rawAnimatedVectors?.length || 0);
        console.log('Vectores tras culling:', animatedVectors?.length || 0);
        if (animatedVectors && animatedVectors.length > 0) {
          console.log('Vector ejemplo:', animatedVectors[0]);
        } else {
          console.log('Sin vectores para renderizar');
        }
        console.groupEnd();
      }
    }, [animatedVectors, rawAnimatedVectors, initialVectors, debugMode, containerDimensions, onVectorCountChange]);

    useImperativeHandle(ref, () => ({
      /**
       * Dispara un pulso de animación en todos los vectores o en uno específico.
       * @param vectorId - ID opcional o array de IDs de vectores específicos para animar
       */
      triggerPulse: (vectorId?: string | string[]) => {
        if (debugMode) console.log('[VectorGrid] triggerPulse', vectorId);
        // Usar performance.now() para mayor precisión
        setPulseTrigger(performance.now());
        return true;
      }, 
      
      /**
       * Alterna entre pausar y reanudar la animación de vectores.
       * @returns {boolean} El nuevo estado de pausa (true = pausado)
       */
      togglePause: () => {
        if (debugMode) {
          // eslint-disable-next-line no-console
          console.log('[VectorGrid] togglePause called from ref');
        }
        // Invertir el estado interno de pausa
        const newState = !internalIsPaused;
        setInternalIsPaused(newState);
        
        // Usar newState en lugar de internalIsPaused para evitar el cierre obsoleto
        const timeout = setTimeout(() => {
          // Al final de la transición, comprobar si realmente está pausado
          if (newState) { // Usar newState en lugar de internalIsPaused
            // eslint-disable-next-line no-console
            if (debugMode) {
              console.info('[VectorGrid] Animación pausada');
            }
            // Código adicional al pausar si es necesario
          }
        }, 300); // Esperar a que termine la transición CSS
        
        // Limpiar el timeout al desmontar
        return () => clearTimeout(timeout);
      },
      
      /**
       * Obtiene la colección actual de vectores animados.
       * @returns {AnimatedVectorItem[]} Array de items de vectores con sus propiedades actuales
       */
      getVectors: () => {
        // Devolver colección actual de vectores animados
        return animatedVectors;
      },
      // Añadir más métodos según sea necesario
    }));

    // --- RENDERIZADO ---
    // Componente base que cambia entre SVG y Canvas
    // Log de dimensiones para debugging
    useEffect(() => {
      if (debugMode) {
        // eslint-disable-next-line no-console
        console.log('[VectorGrid] Dimensiones:', { 
          containerDimensions,
          width,
          height
        });

        // Información sobre culling cuando está activado
        if (cullingEnabled) {
          // eslint-disable-next-line no-console
          console.info('[VectorGrid] Culling optimizado activado para vectores largos/gruesos');
        }
      }
    }, [containerDimensions, width, height, debugMode, cullingEnabled]);
    
    // Componente de depuración visual
    const DebugOverlay = () => {
      if (!debugMode) return null;
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="border-2 border-dashed border-red-500" 
            style={{ 
              width: `${containerDimensions.width}px`, 
              height: `${containerDimensions.height}px`,
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded z-50">
            <p>Dimensiones: {containerDimensions.width}×{containerDimensions.height}px</p>
            <p>Vectores: {animatedVectors?.length || 0} / {rawAnimatedVectors?.length || 0}</p>
            <p>Mouse: {mousePosition ? `${Math.round(mousePosition.x)},${Math.round(mousePosition.y)}` : 'fuera'}</p>
            <p>Estado: {internalIsPaused ? 'Pausado' : 'Animando'}</p>
            <p>Renderizador: SVG</p>
          </div>
        </div>
      );
    };
    
    // Renderizador mejorado con estructura DOM más limpia
    return (
      <div 
        ref={gridContainerRefInternal}
        className="vector-grid-renderer" 
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onMouseMove={throttledMouseMove}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        onKeyDown={(e) => {
          // Verificar si ref es de tipo RefObject antes de acceder a current
          if (!ref || typeof ref !== 'object' || !ref.current) return;
          
          // Permitir interacciones básicas por teclado
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Disparar pulso manualmente en lugar de usar ref
            setPulseTrigger(performance.now());
          } else if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            setInternalIsPaused(prev => !prev);
          }
        }}
        aria-roledescription="Grid de vectores interactivo"
        aria-label={`Grid de vectores con ${animatedVectors?.length || 0} elementos. ${internalIsPaused ? 'Animación pausada' : 'Animación activa'}`}
        aria-live="polite"
        data-vectors-count={animatedVectors?.length || 0}
        data-render-mode="svg" /* Forzar modo SVG */
        data-culling={cullingEnabled ? 'enabled' : 'disabled'}
      >
        {/* Contenedor del renderizador con dimensiones exactas y transición */}
        <div 
          style={{
            width: `${containerDimensions.width}px`,
            height: `${containerDimensions.height}px`,
            position: 'relative',
            backgroundColor: backgroundColor,
            overflow: 'hidden',
            opacity: fade,
            transition: 'opacity 0.4s cubic-bezier(.4,0,.2,1)',
            border: 'none',
          }}
        >
          {animatedVectors && animatedVectors.length > 0 ? (
            <VectorRenderer
              vectors={animatedVectors} 
              width={containerDimensions.width} 
              height={containerDimensions.height} 
              backgroundColor="transparent" // El fondo ya está en el div contenedor
              baseVectorLength={finalVectorSettings.vectorLength || DEFAULT_VECTOR_SETTINGS.vectorLength}
              baseVectorColor={finalVectorSettings.vectorColor || DEFAULT_VECTOR_SETTINGS.vectorColor}
              baseVectorWidth={finalVectorSettings.vectorWidth || DEFAULT_VECTOR_SETTINGS.vectorWidth}
              baseStrokeLinecap={finalVectorSettings.strokeLinecap || DEFAULT_VECTOR_SETTINGS.strokeLinecap}
              baseVectorShape={finalVectorSettings.vectorShape || DEFAULT_VECTOR_SETTINGS.vectorShape as any}
              baseRotationOrigin={finalVectorSettings.rotationOrigin || DEFAULT_VECTOR_SETTINGS.rotationOrigin}
              interactionEnabled={!internalIsPaused}
              cullingEnabled={cullingEnabled}
              debugMode={debugMode}
              // Usar renderMode según la prop renderAsCanvas
              renderMode="svg" /* Forzar renderer SVG - Canvas deshabilitado permanentemente */
            />
          ) : debugMode && (
            <div className="flex items-center justify-center w-full h-full text-red-500 bg-muted/80 text-sm">
              No hay vectores para renderizar. Verifica la configuración de la cuadrícula o las dimensiones.
            </div>
          )}
        </div>
        
        {/* Overlay de depuración desactivado */}
      </div>
    );
  }
);

VectorGrid.displayName = 'VectorGrid';
