'use client'; // Si usas Next.js App Router

import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';

// Importar hook de throttle para optimizar eventos
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

// Importar utilidades de precisión para evitar errores de hidratación
import { fixPrecision } from '@/utils/precision';

// Importar hooks y tipos del núcleo del sistema de vectores
import { useVectorGrid } from './core/useVectorGrid'; 
import { useVectorAnimation } from './core/useVectorAnimation'; 
import VectorSvgRenderer from './renderers/VectorSvgRenderer'; // Importar SVG Renderer
import { VectorCanvasRenderer } from './renderers/VectorCanvasRenderer'; // Importar Canvas Renderer

// Importar el sistema de culling optimizado
import { applyCulling } from './core/culling';

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
}

export const VectorGrid = forwardRef<VectorGridRef, ExtendedVectorGridProps>(
  (
    { 
      // Propiedades del Grid
      gridSettings,
      vectorSettings,
      backgroundColor = 'rgb(var(--background))',

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

    // Estado para las dimensiones del contenedor
    const [containerSize, setContainerSize] = useState({
      width: !containerFluid && width ? width : (activeContainerRef.current?.clientWidth || 0),
      height: !containerFluid && height ? height : (activeContainerRef.current?.clientHeight || 0)
    });

    // Efecto para manejar el redimensionamiento cuando containerFluid es true
    useEffect(() => {
      if (!containerFluid || !activeContainerRef.current) return;

      const updateSize = () => {
        if (!activeContainerRef.current) return;
        setContainerSize({
          width: activeContainerRef.current.clientWidth,
          height: activeContainerRef.current.clientHeight
        });
      };

      // Configurar el ResizeObserver
      resizeObserverRef.current = new ResizeObserver(updateSize);
      resizeObserverRef.current.observe(activeContainerRef.current);

      // Limpieza
      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
      };
    }, [containerFluid]);

    // Usar las dimensiones actualizadas
    const actualWidth = !containerFluid && width ? width : containerSize.width;
    const actualHeight = !containerFluid && height ? height : containerSize.height;
    
    // Dimensiones actuales del contenedor (para cálculos internos)
    const containerDimensions = useMemo(() => ({
      width: actualWidth, 
      height: actualHeight
    }), [actualWidth, actualHeight]);

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
      animationProps: animationProps ?? DEFAULT_ANIMATION_SETTINGS.animationProps,
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
    
    // Aplicar culling si está habilitado
    const animatedVectors = useMemo(() => {
      if (cullingEnabled && containerDimensions.width > 0 && containerDimensions.height > 0) {
        // Aplicar el sistema de culling optimizado para filtrar vectores que no son visibles
        const visibleVectors = applyCulling(
          rawAnimatedVectors,
          fixPrecision(containerDimensions.width, 2),
          fixPrecision(containerDimensions.height, 2),
          { enableLOD: true, padding: 50 }
        );
        
        if (debugMode) {
          // eslint-disable-next-line no-console
          console.info(`[VectorGrid] Culling aplicado: ${visibleVectors.length} de ${rawAnimatedVectors.length} vectores visibles`);
        }
        
        return visibleVectors;
      }
      
      return rawAnimatedVectors;
    }, [rawAnimatedVectors, cullingEnabled, containerDimensions, debugMode]);
    
    // Depuración para verificar los vectores animados
    useEffect(() => {
      if (debugMode) {
        // eslint-disable-next-line no-console
        console.log('[VectorGrid] animatedVectors:', animatedVectors.length);
        if (animatedVectors.length > 0) {
          // eslint-disable-next-line no-console
          console.log({
            ejemplo: animatedVectors[0],
            color: finalVectorSettings.vectorColor
          });
        } else {
          // eslint-disable-next-line no-console
          console.log('sin vectores');
        }
      }
    }, [animatedVectors, finalVectorSettings, debugMode]);

    useImperativeHandle(ref, () => ({
      /**
       * Dispara un pulso de animación en todos los vectores o en uno específico.
       * @param vectorId - ID opcional o array de IDs de vectores específicos para animar
       */
      triggerPulse: (vectorId?: string | string[]) => {
        if (debugMode) {
          // eslint-disable-next-line no-console
          console.log('[VectorGrid] triggerPulse called from ref', vectorId);
        }
        // Activar el pulso estableciendo un nuevo timestamp
        setPulseTrigger(performance.now());
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
    
    // Renderizador simplificado con estructura DOM más limpia
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
        aria-roledescription="Grid de vectores interactivo"
        aria-label={`Grid de vectores con ${animatedVectors.length} elementos`}
        aria-live="polite"
        data-vectors-count={animatedVectors.length}
        data-render-mode={renderAsCanvas ? 'canvas' : 'svg'}
        data-culling={cullingEnabled ? 'enabled' : 'disabled'}
        onMouseMove={throttledMouseMove}
        onMouseLeave={handleMouseLeave}
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
            border: debugMode ? '1px solid limegreen' : 'none',
          }}
        >
          {renderAsCanvas ? (
            <VectorCanvasRenderer 
              vectors={animatedVectors} 
              width={containerDimensions.width} 
              height={containerDimensions.height} 
              backgroundColor="transparent" // El fondo ya está en el div contenedor
              baseVectorLength={finalVectorSettings.vectorLength || DEFAULT_VECTOR_SETTINGS.vectorLength}
              baseVectorColor={finalVectorSettings.vectorColor || DEFAULT_VECTOR_SETTINGS.vectorColor}
              baseVectorWidth={finalVectorSettings.vectorWidth || DEFAULT_VECTOR_SETTINGS.vectorWidth}
              baseStrokeLinecap={finalVectorSettings.strokeLinecap || DEFAULT_VECTOR_SETTINGS.strokeLinecap}
              baseVectorShape={finalVectorSettings.vectorShape || DEFAULT_VECTOR_SETTINGS.vectorShape}
              baseRotationOrigin={finalVectorSettings.rotationOrigin || DEFAULT_VECTOR_SETTINGS.rotationOrigin}
              interactionEnabled={!internalIsPaused}
              cullingEnabled={cullingEnabled}
              debugMode={debugMode}
            />
          ) : (
            <VectorSvgRenderer 
              vectors={animatedVectors} 
              width={containerDimensions.width} 
              height={containerDimensions.height} 
              backgroundColor="transparent" // El fondo ya está en el div contenedor
              baseVectorLength={finalVectorSettings.vectorLength || DEFAULT_VECTOR_SETTINGS.vectorLength}
              baseVectorColor={finalVectorSettings.vectorColor || DEFAULT_VECTOR_SETTINGS.vectorColor}
              baseVectorWidth={finalVectorSettings.vectorWidth || DEFAULT_VECTOR_SETTINGS.vectorWidth}
              baseStrokeLinecap={finalVectorSettings.strokeLinecap || DEFAULT_VECTOR_SETTINGS.strokeLinecap}
              baseVectorShape={finalVectorSettings.vectorShape || DEFAULT_VECTOR_SETTINGS.vectorShape}
              baseRotationOrigin={finalVectorSettings.rotationOrigin || DEFAULT_VECTOR_SETTINGS.rotationOrigin}
              interactionEnabled={!internalIsPaused}
              cullingEnabled={cullingEnabled}
              debugMode={debugMode}
            />
          )}
        </div>
      </div>
    );
  }
);

VectorGrid.displayName = 'VectorGrid';
