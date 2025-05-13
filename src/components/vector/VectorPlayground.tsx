'use client';
import React, { useState, useRef, useCallback } from 'react';
import { VectorGrid } from './VectorGrid';
import type { VectorGridRef } from './VectorGrid';
import { LeftControlPanel } from './controls/LeftControlPanel';
import { RightControlPanel } from './controls/RightControlPanel';
import type { VectorGridProps, VectorShape, AnimationType, AnimationProps, GridSettings, VectorSettings } from './core/types'; // Asegúrate de importar todos los tipos necesarios
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Valores iniciales/por defecto para las props de VectorGrid
const INITIAL_GRID_PROPS: VectorGridProps = {
  backgroundColor: "#0f172a", // Un azul oscuro como fondo del canvas
  gridSettings: {
    rows: 12,
    cols: 18,
    spacing: 40,
    margin: 25,
  },
  vectorSettings: {
    vectorLength: 25,
    vectorColor: "#38bdf8", // Un azul cian brillante para los vectores
    vectorWidth: 2,
    strokeLinecap: "round", 
    vectorShape: "line" as VectorShape,
    rotationOrigin: "center",
  },
  animationType: "smoothWaves" as AnimationType,
  animationProps: {
    waveFrequency: 0.00025,
    waveAmplitude: 30,
    baseAngle: 0,
    patternScale: 0.012,
    // waveType: 'circular', // Si implementaste esta opción en smoothWaves
  } as AnimationProps, // Cast a AnimationProps si es un tipo más específico
  easingFactor: 0.12,
  timeScale: 1.0,
  dynamicLengthEnabled: true,
  dynamicWidthEnabled: false,
  dynamicIntensity: 0.7,
  renderAsCanvas: true, // Empezar con Canvas para rendimiento
  throttleMs: 16, // ~60fps
};

export default function VectorPlayground() {
  const [gridProps, setGridProps] = useState<VectorGridProps>(INITIAL_GRID_PROPS);
  const vectorGridRef = useRef<VectorGridRef>(null);

  // Callback general para actualizar props. Los paneles podrían filtrar qué envían.
  const handlePropsChange = useCallback((newValues: Partial<VectorGridProps>) => {
    setGridProps(prev => {
      // Manejo especial para fusionar animationProps si existen en ambos
      if (newValues.animationProps && prev.animationProps) {
        newValues.animationProps = { ...prev.animationProps, ...newValues.animationProps };
      }
      // Manejo especial para fusionar gridSettings
      if (newValues.gridSettings && prev.gridSettings) {
        newValues.gridSettings = { ...prev.gridSettings, ...newValues.gridSettings };
      }
      // Manejo especial para fusionar vectorSettings
      if (newValues.vectorSettings && prev.vectorSettings) {
        newValues.vectorSettings = { ...prev.vectorSettings, ...newValues.vectorSettings };
      }

      return {
        ...prev,
        ...newValues,
      };
    });
  }, []);

  const handleGridSettingsChange = useCallback((newGridSettings: Partial<GridSettings>) => {
    handlePropsChange({ gridSettings: newGridSettings });
  }, [handlePropsChange]);

  const handleVectorSettingsChange = useCallback((newVectorSettings: Partial<VectorSettings>) => {
    handlePropsChange({ vectorSettings: newVectorSettings });
  }, [handlePropsChange]);

  const handleAnimationSettingsChange = useCallback((newAnimationSettings: Partial<Pick<VectorGridProps, 'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => {
    handlePropsChange(newAnimationSettings);
  }, [handlePropsChange]);

  const handleTriggerPulse = useCallback(() => {
    vectorGridRef.current?.triggerPulse();
  }, []);

  return (
    <div className="grid grid-cols-[300px_1fr_300px] lg:grid-cols-[360px_1fr_360px] w-full h-screen max-h-screen overflow-hidden bg-slate-900 text-slate-50">
      {/* Columna 1: Panel Izquierdo (Animaciones, Exportar, etc.) */}
      <aside className="h-full border-r border-slate-700 bg-slate-800/50 shadow-lg">
        <LeftControlPanel 
          currentProps={gridProps} 
          onPropsChange={handlePropsChange} 
          onAnimationSettingsChange={handleAnimationSettingsChange} 
          onTriggerPulse={handleTriggerPulse}
        />
      </aside>

      {/* Columna 2: Área de Visualización Central (CON MENÚS) */}
      <main className="flex flex-col overflow-hidden"> {/* bg-slate-800 podría ser una opción aquí también */}
        {/* Menú Superior */}
        <header className="h-14 border-b border-slate-700 bg-slate-800/50 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-6">
            {/* Toggle Canvas/SVG */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="renderAsCanvasToggle" className="text-sm font-medium">SVG</Label>
              <Switch 
                id="renderAsCanvasToggle" 
                variant="rectangular" 
                checked={gridProps.renderAsCanvas} 
                onCheckedChange={c => handlePropsChange({renderAsCanvas: c})}
              />
              <Label htmlFor="renderAsCanvasToggle" className="text-sm font-medium">Canvas</Label>
            </div>
            
            {/* Control de FPS (Throttle) */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="throttleMsHeader" className="text-sm font-medium">FPS:</Label>
              <Input 
                id="throttleMsHeader" 
                type="number" 
                value={gridProps.throttleMs ? (1000 / gridProps.throttleMs).toFixed(0) : '60'} 
                onChange={(e) => {
                  const fps = parseInt(e.target.value, 10);
                  if (!isNaN(fps) && fps > 0 && fps <= 120) {
                    const throttleMs = Math.round(1000 / fps);
                    handlePropsChange({throttleMs: throttleMs});
                  }
                }} 
                className="w-16 h-8 text-xs text-right"
                min="1"
                max="120"
                step="1"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Info del Grid */}
            <div className="text-xs text-slate-400 mr-4">
              {gridProps.gridSettings?.rows && gridProps.gridSettings?.cols 
                ? `${gridProps.gridSettings.rows}×${gridProps.gridSettings.cols} | ${gridProps.animationType}` 
                : 'Cargando...'}
            </div>
            
            {/* Botón de Pausa */}
            <button 
              onClick={() => handlePropsChange({ isPaused: !gridProps.isPaused })}
              className="p-2 rounded hover:bg-slate-700 transition-colors"
              title={gridProps.isPaused ? "Reanudar" : "Pausar"}
            >
              {gridProps.isPaused ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              }
            </button>
          </div>
        </header>

        {/* Área de Visualización de VectorGrid */}
        <div className="flex-1 p-2 md:p-4 relative overflow-hidden">
          <div 
            className="w-full h-full relative bg-black" // El fondo del VectorGrid se controla por su prop backgroundColor
            style={{ borderRadius: 'var(--radius)' }} // Usar variable de radio de shadcn
          >
            <VectorGrid
              ref={vectorGridRef}
              {...gridProps}
              // Quitando la key para que VectorGrid y sus hooks manejen actualizaciones internas
            />
          </div>
        </div>

        {/* Menú Inferior */}
        <footer className="h-10 border-t border-slate-700 bg-slate-800/50 px-4 flex items-center justify-center shrink-0 text-xs text-slate-400">
          <p>
            {gridProps.gridSettings.rows && gridProps.gridSettings.cols ? `${gridProps.gridSettings.rows}x${gridProps.gridSettings.cols} Vectores` : 'Configurando...'} | 
            Anim: {gridProps.animationType} | 
            Renderer: {gridProps.renderAsCanvas ? 'Canvas' : 'SVG'}
          </p>
        </footer>
      </main>

      {/* Columna 3: Panel Derecho (Grid, Vectores, Estilos) */}
      <aside className="h-full border-l border-slate-700 bg-slate-800/50 shadow-lg">
        <RightControlPanel
          currentProps={gridProps}
          onGridSettingsChange={handleGridSettingsChange}
          onVectorSettingsChange={handleVectorSettingsChange}
          onPropsChange={handlePropsChange}
        />
      </aside>
    </div>
  );
}
