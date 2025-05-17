'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { VectorGrid } from '../VectorGrid';
import { LeftControlPanel } from '../controls/LeftControlPanel';
import { RightControlPanel } from '../controls/RightControlPanel';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useGridContainer } from '../core/hooks/useGridContainer';

// Importar nuestros hooks selectores optimizados desde la versión mejorada
import {
  useAnimationSettings,
  useGridSettings,
  useVectorSettings,
  useRenderSettings,
  useExportableState,
  useUpdateProps,
  useMouseInteraction
} from '../store/improved/hooks';

import type { VectorGridRef } from '../core/types';

/**
 * Versión optimizada del VectorPlayground que utiliza la arquitectura mejorada de Zustand
 * con hooks selectores específicos para minimizar renderizados y mejorar la performance.
 */
export default function VectorGridWithImproved() {
  // Referencias para el DOM
  const vectorGridRef = useRef<VectorGridRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom hook para las dimensiones del contenedor
  const { containerSize } = useGridContainer(containerRef);
  
  // Hooks selectores para diferentes partes del estado global
  const {
    animationType, animationProps, easingFactor, timeScale,
    isPaused, dynamicLengthEnabled, dynamicWidthEnabled, dynamicIntensity,
    togglePause, setAnimationType, updateAnimationProps
  } = useAnimationSettings();
  
  const {
    gridSettings, aspectRatio, customAspectRatio,
    setGridSettings, setAspectRatio
  } = useGridSettings();
  
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  
  const {
    renderAsCanvas, throttleMs, backgroundColor,
    toggleRenderer, setThrottleMs
  } = useRenderSettings();
  
  const { setMousePosition } = useMouseInteraction();
  
  // Obtener todas las props para VectorGrid
  const vectorGridProps = useExportableState();
  
  // Hook para actualizar múltiples propiedades
  const updateProps = useUpdateProps();
  
  // Función para disparar el pulso
  const handleTriggerPulse = useCallback(() => {
    vectorGridRef.current?.triggerPulse();
  }, []);
  
  // Manejar movimiento del mouse para actualizar el store
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;         // evitar NaN / Infinity
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  }, [setMousePosition, containerRef]);
  
  // Manejar cuando el mouse sale del área
  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: null, y: null });
  }, [setMousePosition]);
  
  // Manejar la tecla Espacio para pausar/reanudar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['input', 'textarea', 'select', 'button'].includes(
        (document.activeElement as HTMLElement)?.tagName?.toLowerCase() || ''
      )) {
        e.preventDefault();
        togglePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause]);
  
  // Información visual de qué componentes se están renderizando (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('VectorGridWithImproved rendering');
  }
  
  // Estilo para el efecto de fade cuando está pausado
  const opacityStyle = {
    opacity: isPaused ? 0.7 : 1,
    transition: 'opacity 0.3s cubic-bezier(.4,0,.2,1)'
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[360px_1fr_360px] w-full h-[100dvh] overflow-hidden bg-background/30">
      {/* Columna 1: Panel Izquierdo (Animaciones) */}
      <div className="shadow-md md:shadow-inner md:shadow-r overflow-auto bg-card/95 backdrop-blur-sm order-1 md:order-1 transition-all">
        <LeftControlPanel 
          currentProps={vectorGridProps}
          onPropsChange={updateProps}
          onAnimationSettingsChange={(settings) => {
            updateProps({
              animationType: settings.animationType,
              animationProps: settings.animationProps
            });
          }}
          onTriggerPulse={handleTriggerPulse}
          onExportConfig={() => {
            console.log('Configuración exportada:', vectorGridProps);
            
            // Crear un objeto Blob con la configuración en formato JSON
            const configBlob = new Blob(
              [JSON.stringify(vectorGridProps, null, 2)], 
              { type: 'application/json' }
            );
            
            // Crear un URL para el blob
            const url = URL.createObjectURL(configBlob);
            
            // Crear un elemento <a> temporal
            const link = document.createElement('a');
            link.href = url;
            link.download = `vector-grid-config_${new Date().toISOString().slice(0,10)}.json`;
            
            // Simular un clic en el enlace para iniciar la descarga
            document.body.appendChild(link);
            try {
              link.click();
            } finally {
              // Asegurarse de limpiar incluso si hay un error
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }}
        />
      </div>
      
      {/* Columna 2: Área Principal */}
      <div className="flex flex-col bg-background order-2 md:order-2">
        {/* Menú Superior */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="renderMode"
                checked={renderAsCanvas}
                onCheckedChange={toggleRenderer}
              />
              <Label htmlFor="renderMode" className="text-xs font-medium">
                Renderizar como {renderAsCanvas ? 'Canvas' : 'SVG'}
              </Label>
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
            
            {/* Botón de Pausa */}
            <button 
              onClick={togglePause}
              className="p-2 rounded hover:bg-muted transition-colors group"
              title={`${isPaused ? "Reanudar" : "Pausar"} [Espacio]`}
              aria-label={isPaused ? "Reanudar animación" : "Pausar animación"}
              aria-pressed={isPaused}
            >
              {isPaused ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              }
            </button>
          </div>
        </div>
        
        {/* Área Principal */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden order-1 md:order-2 transition-all" role="main">
          <div 
            ref={containerRef}
            className="w-full h-full bg-background rounded-lg overflow-hidden shadow-lg transition-shadow"
            aria-label="Animación de vectores"
            style={opacityStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* El indicador visual de recálculo se ha eliminado hasta implementar la lógica real */}
            
            {/* VectorGrid con props del store */}
            <VectorGrid 
              ref={vectorGridRef}
              {...vectorGridProps}
            />
          </div>
        </div>
      </div>
      
      {/* Columna 3: Panel Derecho (Grid Settings, Vector Settings) */}
      <div className="shadow-md md:shadow-inner md:shadow-l overflow-auto bg-card/95 backdrop-blur-sm order-3 md:order-3 transition-all">
        <RightControlPanel 
          currentProps={vectorGridProps}
          onPropsChange={updateProps}
          onGridSettingsChange={setGridSettings}
          onVectorSettingsChange={setVectorSettings}
        />
      </div>
      
      {/* Monitor de rendimiento (solo para desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 right-2 text-xs bg-black/80 text-white px-2 py-1 rounded">
          <div>Dimensiones: {containerSize.width.toFixed(0)}×{containerSize.height.toFixed(0)}</div>
          <div>Animación: {animationType}</div>
          <div>FPS: {throttleMs ? (1000 / throttleMs).toFixed(1) : '60'}</div>
          <div>Pausado: {isPaused ? 'Sí' : 'No'}</div>
        </div>
      )}
    </div>
  );
}
