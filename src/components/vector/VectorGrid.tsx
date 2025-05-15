'use client'; // Si usas Next.js App Router

import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
// La librería Victor se usa en otro lugar del proyecto, mantenemos la importación comentada para referencia
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Victor from 'victor';

// Importar hook de throttle para optimizar eventos
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

// Importar hooks y tipos del núcleo del sistema de vectores
import { useVectorGrid } from './core/useVectorGrid'; 
import { useVectorAnimation } from './core/useVectorAnimation'; 
import VectorSvgRenderer from './renderers/VectorSvgRenderer'; // Importar SVG Renderer
import { VectorCanvasRenderer } from './renderers/VectorCanvasRenderer'; // Importar Canvas Renderer

// Importar hook de dimensiones actualizado
import { useContainerDimensions, type AspectRatioOption } from '@/hooks/vector/useContainerDimensions';

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
export const VectorGrid = forwardRef<VectorGridRef, VectorGridProps>(
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
    const [fade, setFade] = useState<number>(1); // Para efecto de transición en pausa
    
    // Sincronizar el estado interno con las props
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

    // Usar el hook mejorado de useContainerDimensions
    const { dimensions: containerDimensions, observedDimensions } = useContainerDimensions({
      containerRef: activeContainerRef.current,
      aspectRatio: aspectRatio as AspectRatioOption,
      customAspectRatio,
      fixedWidth: !containerFluid ? width : undefined,
      fixedHeight: !containerFluid ? height : undefined
    });



    // --- CONFIGURACIÓN DE PARÁMETROS Y HOOKS ---
    // Los useMemo ayudan a evitar cálculos innecesarios en cada render

    // Configuración final de la grid
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
        console.warn('[VectorGrid] initialVectors está vacío o no existe', { 
          dimensions: containerDimensions,
          gridSettings: finalGridSettings, 
          vectorSettings: finalVectorSettings
        });
      }
    }, [initialVectors, containerDimensions, finalGridSettings, finalVectorSettings, debugMode]);
    
    // Hook useVectorAnimation: calcula las animaciones de los vectores
    const { animatedVectors } = useVectorAnimation({
      initialVectors: initialVectors, 
      dimensions: containerDimensions, 
      animationSettings: finalAnimationSettings,
      mousePosition: mousePosition, 
      containerRef: activeContainerRef,
      pulseTrigger: pulseTrigger,
      onPulseComplete, 
      onAllPulsesComplete: onPulseComplete 
    });
    
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
        return newState;
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
      if (debugMode && aspectRatio === 'auto') {
        // eslint-disable-next-line no-console
        console.log('[VectorGrid] Dimensiones actuales en modo Auto:', {
          containerDimensions,
          adjustment: containerDimensions.adjustment,
          observedDimensions
        });
      }
    }, [debugMode, aspectRatio, containerDimensions, observedDimensions]);
    
    // Validación básica: mostrar error si no hay vectores y estamos en modo debug
    if (debugMode && (!initialVectors || initialVectors.length === 0)) {
      return (
        <div className="vector-grid-error" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground)',
          background: 'var(--background)',
          fontSize: '14px',
          fontFamily: 'monospace',
          padding: '1rem',
          border: '1px dashed var(--border)',
          borderRadius: '4px'
        }}>
          Error: No se pudieron generar vectores iniciales.<br/>
          Verifica las dimensiones del contenedor y la configuración de la cuadrícula.
        </div>
      );
    }
    
    return (
      <div 
        ref={gridContainerRefInternal}
        className="vector-grid-container" 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          backgroundColor: 'var(--background)',
          // Optimizamos el centrado para el modo Auto
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // Estilo para debug
          border: debugMode ? '2px solid var(--border)' : 'none'
        }}
        // Más descriptivo para los lectores de pantalla
        aria-roledescription="Visualización interactiva de vectores"
        aria-label="Grid de vectores animados"
        // Utilizamos aria-live para notificar cambios en la animación
        aria-live="polite"
        data-vectors-count={animatedVectors.length}
        data-render-mode={renderAsCanvas ? 'canvas' : 'svg'}
        data-aspect-ratio-mode={aspectRatio}
        onMouseMove={throttledMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Contenedor interno para los renderizadores con dimensiones exactas */}
        <div 
          style={{
            width: `${containerDimensions.width}px`,
            height: `${containerDimensions.height}px`,
            position: 'relative',
            // Estilo para debug
            border: debugMode ? '1px dashed var(--border)' : 'none',
            boxSizing: 'border-box',
            // Efecto de transición para pausa/reanudación
            opacity: fade,
            transition: 'opacity 0.4s cubic-bezier(.4,0,.2,1)',
            // Asegurar que el renderizador interno esté centrado
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          data-aspect-ratio={aspectRatio}
          data-width={containerDimensions.width}
          data-height={containerDimensions.height}
        >
          <div style={{
            // Contenedor interno que mantiene las dimensiones exactas del renderizador
            // pero asegura que el contenido esté centrado
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center', // Centra horizontalmente
            alignItems: 'center',     // Centra verticalmente
            position: 'relative'
          }}>
            {/* Wrapper para mantener la proporción exacta según el aspect ratio */}
            <div style={{
              width: `${containerDimensions.width}px`,
              height: `${containerDimensions.height}px`,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {renderAsCanvas ? (
              <VectorCanvasRenderer 
                vectors={animatedVectors} 
                width={containerDimensions.width} 
                height={containerDimensions.height} 
                backgroundColor={backgroundColor}
                baseVectorLength={finalVectorSettings.vectorLength || DEFAULT_VECTOR_SETTINGS.vectorLength}
                baseVectorColor={finalVectorSettings.vectorColor || DEFAULT_VECTOR_SETTINGS.vectorColor}
                baseVectorWidth={finalVectorSettings.vectorWidth || DEFAULT_VECTOR_SETTINGS.vectorWidth}
                baseStrokeLinecap={finalVectorSettings.strokeLinecap || DEFAULT_VECTOR_SETTINGS.strokeLinecap}
                baseVectorShape={finalVectorSettings.vectorShape || DEFAULT_VECTOR_SETTINGS.vectorShape}
                baseRotationOrigin={finalVectorSettings.rotationOrigin || DEFAULT_VECTOR_SETTINGS.rotationOrigin}
                interactionEnabled={!internalIsPaused}
              />
            ) : (
              <VectorSvgRenderer 
                vectors={animatedVectors} 
                width={containerDimensions.width} 
                height={containerDimensions.height} 
                backgroundColor={backgroundColor}
                baseVectorLength={finalVectorSettings.vectorLength || DEFAULT_VECTOR_SETTINGS.vectorLength}
                baseVectorColor={finalVectorSettings.vectorColor || DEFAULT_VECTOR_SETTINGS.vectorColor}
                baseVectorWidth={finalVectorSettings.vectorWidth || DEFAULT_VECTOR_SETTINGS.vectorWidth}
                baseStrokeLinecap={finalVectorSettings.strokeLinecap || DEFAULT_VECTOR_SETTINGS.strokeLinecap}
                baseVectorShape={finalVectorSettings.vectorShape || DEFAULT_VECTOR_SETTINGS.vectorShape}
                baseRotationOrigin={finalVectorSettings.rotationOrigin || DEFAULT_VECTOR_SETTINGS.rotationOrigin}
                interactionEnabled={!internalIsPaused}
              />
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VectorGrid.displayName = 'VectorGrid';
