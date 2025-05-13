'use client'; // Si usas Next.js App Router

import React, { useRef, useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';

// Importar hooks y tipos del núcleo del sistema de vectores
import { useVectorGrid } from './core/useVectorGrid'; 
import { useVectorAnimation } from './core/useVectorAnimation'; 
import VectorSvgRenderer from './renderers/VectorSvgRenderer'; // Importar SVG Renderer
import { VectorCanvasRenderer } from './renderers/VectorCanvasRenderer'; // Importar Canvas Renderer

// Importar hook de dimensiones actualizado
import { useContainerDimensions, UseContainerDimensionsArgs } from '@/hooks/vector/useContainerDimensions';

import type {
  VectorGridProps,
  VectorGridRef,
  AnimationSettings, 
  GridSettings, 
  VectorSettings,
} from './core/types';

// Establecer valores por defecto para evitar dimensiones null/undefined
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
  vectorColor: '#ffffff',
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
      backgroundColor = '#000000',

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
      aspectRatio = 'container',
      customAspectRatio,
      
      // Callbacks
      onPulseComplete,
      onRenderFrame: _onRenderFrame, // Prefijado: no se usa internamente
    },
    ref
  ) => {
    const gridContainerRefInternal = useRef<HTMLDivElement>(null);
    const activeContainerRef = externalContainerRef || gridContainerRefInternal;
    const [mousePosition, /* setMousePosition */] = useState<{ x: number; y: number } | null>(null);
    
    // Estados para controlar la animación
    const [pulseTrigger, setPulseTrigger] = useState<number | null>(null);
    const [internalIsPaused, setInternalIsPaused] = useState<boolean>(isPaused || false);
    
    // Sincronizar el estado interno con las props
    useEffect(() => {
      setInternalIsPaused(isPaused || false);
    }, [isPaused]);

    // Usar el hook mejorado de useContainerDimensions
    const containerDimensions = useContainerDimensions({
      containerRef: activeContainerRef,
      aspectRatio,
      customAspectRatio,
      fixedWidth: !containerFluid ? width : undefined,
      fixedHeight: !containerFluid ? height : undefined
    });

    // Mantener currentDimensions como estado para gestionar cambios y actualizaciones
    const [currentDimensions, setCurrentDimensions] = useState<{ width: number; height: number }>(
      !containerFluid && width && height 
        ? { width, height } 
        : DEFAULT_DIMENSIONS
    );

    // Actualizar currentDimensions cuando cambian las dimensiones del contenedor
    useEffect(() => {
      if (containerDimensions.width > 0 && containerDimensions.height > 0) {
        setCurrentDimensions(containerDimensions);
      }
    }, [containerDimensions.width, containerDimensions.height]);

    // Log inicial de props
    useEffect(() => {
      if (debugMode) {
        // console.log(`[VectorGrid] Render con props - width: ${width}, height: ${height}, aspectRatio: ${aspectRatio}`);
      }
    }, [width, height, aspectRatio, debugMode]);

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
      dimensions: currentDimensions,
    });
    
    // Asegurar que initialVectors existe y tiene elementos
    useEffect(() => {
      if (debugMode && (!initialVectors || initialVectors.length === 0)) {
        console.warn('[VectorGrid] initialVectors está vacío o no existe', { 
          dimensions: currentDimensions,
          gridSettings: finalGridSettings, 
          vectorSettings: finalVectorSettings
        });
      }
    }, [initialVectors, currentDimensions, finalGridSettings, finalVectorSettings, debugMode]);
    
    // Hook useVectorAnimation: calcula las animaciones de los vectores
    const { animatedVectors } = useVectorAnimation({
      initialVectors: initialVectors, 
      dimensions: currentDimensions, 
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
        console.log('[VectorGrid] animatedVectors:', animatedVectors.length, 
          animatedVectors.length > 0 ? {
            ejemplo: animatedVectors[0],
            color: finalVectorSettings.vectorColor
          } : 'sin vectores');
      }
    }, [animatedVectors, finalVectorSettings, debugMode]);

    useImperativeHandle(ref, () => ({
      // Métodos expuestos al padre a través de ref
      triggerPulse: (vectorId?: string | string[]) => {
        if (debugMode) {
          console.log('[VectorGrid] triggerPulse called from ref', vectorId);
        }
        // Activar el pulso estableciendo un nuevo timestamp
        setPulseTrigger(performance.now());
      },
      togglePause: () => {
        if (debugMode) {
          console.log('[VectorGrid] togglePause called from ref');
        }
        // Invertir el estado interno de pausa
        setInternalIsPaused(!internalIsPaused);
      },
      getVectors: () => {
        // Implementar método para obtener vectores según la interfaz VectorGridRef
        return animatedVectors;
      },
      // Añadir más métodos según sea necesario
    }));

    // --- RENDERIZADO ---
    // Componente base que cambia entre SVG y Canvas
    return (
      <div 
        ref={gridContainerRefInternal}
        className="vector-grid-container" 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          backgroundColor: backgroundColor || '#000'
        }}
        data-vectors-count={animatedVectors.length}
        data-render-mode={renderAsCanvas ? 'canvas' : 'svg'}
      >
        {renderAsCanvas ? (
          <VectorCanvasRenderer 
            vectors={animatedVectors} 
            width={currentDimensions.width} 
            height={currentDimensions.height} 
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
            width={currentDimensions.width} 
            height={currentDimensions.height} 
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
    );
  }
);

VectorGrid.displayName = 'VectorGrid';
