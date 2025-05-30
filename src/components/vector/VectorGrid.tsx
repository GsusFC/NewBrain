// Ruta: src/components/vector/VectorGrid.tsx
'use client'; // Si usas Next.js App Router

import React, { useRef, useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';

// Importar debounce para optimizar el ResizeObserver
import { debounce } from 'lodash'; // Asegurarse de que debounce esté importado

// Importar hooks y tipos del núcleo del sistema de vectores
import { useVectorGrid } from './core/useVectorGrid'; 
import { useVectorAnimation } from './core/useVectorAnimation'; 
import VectorSvgRenderer from './renderers/VectorSvgRenderer'; // Importar SVG Renderer
import { VectorCanvasRenderer } from './renderers/VectorCanvasRenderer'; // Importar Canvas Renderer

import type {
  VectorGridProps,
  VectorGridRef,
  AnimatedVectorItem, 
  AnimationSettings, 
  GridSettings, 
  VectorSettings,
} from './core/types';

const DEFAULT_GRID_SETTINGS: GridSettings = { rows: 10, cols: 10, spacing: 30, margin: 0, aspectRatio: 'auto' }; 
const DEFAULT_VECTOR_SETTINGS: VectorSettings = { 
  vectorColor: 'white',
  vectorLength: 20,
  vectorWidth: 2,
  vectorShape: 'line' as const,
  strokeLinecap: 'round' as const,
  rotationOrigin: 'center' as const,
};

const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  animationType: 'none',
  animationProps: {},
  isPaused: false,
  easingFactor: 0.1,
  timeScale: 1,
  dynamicLengthEnabled: false,
  dynamicWidthEnabled: false,
  dynamicIntensity: 1,
  throttleMs: 16, // Aproximadamente 60fps
};


const VectorGrid = forwardRef<VectorGridRef, VectorGridProps>(
  (
    {
      width = 600, 
      height = 400, 
      containerFluid = true, // <--- Añadir con default true
      externalContainerRef,
      className = '',
      style = {},
      debugMode = false,
      backgroundColor, // Prop para el fondo del SVG/Canvas
      gridSettings: userGridSettings = {},
      vectorSettings: userVectorSettings = {},
      animationType,
      animationProps = {},
      isPaused,
      easingFactor,
      timeScale,
      dynamicLengthEnabled,
      dynamicWidthEnabled,
      dynamicIntensity,
      throttleMs,
      renderAsCanvas = false, // Nueva prop con default false
      onVectorClick,
      onVectorHover,
      onPulseComplete,
      onRenderFrame,
    },
    ref
  ) => {
    const gridContainerRefInternal = useRef<HTMLDivElement>(null);
    const activeContainerRef = externalContainerRef || gridContainerRefInternal;
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // Para useVectorAnimation

    // Log inicial de props movido a useEffect para evitar bucle de renderizado
    useEffect(() => {
      if (debugMode) {
        console.log(`[VectorGrid] Initial render with props - width: ${width}, height: ${height}, containerFluid: ${containerFluid}`);
      }
    }, []);

    // --- OBSERVER PARA DIMENSIONES DEL CONTENEDOR ---
    // El estado 'currentDimensions' es el que usa useVectorGrid y el SVG Renderer
    const [currentDimensions, setCurrentDimensions] = useState<{ width: number; height: number }>({ width, height });
    
    // Función base para actualizar dimensiones, envuelta en useCallback para estabilidad
    const updateDimensionsCallback = useCallback((newWidth: number, newHeight: number) => {
      if (debugMode) {
        console.log(`[VectorGrid] ResizeObserver: updateDimensionsCallback CALLED with ${newWidth}x${newHeight}`);
      }
      setCurrentDimensions({ width: newWidth, height: newHeight });
    }, [debugMode]); // setCurrentDimensions es estable, debugMode es la única dependencia externa

    // Crear la versión debounced de updateDimensionsCallback usando useMemo
    // Esto asegura que debouncedSetDimensions sea estable a menos que updateDimensionsCallback cambie
    const debouncedSetDimensions = useMemo(
      () => debounce(updateDimensionsCallback, 100), // 100ms de debounce
      [updateDimensionsCallback]
    );

    useEffect(() => {
      const containerElement = externalContainerRef?.current || gridContainerRefInternal.current;

      if (containerFluid && containerElement) {
        if (debugMode) {
          console.log(`[VectorGrid] ResizeObserver EFFECT: Attaching to element:`, containerElement);
        }
        let lastWidth = 0;
        let lastHeight = 0;

        const resizeObserver = new ResizeObserver(entries => {
          // Log tan pronto como el callback del observer se dispara
          if (debugMode) console.log('[VectorGrid] ResizeObserver CALLBACK triggered.'); 

          for (let entry of entries) {
            const { width: newWidth, height: newHeight } = entry.contentRect;
            
            const hasSignificantChange =
              Math.abs(newWidth - lastWidth) >= 1 ||
              Math.abs(newHeight - lastHeight) >= 1;

            if (hasSignificantChange) {
              if (debugMode) {
                console.log(`[VectorGrid] ResizeObserver: Detected new dimensions: ${newWidth}x${newHeight}. Calling debouncedSetDimensions.`);
              }
              lastWidth = newWidth;
              lastHeight = newHeight;
              debouncedSetDimensions(newWidth, newHeight);
            }
          }
        });

        if (debugMode) {
          console.log('[VectorGrid] ResizeObserver: Attempting to observe:', containerElement);
        }
        resizeObserver.observe(containerElement);

        // Comprobación inicial por si el elemento ya tiene dimensiones al montar
        const initialRect = containerElement.getBoundingClientRect();
        if (initialRect.width > 0 && initialRect.height > 0) {
          if (debugMode) {
            console.log(`[VectorGrid] ResizeObserver: Initial check found dimensions ${initialRect.width}x${initialRect.height}. Calling debouncedSetDimensions.`);
          }
          // Actualizar lastWidth y lastHeight para evitar un disparo inmediato si son iguales
          lastWidth = initialRect.width;
          lastHeight = initialRect.height;
          debouncedSetDimensions(initialRect.width, initialRect.height);
        }

        return () => {
          if (debugMode) {
            console.log(`[VectorGrid] ResizeObserver CLEANUP: Disconnecting from element:`, containerElement);
          }
          resizeObserver.unobserve(containerElement);
          debouncedSetDimensions.cancel(); 
        };
      } else if (!containerFluid) {
        if (debugMode) console.log(`[VectorGrid] containerFluid is false, using fixed dimensions: ${width}x${height}`);
        setCurrentDimensions({ width, height });
      }
      // Asegurar que todas las dependencias necesarias y estables estén aquí.
      // externalContainerRef puede cambiar si el padre lo cambia.
      // gridContainerRefInternal.current no es una dependencia reactiva estable para useEffect.
      // En su lugar, dependemos de que containerFluid o las props width/height cambien.
    }, [containerFluid, width, height, debugMode, externalContainerRef, debouncedSetDimensions]);

    // Combina las props de gridSettings por defecto con las proporcionadas por el usuario
    const finalGridSettings = useMemo(() => ({
      ...DEFAULT_GRID_SETTINGS, 
      ...userGridSettings,
    }), [userGridSettings]);

    // Combina las props de vectorSettings por defecto con las proporcionadas por el usuario
    const finalVectorSettings = useMemo(() => ({
      ...DEFAULT_VECTOR_SETTINGS,
      ...userVectorSettings,
    }), [userVectorSettings]);

    // Hook useVectorGrid: calcula la disposición de la cuadrícula
    const { 
      initialVectors, 
      calculatedCols,
      calculatedRows,
    } = useVectorGrid({
      dimensions: currentDimensions,
      gridSettings: finalGridSettings,
      vectorSettings: finalVectorSettings,
      debugMode,
    });

    // Combina las props de animationSettings por defecto con las proporcionadas por el usuario
    const finalAnimationSettings = useMemo(() => ({
      animationType: animationType ?? DEFAULT_ANIMATION_SETTINGS.animationType,
      animationProps: animationProps ?? DEFAULT_ANIMATION_SETTINGS.animationProps,
      isPaused: isPaused ?? DEFAULT_ANIMATION_SETTINGS.isPaused,
      easingFactor: easingFactor ?? DEFAULT_ANIMATION_SETTINGS.easingFactor,
      timeScale: timeScale ?? DEFAULT_ANIMATION_SETTINGS.timeScale,
      dynamicLengthEnabled: dynamicLengthEnabled ?? DEFAULT_ANIMATION_SETTINGS.dynamicLengthEnabled,
      dynamicWidthEnabled: dynamicWidthEnabled ?? DEFAULT_ANIMATION_SETTINGS.dynamicWidthEnabled,
      dynamicIntensity: dynamicIntensity ?? DEFAULT_ANIMATION_SETTINGS.dynamicIntensity,
      throttleMs: throttleMs ?? DEFAULT_ANIMATION_SETTINGS.throttleMs,
    }), [
      animationType, animationProps, isPaused, easingFactor, timeScale, 
      dynamicLengthEnabled, dynamicWidthEnabled, dynamicIntensity, throttleMs
    ]);

    // Hook useVectorAnimation: calcula las animaciones de los vectores
    const { animatedVectors } = useVectorAnimation({
      initialVectors: initialVectors, 
      dimensions: currentDimensions, 
      animationSettings: finalAnimationSettings,
      mousePosition: mousePosition, 
      containerRef: activeContainerRef, 
      onPulseComplete, 
      onAllPulsesComplete: onPulseComplete 
    });

    useImperativeHandle(ref, () => ({
      triggerPulse: (vectorId?: string | string[]) => {
        console.log('[VectorGrid] Pulse triggered for:', vectorId || 'all vectors');
        // Aquí iría la lógica de pulso cuando la implementemos
      },
      getVectors: () => animatedVectors, 
    }));

    if (currentDimensions.width === 0 || currentDimensions.height === 0) {
      return <div ref={gridContainerRefInternal} className={className} style={{ ...style, width: '100%', height: '100%' }} />;
    }

    return (
      <div
        ref={gridContainerRefInternal} 
        className={`vector-grid-container ${className}`}
        style={{
          width: containerFluid ? '100%' : `${width}px`,
          height: containerFluid ? '100%' : `${height}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: renderAsCanvas ? backgroundColor : undefined, 
          ...style,
        }}
      >
        {!renderAsCanvas && (
          <VectorSvgRenderer 
            vectors={animatedVectors} 
            width={currentDimensions.width}
            height={currentDimensions.height}
            backgroundColor={backgroundColor}
            baseVectorLength={finalVectorSettings.vectorLength ?? DEFAULT_VECTOR_SETTINGS.vectorLength}
            baseVectorColor={finalVectorSettings.vectorColor}
            baseVectorWidth={finalVectorSettings.vectorWidth}
            baseVectorShape={finalVectorSettings.vectorShape}
            baseStrokeLinecap={finalVectorSettings.strokeLinecap}
            baseRotationOrigin={finalVectorSettings.rotationOrigin}
            onVectorClick={onVectorClick}
            onVectorHover={onVectorHover}
          />
        )}
        {renderAsCanvas && (
          <VectorCanvasRenderer 
            vectors={animatedVectors} 
            width={currentDimensions.width}
            height={currentDimensions.height}
            backgroundColor={backgroundColor}
            baseVectorLength={finalVectorSettings.vectorLength ?? DEFAULT_VECTOR_SETTINGS.vectorLength}
            baseVectorColor={finalVectorSettings.vectorColor}
            baseVectorWidth={finalVectorSettings.vectorWidth}
            baseVectorShape={finalVectorSettings.vectorShape}
            baseStrokeLinecap={finalVectorSettings.strokeLinecap}
            baseRotationOrigin={finalVectorSettings.rotationOrigin}
            userSvgString={finalGridSettings.userSvg}
            userSvgPreserveAspectRatio={finalGridSettings.userSvgPreserveAspectRatio}
            onVectorClick={onVectorClick}
            onVectorHover={onVectorHover}
            interactionEnabled={true}
            cullingEnabled={true}
            debugMode={debugMode}
          />
        )}

        {debugMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, color: 'yellow', fontSize: '10px', zIndex: 1000, whiteSpace: 'pre-wrap', pointerEvents: 'none' }}>
            W: {currentDimensions.width.toFixed(0)} H: {currentDimensions.height.toFixed(0)} | Initial: {initialVectors.length} | Animated: {animatedVectors.length}
            {animatedVectors[0] && ` | A[0].angle: ${animatedVectors[0].currentAngle.toFixed(2)}`}
            Renderer: {renderAsCanvas ? 'Canvas' : 'SVG'}
            Mouse: {mousePosition ? `X:${mousePosition.x.toFixed(0)} Y:${mousePosition.y.toFixed(0)}` : 'null'}
          </div>
        )}
      </div>
    );
  }
);

VectorGrid.displayName = 'VectorGrid';
export { VectorGrid };
export type { VectorGridProps, VectorGridRef };
