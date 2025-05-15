'use client';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { VectorGrid } from './VectorGrid';
import { useGridContainer } from '@/hooks/vector/useGridContainer';
import type { AspectRatioOption } from '@/hooks/vector/useContainerDimensions';
// Importamos todos los tipos necesarios, incluida la referencia de VectorGrid
import type { 
  VectorGridProps, 
  GridSettings, 
  VectorSettings, 
  VectorGridRef 
} from './core/types';
import { LeftControlPanel } from './controls/LeftControlPanel';
import { RightControlPanel } from './controls/RightControlPanel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
    vectorColor: '#3b82f6',
    strokeLinecap: 'round' as const,
    rotationOrigin: 'center' as const
  },
  backgroundColor: 'bg-background',
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
  
  // Usar nuestro nuevo hook para gestionar el contenedor y sus dimensiones
  const { containerRef, containerSize, calculateOptimalGrid } = useGridContainer();
  
  // Estado para indicar recálculo de la cuadrícula
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Referencia para el elemento que podría tener el foco cuando se presiona espacio
  // Evita activar la pausa si el usuario está escribiendo en un input
  const activeElementRef = useRef<Element | null>(null);
  
  // Estado para el efecto de fade al pausar/reanudar
  const [fade, setFade] = useState(1);
  
  // Aplicar el efecto de fade cuando cambia el estado de pausa
  useEffect(() => {
    setFade(gridProps.isPaused ? 0.7 : 1);
  }, [gridProps.isPaused]);

  // Modificamos la función para usar el nuevo hook que utiliza dimensiones reales
  const calculateOptimalGridDimensions = useCallback((aspectRatio: string, spacing: number, customAspectRatio?: { width: number; height: number }) => {
    // Usar el nuevo método que utiliza dimensiones reales del contenedor
    return calculateOptimalGrid(
      aspectRatio as AspectRatioOption, 
      spacing, 
      customAspectRatio
    );
  }, [calculateOptimalGrid]);

  // Función para manejar las propiedades de animación
  const mergeAnimationProps = useCallback((prev: ExtendedVectorGridProps, newValues: Partial<ExtendedVectorGridProps>) => {
    if (newValues.animationProps && prev.animationProps) {
      return {
        ...prev,
        ...newValues,
        animationProps: {
          ...prev.animationProps,
          ...newValues.animationProps
        }
      };
    }
    return { ...prev, ...newValues };
  }, []);

  // Callback general para actualizar props. Los paneles podrían filtrar qué envían.
  const handlePropsChange = useCallback((newValues: Partial<ExtendedVectorGridProps>) => {
    setGridProps(prev => {
      // Manejo especial para fusionar animationProps si existen en ambos
      if (newValues.animationProps && prev.animationProps) {
        return mergeAnimationProps(prev, newValues);
      }
      
      // Manejo especial para aspect ratio
      if (newValues.aspectRatio && newValues.aspectRatio !== prev.aspectRatio) {
        // Si cambia el aspect ratio y NO hay cambio explícito de gridSettings
        if (!newValues.gridSettings) {
          const spacing = prev.gridSettings?.spacing || 30;
          const { rows, cols } = calculateOptimalGridDimensions(
            newValues.aspectRatio, 
            spacing, 
            newValues.customAspectRatio || prev.customAspectRatio
          );
          
          // Actualizar gridSettings con los nuevos valores calculados
          return {
            ...prev,
            ...newValues,
            gridSettings: {
              ...prev.gridSettings,
              rows,
              cols
            }
          };
        }
      }
      
      // Manejo estándar para todos los demás casos
      return { ...prev, ...newValues };
    });
  }, [calculateOptimalGridDimensions, mergeAnimationProps]);

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
          e.preventDefault();  

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

  // Añadir un efecto para recalcular la grid cuando cambie el tamaño del contenedor
  useEffect(() => {
    if (gridProps.aspectRatio && gridProps.aspectRatio !== 'auto' && containerSize.width > 10 && containerSize.height > 10) {
      setIsRecalculating(true);
      
      const spacing = gridProps.gridSettings?.spacing || 30;
      const { rows, cols } = calculateOptimalGridDimensions(
        gridProps.aspectRatio,
        spacing,
        gridProps.customAspectRatio
      );
      
      // Solo actualizar si las dimensiones han cambiado significativamente
      if (
        !gridProps.gridSettings?.rows || 
        !gridProps.gridSettings?.cols ||
        Math.abs(gridProps.gridSettings.rows - rows) > 1 ||
        Math.abs(gridProps.gridSettings.cols - cols) > 2
      ) {
        handlePropsChange({
          gridSettings: {
            ...gridProps.gridSettings,
            rows,
            cols
          }
        });
      }
      
      // Pequeño retraso antes de quitar el indicador de recálculo
      const timer = setTimeout(() => setIsRecalculating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [containerSize, calculateOptimalGridDimensions, gridProps.aspectRatio, gridProps.customAspectRatio, gridProps.gridSettings, handlePropsChange]);

  return (
    <div className="grid grid-cols-[300px_1fr_300px] lg:grid-cols-[360px_1fr_360px] w-full h-screen max-h-screen overflow-hidden bg-background text-foreground">
      {/* Columna 1: Panel Izquierdo (Animaciones, Exportar, etc.) */}
      <div className="border-r border-border overflow-auto bg-card/90">
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
        <div className="h-14 border-b border-border bg-card/80 px-4 flex items-center justify-between">
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
                min={1}
                max={240}
                value={gridProps.throttleMs ? (1000 / gridProps.throttleMs).toFixed(0) : '60'} 
                onChange={(e) => {
                  const fps = parseInt(e.target.value, 10);
                  if (!isNaN(fps) && fps > 0 && fps <= 240) {
                    handlePropsChange({ throttleMs: 1000 / fps });
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
              {gridProps.gridSettings?.rows && gridProps.gridSettings?.cols 
                ? `${gridProps.gridSettings.rows}×${gridProps.gridSettings.cols} | ${gridProps.animationType}` 
                : 'Cargando...'}
            </div>
            
            {/* Botón de Pausa */}
            <button 
              onClick={togglePause}
              className="p-2 rounded hover:bg-muted transition-colors group"
              title={`${gridProps.isPaused ? "Reanudar" : "Pausar"} [Espacio]`}
              aria-label={gridProps.isPaused ? "Reanudar animación" : "Pausar animación"}
              aria-pressed={gridProps.isPaused}
            >
              {gridProps.isPaused ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              }
            </button>
          </div>
        </div>
        
        {/* Área Principal - Conectamos el ref del contenedor */}
        <div className="flex-1 p-4 overflow-hidden" role="main">
          <div 
            ref={containerRef}
            className="w-full h-full bg-background rounded-lg overflow-hidden border border-muted"
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
            {useMemo(() => {
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
            }, [gridProps])}
          </div>
        </div>
        
        {/* El menú inferior con AspectRatioManager ha sido movido al panel derecho */}
      </div>
      
      {/* Columna 3: Panel Derecho (Grid Settings, Vector Settings) */}
      <div className="border-l border-border overflow-auto bg-card/90">
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
