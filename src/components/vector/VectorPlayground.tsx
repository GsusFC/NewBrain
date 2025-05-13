'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VectorGrid } from './VectorGrid';
// Importamos todos los tipos necesarios, incluida la referencia de VectorGrid
import type { 
  VectorGridProps, 
  GridSettings, 
  VectorSettings, 
  AspectRatioOption,
  VectorGridRef 
} from './core/types';
import { LeftControlPanel } from './controls/LeftControlPanel';
import { RightControlPanel } from './controls/RightControlPanel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Los valores iniciales se han configurado para un resultado visual interesante por defecto
const INITIAL_GRID_PROPS: VectorGridProps = {
  gridSettings: {
    rows: 12,
    cols: 18,
    spacing: 30,
    margin: 20
  },
  vectorSettings: {
    shape: 'arrow' as const,
    length: 24,
    width: 4,
    color: '#00aaff',
    strokeLinecap: 'round' as const,
    rotationOrigin: 'center' as const
  },
  backgroundColor: '#000000',
  animationType: 'smoothWaves',
  animationProps: {
    waveFrequency: 0.00025,
    waveAmplitude: 30
  },
  easingFactor: 0.1,  // Más bajo = más suave pero más lento para responder
  timeScale: 1.0,     // Control de velocidad general
  dynamicLengthEnabled: true,
  dynamicWidthEnabled: false,
  dynamicIntensity: 0.7,
  renderAsCanvas: true, // Empezar con Canvas para rendimiento
  throttleMs: 16, // ~60fps
  isPaused: false,
  // Valores por defecto para el aspectRatio
  aspectRatio: 'container',
  customAspectRatio: { width: 16, height: 9 }
};



export default function VectorPlayground() {
  const [gridProps, setGridProps] = useState<VectorGridProps>(INITIAL_GRID_PROPS);
  const vectorGridRef = useRef<VectorGridRef>(null);
  
  // Referencia para el elemento que podría tener el foco cuando se presiona espacio
  // Evita activar la pausa si el usuario está escribiendo en un input
  const activeElementRef = useRef<Element | null>(null);

  // Callback general para actualizar props. Los paneles podrían filtrar qué envían.
  const handlePropsChange = useCallback((newValues: Partial<VectorGridProps>) => {
    setGridProps(prev => {
      // Manejo especial para fusionar animationProps si existen en ambos
      if (newValues.animationProps && prev.animationProps) {
        return {
          ...prev,
          ...newValues,
          animationProps: {
            ...prev.animationProps,
            ...newValues.animationProps
          }
        }
      }
      
      // Si no, simplemente fusionar como se hace normalmente
      return {
        ...prev,
        ...newValues
      }
    });
  }, []);

  // Para actualizar específicamente la configuración del grid
  const handleGridSettingsChange = useCallback((newGridSettings: Partial<GridSettings>) => {
    handlePropsChange({
      gridSettings: {
        ...gridProps.gridSettings,
        ...newGridSettings
      }
    });
  }, [gridProps.gridSettings, handlePropsChange]);

  // Para actualizar específicamente la configuración del vector
  const handleVectorSettingsChange = useCallback((newVectorSettings: Partial<VectorSettings>) => {
    handlePropsChange({
      vectorSettings: {
        ...gridProps.vectorSettings,
        ...newVectorSettings
      }
    });
  }, [gridProps.vectorSettings, handlePropsChange]);

  // Callback para manejar cambios específicos a la animación
  const handleAnimationSettingsChange = useCallback((newAnimationSettings: Partial<Pick<VectorGridProps, 'animationType' | 'animationProps' | 'easingFactor' | 'timeScale' | 'dynamicLengthEnabled' | 'dynamicWidthEnabled' | 'dynamicIntensity' | 'isPaused'>>) => {
    handlePropsChange(newAnimationSettings);
  }, [handlePropsChange]);

  // Trigger de pulso animado
  const handleTriggerPulse = useCallback(() => {
    vectorGridRef.current?.triggerPulse();
  }, []);
  
  // Toggle de pausa con la barra espaciadora
  const togglePause = useCallback(() => {
    handlePropsChange({ isPaused: !gridProps.isPaused });
  }, [gridProps.isPaused, handlePropsChange]);
  
  // Event listener para detectar la barra espaciadora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guardar el elemento activo cuando se presiona una tecla
      activeElementRef.current = document.activeElement;
      
      // Solo activar si la tecla es espacio y no está enfocado un input, textarea o elemento similar
      if (e.code === 'Space' && activeElementRef.current) {
        const tagName = (activeElementRef.current as HTMLElement).tagName.toLowerCase();
        const isEditable = (activeElementRef.current as HTMLElement).isContentEditable;
        
        // Verificar que no estemos en un campo editable
        if (!['input', 'textarea', 'select', 'button'].includes(tagName) && !isEditable) {
          e.preventDefault(); // Evitar scroll u otros comportamientos predeterminados
          togglePause();
        }
      }
    };
    
    // Añadir event listener global
    window.addEventListener('keydown', handleKeyDown);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePause]);

  // Comprobar si se están usando dimensiones fijas
  const dimensionsAreFixedByProps = typeof gridProps.width === 'number' && typeof gridProps.height === 'number';
  
  // Cálculo del aspect ratio resultante cuando se usan dimensiones fijas
  const calculatedFixedAspectRatio = dimensionsAreFixedByProps && gridProps.width && gridProps.height
    ? (gridProps.width / gridProps.height).toFixed(2)
    : null;
    
  // Estados para el panel expandible de aspect ratio personalizado
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [tempCustomAspect, setTempCustomAspect] = useState(() => ({ 
    width: gridProps.customAspectRatio?.width || 16, 
    height: gridProps.customAspectRatio?.height || 9 
  }));

  // Actualizar tempCustomAspect cuando cambia gridProps.customAspectRatio
  useEffect(() => {
    if (gridProps.customAspectRatio) {
      setTempCustomAspect({
        width: gridProps.customAspectRatio.width,
        height: gridProps.customAspectRatio.height
      });
    }
  }, [gridProps.customAspectRatio]);

  // Auto-enfocar el primer input cuando se abre el panel
  useEffect(() => {
    if (customPanelOpen && gridProps.aspectRatio === 'custom') {
      const inputEl = document.getElementById('custom-aspect-width');
      if (inputEl) {
        setTimeout(() => inputEl.focus(), 100);
      }
    }
  }, [customPanelOpen, gridProps.aspectRatio]);

  return (
    <div className="grid grid-cols-[300px_1fr_300px] lg:grid-cols-[360px_1fr_360px] w-full h-screen max-h-screen overflow-hidden bg-slate-900 text-slate-50">
      {/* Columna 1: Panel Izquierdo (Animaciones, Exportar, etc.) */}
      <div className="border-r border-slate-800 overflow-auto">
        <LeftControlPanel
          currentProps={gridProps}
          onPropsChange={handlePropsChange}
          onAnimationSettingsChange={handleAnimationSettingsChange}
          onTriggerPulse={handleTriggerPulse}
        />
      </div>
      
      {/* Columna 2: Display Central */}
      <div className="flex flex-col">
        {/* Menú Superior */}
        <div className="h-14 border-b border-slate-800 bg-slate-800/50 px-4 flex items-center justify-between">
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
                  if (!isNaN(fps) && fps > 0) {
                    handlePropsChange({ throttleMs: 1000 / fps });
                  }
                }}
                className="w-16 text-center"
              />
            </div>
            
            {/* Info */}
            <div className="text-sm font-medium">
              {gridProps.gridSettings?.rows && gridProps.gridSettings?.cols 
                ? `${gridProps.gridSettings.rows}×${gridProps.gridSettings.cols} | ${gridProps.animationType}` 
                : 'Cargando...'}
            </div>
            
            {/* Botón de Pausa */}
            <button 
              onClick={togglePause}
              className="p-2 rounded hover:bg-slate-700 transition-colors group"
              title={`${gridProps.isPaused ? "Reanudar" : "Pausar"} [Espacio]`}
            >
              {gridProps.isPaused ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              }
            </button>
          </div>
        </div>
        
        {/* Área Principal */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="w-full h-full bg-black rounded-lg overflow-hidden">
            <VectorGrid 
              ref={vectorGridRef}
              {...gridProps}
            />
          </div>
        </div>
        
        {/* Panel expandible de configuración de aspect ratio (aparece encima del menú inferior) */}
        <div className="relative">
          {/* Panel de configuración personalizada que aparece encima */}
          <div 
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-700 border-t border-slate-600 transition-all duration-300 ease-in-out overflow-hidden rounded-t-md ${  
              customPanelOpen && gridProps.aspectRatio === 'custom' && !dimensionsAreFixedByProps
                ? 'max-h-12 opacity-100 translate-y-0 w-auto'
                : 'max-h-0 opacity-0 translate-y-2 w-auto'
            }`}
          >
            <div className="h-12 px-4 flex items-center justify-end gap-6">
              <div className="flex items-center gap-2">
                <label htmlFor="custom-aspect-width" className="text-xs text-slate-400">Ancho:</label>
                <Input
                  id="custom-aspect-width"
                  type="number"
                  value={tempCustomAspect.width}
                  onChange={(e) => {
                    const width = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setTempCustomAspect(prev => ({ ...prev, width }));
                  }}
                  onBlur={() => {
                    if (gridProps.aspectRatio === 'custom') {
                      handlePropsChange({
                        customAspectRatio: tempCustomAspect
                      });
                    }
                  }}
                  className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
              </div>
              
              <div className="text-xs text-slate-300">:</div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="custom-aspect-height" className="text-xs text-slate-400">Alto:</label>
                <Input
                  id="custom-aspect-height"
                  type="number"
                  value={tempCustomAspect.height}
                  onChange={(e) => {
                    const height = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setTempCustomAspect(prev => ({ ...prev, height }));
                  }}
                  onBlur={() => {
                    if (gridProps.aspectRatio === 'custom') {
                      handlePropsChange({
                        customAspectRatio: tempCustomAspect
                      });
                    }
                  }}
                  className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
              </div>
              
              <button
                type="button"
                onClick={() => {
                  handlePropsChange({
                    customAspectRatio: tempCustomAspect
                  });
                  setCustomPanelOpen(false);
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 ml-2"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Menú Inferior con controles de aspectRatio */}
          <div className="h-12 border-t border-slate-700 bg-slate-800/50 px-4 flex items-center justify-center">
            {/* Control de Aspect Ratio con sistema de tabs */}
            <div className="flex items-center">
              
              <div className="flex rounded-md bg-slate-700 p-0.5">
                {/* Tab para container */}
                <button 
                  type="button"
                  onClick={() => {
                    handlePropsChange({ aspectRatio: 'container' });
                    setCustomPanelOpen(false);
                  }}
                  className={`px-2.5 py-1 text-xs transition-all ${
                    gridProps.aspectRatio === 'container' && !dimensionsAreFixedByProps 
                      ? 'bg-slate-600 text-white rounded-sm shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={dimensionsAreFixedByProps}
                  aria-current={gridProps.aspectRatio === 'container' && !dimensionsAreFixedByProps ? 'true' : 'false'}
                >
                  Auto
                </button>
                
                {/* Tab para 1:1 */}
                <button 
                  type="button"
                  onClick={() => {
                    handlePropsChange({ aspectRatio: '1:1' });
                    setCustomPanelOpen(false);
                  }}
                  className={`px-2.5 py-1 text-xs transition-all ${
                    gridProps.aspectRatio === '1:1' && !dimensionsAreFixedByProps 
                      ? 'bg-slate-600 text-white rounded-sm shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={dimensionsAreFixedByProps}
                  aria-current={gridProps.aspectRatio === '1:1' && !dimensionsAreFixedByProps ? 'true' : 'false'}
                >
                  1:1
                </button>
                
                {/* Tab para 16:9 */}
                <button 
                  type="button"
                  onClick={() => {
                    handlePropsChange({ aspectRatio: '16:9' });
                    setCustomPanelOpen(false);
                  }}
                  className={`px-2.5 py-1 text-xs transition-all ${
                    gridProps.aspectRatio === '16:9' && !dimensionsAreFixedByProps 
                      ? 'bg-slate-600 text-white rounded-sm shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={dimensionsAreFixedByProps}
                  aria-current={gridProps.aspectRatio === '16:9' && !dimensionsAreFixedByProps ? 'true' : 'false'}
                >
                  16:9
                </button>
                
                {/* Tab para 2:1 */}
                <button 
                  type="button"
                  onClick={() => {
                    handlePropsChange({ aspectRatio: '2:1' });
                    setCustomPanelOpen(false);
                  }}
                  className={`px-2.5 py-1 text-xs transition-all ${
                    gridProps.aspectRatio === '2:1' && !dimensionsAreFixedByProps 
                      ? 'bg-slate-600 text-white rounded-sm shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={dimensionsAreFixedByProps}
                  aria-current={gridProps.aspectRatio === '2:1' && !dimensionsAreFixedByProps ? 'true' : 'false'}
                >
                  2:1
                </button>
                
                {/* Tab para custom */}
                <button 
                  type="button"
                  onClick={() => {
                    // Si no está en custom, cambiar a custom
                    if (gridProps.aspectRatio !== 'custom') {
                      handlePropsChange({ 
                        aspectRatio: 'custom',
                        customAspectRatio: tempCustomAspect
                      });
                    }
                    // Toggle el panel
                    setCustomPanelOpen(prev => !prev);
                  }}
                  className={`px-2.5 py-1 text-xs transition-all ${
                    gridProps.aspectRatio === 'custom' && !dimensionsAreFixedByProps 
                      ? 'bg-slate-600 text-white rounded-sm shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={dimensionsAreFixedByProps}
                  aria-current={gridProps.aspectRatio === 'custom' && !dimensionsAreFixedByProps ? 'true' : 'false'}
                >
                  Custom
                </button>
              </div>
              
              {/* Recordatorio del formato personalizado cuando está seleccionado */}
              {gridProps.aspectRatio === 'custom' && !dimensionsAreFixedByProps && (
                <span className="text-xs text-slate-300 ml-2">
                  {gridProps.customAspectRatio.width}:{gridProps.customAspectRatio.height}
                </span>
              )}
              
              {/* Información de aspect ratio fijo si está configurado por props */}
              {dimensionsAreFixedByProps && (
                <span className="text-xs text-slate-400 ml-1">
                  Fijo ({calculatedFixedAspectRatio}:1)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Columna 3: Panel Derecho (Grid Settings, Vector Settings) */}
      <div className="border-l border-slate-800 overflow-auto">
        <RightControlPanel 
          currentProps={gridProps}
          onPropsChange={handlePropsChange}
          onGridSettingsChange={handleGridSettingsChange}
          onVectorSettingsChange={handleVectorSettingsChange}
        />
      </div>
    </div>
  );
}
