'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { VectorGrid } from '../VectorGrid';
import { LeftControlPanel } from '../controls/LeftControlPanel';
import { RightControlPanel } from '../controls/RightControlPanel';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useVectorGridStore } from '../store/improved/vectorGridStore';
import type { VectorGridRef } from '../core/types';

/**
 * Versión del VectorPlayground que utiliza Zustand para la gestión de estado
 * Este componente es un ejemplo de cómo se puede implementar el VectorGrid
 * utilizando un store centralizado para evitar problemas de ciclos de renderizado.
 */
export default function VectorGridWithZustand() {
  // Obtenemos todo el estado y acciones directamente del store
  const {
    // Estado
    gridSettings,
    vectorSettings,
    aspectRatio,
    customAspectRatio,
    animationType,
    animationProps,
    easingFactor,
    timeScale,
    dynamicLengthEnabled,
    dynamicWidthEnabled,
    dynamicIntensity,
    renderAsCanvas,
    throttleMs,
    isPaused,
    backgroundColor,
    
    // Acciones
    togglePause,
    setThrottleMs,
    
    // Exportar estado
    getExportableState
  } = useVectorGridStore();

  // Refs
  const vectorGridRef = useRef<VectorGridRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado local (solo para UI)
  const [fade, setFade] = useState(1);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Efecto de fade al pausar/reanudar
  useEffect(() => {
    setFade(isPaused ? 0.7 : 1);
  }, [isPaused]);
  
  // Para disparar el pulso
  const handleTriggerPulse = useCallback(() => {
    vectorGridRef.current?.triggerPulse();
  }, []);
  
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
  
  // Memoizamos el componente VectorGrid para evitar re-renders innecesarios
  const memoizedVectorGrid = useMemo(() => {
    // Construimos un objeto de props completo para VectorGrid
    const vectorGridProps = getExportableState();
    
    return (
      <VectorGrid 
        ref={vectorGridRef}
        {...vectorGridProps}
      />
    );
  }, [
    // Dependencias exactas para evitar renders innecesarios
    gridSettings,
    vectorSettings,
    animationType,
    animationProps,
    easingFactor,
    timeScale,
    dynamicLengthEnabled,
    dynamicWidthEnabled,
    dynamicIntensity,
    renderAsCanvas,
    throttleMs,
    isPaused,
    backgroundColor,
    getExportableState
  ]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[360px_1fr_360px] w-full h-[100dvh] overflow-hidden bg-background/30">
      {/* Columna 1: Panel Izquierdo (Animaciones) */}
      <div className="shadow-md md:shadow-inner md:shadow-r overflow-auto bg-card/95 backdrop-blur-sm order-1 md:order-1 transition-all">
        <LeftControlPanel 
          currentProps={getExportableState()}
          onPropsChange={(newValues) => {
            // Mapeamos a las acciones específicas del store
            if (newValues.gridSettings) {
              useVectorGridStore.getState().setGridSettings(newValues.gridSettings);
            }
            
            if (newValues.vectorSettings) {
              useVectorGridStore.getState().setVectorSettings(newValues.vectorSettings);
            }
            
            if (newValues.aspectRatio) {
              useVectorGridStore.getState().setAspectRatio(
                newValues.aspectRatio, 
                newValues.customAspectRatio
              );
            }
            
            // Actualizamos otras propiedades generales
            useVectorGridStore.getState().updateProps(newValues);
          }}
          onAnimationSettingsChange={(settings) => {
            useVectorGridStore.getState().updateAnimationSettings(settings);
          }}
          onTriggerPulse={handleTriggerPulse}
          onExportConfig={() => {
            // Implementación de exportación
            const config = getExportableState();
            console.log('Configuración exportada:', config);
            // Aquí se podría implementar la descarga como JSON
          }}
        />
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
                onCheckedChange={useVectorGridStore.getState().toggleRenderer}
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
            style={{
              opacity: fade,
              transition: 'opacity 0.3s cubic-bezier(.4,0,.2,1)',
              position: 'relative'
            }}
          >
            {/* Indicador visual de recálculo */}
            {isRecalculating && (
              <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono animate-pulse">
                Recalculando grid...
              </div>
            )}
            
            {/* VectorGrid con renderizado optimizado */}
            {memoizedVectorGrid}
          </div>
        </div>
      </div>
      
      {/* Columna 3: Panel Derecho (Grid Settings, Vector Settings) */}
      <div className="shadow-md md:shadow-inner md:shadow-l overflow-auto bg-card/95 backdrop-blur-sm order-3 md:order-3 transition-all">
        <RightControlPanel 
          currentProps={getExportableState()}
          onPropsChange={(newValues) => {
            // Actualizamos estado global
            useVectorGridStore.getState().updateProps(newValues);
          }}
          onGridSettingsChange={(newSettings) => {
            useVectorGridStore.getState().setGridSettings(newSettings);
          }}
          onVectorSettingsChange={(newSettings) => {
            useVectorGridStore.getState().setVectorSettings(newSettings);
          }}
        />
      </div>
    </div>
  );
}
