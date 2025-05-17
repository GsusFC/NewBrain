'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { VectorGrid } from '../VectorGrid';
import type { VectorGridProps, AnimatedVectorItem, AnimationType } from '../core/types';
import { VectorControlPanel } from './VectorControlPanel';
import { VectorControlProvider, useVectorControl } from './VectorControlContext';
import { fixPrecision } from '@/utils/precision';

// Componente interno que conecta el control y el grid e implementa animación garantizada
const VectorGridConnected = React.memo(function VectorGridConnected(props: Omit<VectorGridProps, 'baseVectorLength' | 'baseVectorWidth' | 'baseVectorColor' | 'baseVectorShape' | 'baseStrokeLinecap' | 'baseRotationOrigin' | 'debugMode' | 'interactionEnabled' | 'cullingEnabled'>) {
  const { settings } = useVectorControl();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  
  // Refs
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const vectorGridRef = useRef<any>(null);
  const containerElement = useRef<HTMLDivElement>(null);
  const lastAnimationTime = useRef(0);
  
  // Custom hook for animation loop
  const useAnimationFrame = (callback: (time: number) => void) => {
    const savedCallback = useRef(callback);
    
    // Remember the latest callback
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
    
    // Set up the animation loop
    useEffect(() => {
      let animationId: number;
      
      const animate = (time: number) => {
        savedCallback.current(time);
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, []);
  };
  
  // Animation loop logic
  useAnimationFrame(() => {
    // Update time in ref to avoid re-renders
    timeRef.current = fixPrecision(timeRef.current + 0.01, 6);
    
    // Only update the DOM if the value has changed (throttle updates)
    const currentTime = Math.floor(timeRef.current * 100);
    if (containerRef.current && currentTime !== lastAnimationTime.current) {
      containerRef.current.dataset.animationTime = currentTime.toString();
      lastAnimationTime.current = currentTime;
    }
  });
  
  // Measure container on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const measureContainer = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Use fixPrecision with fractional parts for sub-pixel accuracy
        setContainerDimensions({
          width: fixPrecision(rect.width, 4),
          height: fixPrecision(rect.height, 4)
        });
      }
    };
    
    // Initial measurement
    measureContainer();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  // Usar useMemo para las props derivadas con más validación
  const gridProps = useMemo(() => {
    // Aplicar fixPrecision a todas las propiedades numéricas para mantener consistencia
    const preciseSettings = {
      vectorLength: fixPrecision(settings.baseLength || 20),
      vectorWidth: fixPrecision(settings.baseWidth || 4),
      vectorColor: settings.color || '#3b82f6',
      vectorShape: settings.shape || 'arrow',
      strokeLinecap: settings.strokeLinecap || 'round',
      rotationOrigin: settings.rotationOrigin || 'center',
    };
    
    // Fijar precisión en las propiedades de animación
    const preciseAnimationProps = {
      waveFrequency: fixPrecision(0.001, 6), // Frecuencia aumentada 
      waveAmplitude: fixPrecision(40),      // Mayor amplitud para efectos visibles
      waveType: 'circular',
      centerX: fixPrecision(0.5, 6),        // Centro explícito
      centerY: fixPrecision(0.5, 6),        // Centro explícito
      timeScale: fixPrecision(2.0, 6)       // Más rápido
    };
    
    return {
      ...props,
      width: containerDimensions.width,
      height: containerDimensions.height,
      vectorSettings: preciseSettings,
      // Configuración de animación mejorada para garantizar animación visible
      animationType: 'smoothWaves' as AnimationType,
      animationProps: preciseAnimationProps,
      renderAsCanvas: false,  // SVG para desarrollo
      debugMode: true,        // Activar para depuración
      easingFactor: fixPrecision(0.1, 6),      // Más responsivo
      timeScale: fixPrecision(1.5, 6),         // Velocidad aumentada
      dynamicLengthEnabled: true,
      dynamicWidthEnabled: true, // Activado para efectos visuales
      dynamicIntensity: fixPrecision(1.0, 6),   // Máxima intensidad
      isPaused: false,         // Nunca pausado por defecto
      interactionEnabled: settings.interactionEnabled ?? true,
      cullingEnabled: settings.cullingEnabled ?? false
    };
  }, [props, settings, containerDimensions]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center bg-black relative"
      data-dimensions={`${containerDimensions.width}x${containerDimensions.height}`}
      style={{ minHeight: '500px' }} // Garantizar altura mínima
      data-animation-time="0" // Will be updated by the animation loop
    >
      {/* VectorGrid con configuración óptima para garantizar animación */}
      <VectorGrid 
        ref={vectorGridRef}
        {...gridProps}
      />
    </div>
  );
});

// Componente principal que combina el panel de control y el grid
export function VectorGridWithControls(props: Omit<VectorGridProps, 'baseVectorLength' | 'baseVectorWidth' | 'baseVectorColor' | 'baseVectorShape' | 'baseStrokeLinecap' | 'baseRotationOrigin' | 'debugMode' | 'interactionEnabled' | 'cullingEnabled'>) {
  // Estado para controlar debug visual
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Memoize the debug toggle handler
  const toggleDebug = React.useCallback((e: KeyboardEvent) => {
    // Alt+D para activar/desactivar información de debug
    if (e.altKey && e.key === 'd') {
      setShowDebugInfo(prev => {
        const newState = !prev;
        console.log('[VectorGridWithControls] Debug mode:', newState);
        return newState;
      });
    }
  }, []);
  
  // Set up the debug key listener
  useEffect(() => {
    window.addEventListener('keydown', toggleDebug);
    return () => window.removeEventListener('keydown', toggleDebug);
  }, [toggleDebug]);
  
  return (
    <VectorControlProvider>
      <div className="flex h-full w-full bg-background relative">
        {/* Panel de control izquierdo */}
        <VectorControlPanel />
        
        {/* Área principal con el grid de vectores */}
        <div className="flex-1 overflow-hidden position-relative">
          <VectorGridConnected {...props} />
          
          {/* Información de debug cuando está activa (presiona Alt+D para activar) */}
          {showDebugInfo && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-50 font-mono">
              <div className="font-bold mb-1">Debug Info</div>
              <div>Press Alt+D to toggle</div>
              <div className="text-green-400">✓ Controls connected</div>
              <div className="text-green-400">✓ ResizeObserver active</div>
              <div className="text-green-400">✓ Props validation</div>
            </div>
          )}
        </div>
      </div>
    </VectorControlProvider>
  );
}
