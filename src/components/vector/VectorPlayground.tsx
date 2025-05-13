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
import { AspectRatioManager } from './core/AspectRatioManager';
import { LeftControlPanel } from './controls/LeftControlPanel';
import { RightControlPanel } from './controls/RightControlPanel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Los valores iniciales se han configurado para un resultado visual interesante por defecto
// Extendemos VectorGridProps para incluir una key que nos ayude a forzar la reconstrucción del componente
interface ExtendedVectorGridProps extends VectorGridProps {
  key?: string;
}

const INITIAL_GRID_PROPS: ExtendedVectorGridProps = {
  gridSettings: {
    rows: 12,
    cols: 18,
    spacing: 30,
    margin: 20
  },
  vectorSettings: {
    vectorShape: 'arrow' as const,
    vectorLength: 24,
    vectorWidth: 4,
    vectorColor: '#00aaff',
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
  aspectRatio: 'auto',
  customAspectRatio: { width: 16, height: 9 }
};



export default function VectorPlayground() {
  const [gridProps, setGridProps] = useState<ExtendedVectorGridProps>(INITIAL_GRID_PROPS);
  const vectorGridRef = useRef<VectorGridRef>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Referencia para el elemento que podría tener el foco cuando se presiona espacio
  // Evita activar la pausa si el usuario está escribiendo en un input
  const activeElementRef = useRef<Element | null>(null);

  // Callback general para actualizar props. Los paneles podrían filtrar qué envían.
  const handlePropsChange = useCallback((newValues: Partial<ExtendedVectorGridProps>) => {
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
      
      // Manejo especial para aspect ratio
      if (newValues.aspectRatio && newValues.aspectRatio !== prev.aspectRatio) {
        // Si cambia el aspect ratio y NO hay cambio explícito de gridSettings
        // deberíamos ajustar automáticamente la configuración de la cuadrícula
        if (!newValues.gridSettings) {
          const spacing = prev.gridSettings?.spacing || 30;
          let optimalRows, optimalCols;
          
          // Determinar dimensiones óptimas según el aspect ratio
          switch (newValues.aspectRatio) {
            case '1:1':
              optimalRows = optimalCols = Math.max(8, Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.6 / spacing));
              break;
            case '2:1':
              optimalRows = Math.floor(window.innerHeight * 0.7 / spacing);
              optimalCols = optimalRows * 2;
              break;
            case '16:9':
              optimalRows = 9;
              optimalCols = 16;
              break;
            case 'custom':
              if (newValues.customAspectRatio) {
                const ratio = newValues.customAspectRatio.width / newValues.customAspectRatio.height;
                optimalRows = 12; // Base fija de filas
                optimalCols = Math.round(optimalRows * ratio);
              } else {
                // Mantener configuración actual si no hay custom aspect ratio definido
                optimalRows = prev.gridSettings?.rows || 12;
                optimalCols = prev.gridSettings?.cols || 18;
              }
              break;
            default: // 'auto'
              // No ajustamos filas/columnas, mantener configuración actual
              return {
                ...prev,
                ...newValues,
                key: `auto-${Date.now()}`
              };
          }
          
          return {
            ...prev,
            ...newValues,
            gridSettings: {
              ...prev.gridSettings,
              rows: optimalRows,
              cols: optimalCols
            },
            key: `${newValues.aspectRatio}-${Date.now()}`
          };
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

  // Ya no necesitamos estos estados, puesto que ahora son manejados por AspectRatioManager
  // Observar dimensiones del contenedor para proporcionarlas a AspectRatioManager
  const [observedDimensions, setObservedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Usar un efecto para observar las dimensiones del contenedor
  useEffect(() => {
    if (!gridContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setObservedDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(gridContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

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
            {/* Extracción estable de key para evitar recreaciones de funciones */}
            {(() => {
              // Extraer key de forma estable
              const gridKey = gridProps.key;
              // Crear una copia limpia de las props sin key
              const propsWithoutKey = { ...gridProps };
              delete propsWithoutKey.key;
              
              return (
                <VectorGrid 
                  ref={vectorGridRef}
                  key={gridKey}
                  {...propsWithoutKey}
                />
              );
            })()}
          </div>
        </div>
        
        {/* Panel expandible de configuración de aspect ratio (aparece encima del menú inferior) */}
        <div className="relative">
          {/* Menú Inferior con controles de aspectRatio */}
          <div className="border-t border-slate-700 bg-slate-800/50 px-4 py-3 flex flex-col">
            {/* Control de Aspect Ratio con el nuevo AspectRatioManager */}
            <AspectRatioManager
              initialAspectRatio={gridProps.aspectRatio as AspectRatioOption}
              initialGridSettings={gridProps.gridSettings as GridSettings}
              customAspectRatio={gridProps.customAspectRatio}
              containerWidth={observedDimensions?.width || 800}
              containerHeight={observedDimensions?.height || 600}
              onConfigChange={(config) => {
                handlePropsChange({
                  aspectRatio: config.aspectRatio,
                  gridSettings: config.gridSettings,
                  customAspectRatio: config.customAspectRatio,
                  // Agregar una key única para forzar recreación completa
                  key: `${config.aspectRatio}-${Date.now()}`
                });
              }}
              disabled={dimensionsAreFixedByProps}
            />
            
            {/* Información de aspect ratio fijo si está configurado por props */}
            {dimensionsAreFixedByProps && (
              <div className="mt-2 p-2 bg-slate-700/50 rounded-sm">
                <span className="text-xs text-amber-300">
                  ⓘ Aviso: Las dimensiones están fijadas a través de props ({calculatedFixedAspectRatio}:1). 
                  El ajuste de aspect ratio está desactivado.
                </span>
              </div>
            )}
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
