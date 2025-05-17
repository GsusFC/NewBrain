'use client';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { VectorGrid } from './VectorGrid';
import { LeftControlPanel } from './controls/LeftControlPanel';
import { RightControlPanel } from './controls/RightControlPanel';
import type { VectorGridProps, VectorGridRef, AspectRatioOption, GridSettings, VectorSettings, AnimationType } from './core/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClientOnly } from '@/components/ClientOnly';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // <- mantener comentado hasta que se use

// Importar el hook de dimensiones actualizado
import { useGridDimensions } from '@/hooks/vector/useGridDimensions';
import { VectorControlProvider } from './controls/VectorControlContext';

// Los valores iniciales se han configurado para un resultado visual interesante por defecto
// Extendemos VectorGridProps para incluir una key que nos ayude a forzar la reconstrucción del componente
interface UseVectorGridProps extends VectorGridProps {
  key?: string;
}

// Usamos el componente ClientOnly importado desde @/components/ClientOnly

const INITIAL_GRID_PROPS: UseVectorGridProps = {
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
  backgroundColor: '#0a0a0a', // Valor oscuro equivalente a bg-background
  animationType: 'smoothWaves' as AnimationType,
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

// Evitamos recrear innecesariamente el objeto de props completo
const VectorPlayground = () => {
  // Definir un estado para las props del grid y un componente key para forzar re-renderizados completos
  const [gridProps, setGridProps] = useState<UseVectorGridProps>({ ...INITIAL_GRID_PROPS });
  const vectorGridRef = useRef<VectorGridRef>(null);
  
  // Usar nuestro hook optimizado para gestionar las dimensiones del grid y su centrado
  const containerRef = useRef<HTMLDivElement>(null);
  const activeElementRef = useRef<Element | null>(null);
  
  // useGridDimensions para calcular dimensiones efectivas y offsets para centrado
  const gridDimensions = useGridDimensions({
    containerRef,
    aspectRatio: gridProps.aspectRatio as AspectRatioOption,
    margin: gridProps.gridSettings?.margin || 20,
    customAspectRatio: gridProps.customAspectRatio,
    debug: false // Activar solo para diagnóstico
  });
  
  // Estado para indicar recálculo de la cuadrícula
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Referencia para el elemento que podría tener el foco cuando se presiona espacio
  // Evita activar la pausa si el usuario está escribiendo en un input
  
  // Estado para el efecto de fade al pausar/reanudar
  const [fade, setFade] = useState(1);
  
  // Aplicar el efecto de fade cuando cambia el estado de pausa
  useEffect(() => {
    setFade(gridProps.isPaused ? 0.7 : 1);
  }, [gridProps.isPaused]);

  // Calculamos las dimensiones óptimas basadas en el aspect ratio y el contenedor
  const calculateOptimalGridDimensions = useCallback((
    aspectRatio: AspectRatioOption,
    spacing: number,
    customAspectRatio?: { width: number; height: number }
  ) => {
    if (!gridProps.gridSettings) return null;
    
    // Validación de entradas
    if (!containerRef.current) return null;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    if (containerWidth < 100 || containerHeight < 100) return null;
    
    // Para calcular las filas y columnas óptimas ahora usamos una lógica simple
    // basada en el espacio disponible y el espaciado
    const availableWidth = containerWidth - (gridProps.gridSettings.margin * 2);
    const availableHeight = containerHeight - (gridProps.gridSettings.margin * 2);
    
    let cols = Math.floor(availableWidth / spacing);
    let rows = Math.floor(availableHeight / spacing);
    
    if (rows <= 0 || cols <= 0) return null;
    
    // Respetar el aspect ratio solicitado si se proporciona
    if (aspectRatio !== 'auto') {
      let targetRatio: number;
      
      if (aspectRatio === 'custom') {
        targetRatio = (customAspectRatio?.width ?? 16) / (customAspectRatio?.height ?? 9);
      } else if (aspectRatio === '1:1') {
        targetRatio = 1;
      } else if (aspectRatio === '2:1') {
        targetRatio = 2;
      } else { // '16:9'
        targetRatio = 16/9;
      }
      
      // Corrección simple: ajustar la dimensión más grande
      const currentRatio = cols / rows;
      if (currentRatio > targetRatio) {
        cols = Math.floor(rows * targetRatio);
      } else {
        rows = Math.floor(cols / targetRatio);
      }
    }
    
    return { rows, cols, spacing };
  }, [containerRef, gridProps.gridSettings]);

  // Función para manejar las propiedades de animación
  const mergeAnimationProps = useCallback((prev: UseVectorGridProps, newValues: Partial<UseVectorGridProps>) => {
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

  // useCallback para modificaciones de props - esto nos permite mantener la referencia estable
  const handlePropsChange = useCallback((newValues: Partial<UseVectorGridProps>) => {
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
          // Protección contra resultado undefined
          const result = calculateOptimalGridDimensions(
            newValues.aspectRatio, 
            spacing, 
            newValues.customAspectRatio || prev.customAspectRatio
          );
          
          // Si no hay resultado, mantener los valores actuales
          if (!result) {
            return { ...prev, ...newValues };
          }
          
          const { rows, cols } = result;
          
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
  
  // Handler para reconstruir completamente el grid (cambia la key para forzar destrucción y recreación completa)
  const handleRebuildGrid = useCallback(() => {
    setGridProps(prevProps => ({
      ...prevProps as UseVectorGridProps, // Asegurar que el tipo es correcto
      key: Math.random().toString(36).substring(2, 9) // Generar una nueva key aleatoria
    }));
  }, []);

  // Toggle de pausa con la barra espaciadora
  const togglePause = useCallback(() => {
    handlePropsChange({ isPaused: !gridProps.isPaused });
  }, [gridProps.isPaused, handlePropsChange]);
  
  // Handler para la tecla espacio (pausa)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Actualizar la referencia al elemento activo
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
  }, [togglePause]);
  
  // Efecto para manejar la pausa con la tecla espacio
  useEffect(() => {
    // Obtener el elemento activo para verificar si debemos activar el shortcut
    activeElementRef.current = document.activeElement;
    
    // Añadir event listener global
    window.addEventListener('keydown', handleKeyDown);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Usamos useRef para trackear el último cálculo y evitar actualizaciones innecesarias
  const lastCalculationRef = useRef({
    dimensions: { width: 0, height: 0 },
    aspectRatio: null,
    calculatedRows: 0,
    calculatedCols: 0,
    isFirstRun: true
  });
  
  useEffect(() => {
    // No recalcular si usamos modo 'auto' que no necesita cálculos específicos de aspect ratio
    if (gridProps.aspectRatio === 'auto' || 
        gridDimensions.width <= 10 || 
        gridDimensions.height <= 10) {
      return;
    }
    
    // Verificar si las dimensiones o el aspect ratio han cambiado significativamente
    const dimensionsChanged = 
      Math.abs(lastCalculationRef.current.dimensions.width - gridDimensions.width) > 20 ||
      Math.abs(lastCalculationRef.current.dimensions.height - gridDimensions.height) > 20;
    
    const aspectRatioChanged = 
      lastCalculationRef.current.aspectRatio !== gridProps.aspectRatio;
    
    // Ejecutar solo en el primer run o si han cambiado significativamente las dimensiones o el aspect ratio
    if (!lastCalculationRef.current.isFirstRun && 
        !dimensionsChanged && 
        !aspectRatioChanged) {
      return; // Evitar recálculos innecesarios
    }
    
    // Indicamos que estamos recalculando (para UI feedback)
    setIsRecalculating(true);
    
    // Usamos un timeout para romper el ciclo de renderizado y dar tiempo visual al estado
    const timerId = setTimeout(() => {
      try {
        // Obtenemos los valores actuales de forma segura
        const currentGridSettings = { ...gridProps.gridSettings };
        const spacing = currentGridSettings?.spacing || 30;
        
        // Calculamos las dimensiones óptimas
        const result = calculateOptimalGridDimensions(
          gridProps.aspectRatio as AspectRatioOption,
          spacing,
          gridProps.customAspectRatio
        );
        
        // Solo continuamos si el cálculo devolvió valores
        if (!result || typeof result.rows !== 'number' || typeof result.cols !== 'number') {
          setIsRecalculating(false);
          return;
        }
        
        const { rows, cols } = result;
        
        // Verificamos si hay un cambio significativo que merezca actualizar
        const currentRows = currentGridSettings?.rows || 0;
        const currentCols = currentGridSettings?.cols || 0;
        
        // Actualizar la referencia con el cálculo actual
        lastCalculationRef.current = {
          dimensions: { width: gridDimensions.width, height: gridDimensions.height },
          aspectRatio: gridProps.aspectRatio,
          calculatedRows: rows,
          calculatedCols: cols,
          isFirstRun: false
        };
        
        // IMPORTANTE: Solo actualizar si hay cambios muy significativos
        // para evitar bucles de renderizado infinitos
        if (
          !currentRows || 
          !currentCols ||
          Math.abs(currentRows - rows) > 2 ||
          Math.abs(currentCols - cols) > 3
        ) {
          const newGridSettings = {
            ...currentGridSettings,
            rows,
            cols
          };
          
          // Usamos una comparación profunda para evitar actualizaciones innecesarias
          if (JSON.stringify(newGridSettings) !== JSON.stringify(currentGridSettings)) {
            // Usamos el callback de setState para asegurar el valor más reciente
            setGridProps(prevProps => ({
              ...prevProps,
              gridSettings: newGridSettings
            }));
          }
        }
      } catch (error) {
        console.error('Error al recalcular grid:', error);
      } finally {
        // Quitamos el indicador de recálculo
        setIsRecalculating(false);
      }
    }, 100); // Aumentado a 100ms para dar más margen entre actualizaciones
    
    // Limpieza del timeout cuando el componente se desmonte o las dependencias cambien
    return () => {
      clearTimeout(timerId);
      setIsRecalculating(false); // Asegurarnos de limpiar el estado
    };
  // IMPORTANTE: Solo incluimos las dependencias que realmente necesitamos
  }, [gridDimensions.width, gridDimensions.height, calculateOptimalGridDimensions, gridProps.aspectRatio, gridProps.customAspectRatio]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[360px_1fr_360px] w-full h-[100dvh] overflow-hidden bg-background/30">
      {/* Columna 1: Panel Izquierdo (Animaciones, Exportar, etc.) */}
      <div className="shadow-md md:shadow-inner md:shadow-r overflow-auto bg-card/95 backdrop-blur-sm order-1 md:order-1 transition-all">
        <ClientOnly fallback={
          <div className="p-4 flex justify-center items-center h-full">
            <div className="animate-pulse">Cargando panel de control...</div>
          </div>
        }>
          <LeftControlPanel
            currentProps={gridProps}
            onPropsChange={handlePropsChange}
            onAnimationSettingsChange={handleAnimationSettingsChange}
            onTriggerPulse={handleTriggerPulse}
          />
        </ClientOnly>
      </div>
      
      {/* Columna 2: Display Central */}
      <div className="flex flex-col order-1 md:order-2 transition-all">
        {/* Menú Superior */}
        <div className="h-14 shadow-sm bg-card/95 backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-10 transition-all">
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
              title={gridProps.isPaused ? "Reanudar [Espacio]" : "Pausar [Espacio]"}
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
        <div className="flex-1 p-3 sm:p-4 overflow-hidden order-1 md:order-2 transition-all" role="main">
          <div 
            ref={containerRef}
            className="w-full h-full bg-background rounded-lg overflow-hidden shadow-lg transition-shadow"
            aria-label="Animación de vectores"
            style={{
              opacity: gridProps.isPaused ? 0.7 : 1,
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
            {/* Renderizamos condicionalmente con nuestro componente ClientOnly para evitar errores en SSR */}
            <ClientOnly>
              {useMemo(() => {
                // Extraer key de forma estable
                const gridKey = gridProps.key;
                // Crear una copia limpia de las props sin key
                const propsWithoutKey = { ...gridProps };
                delete propsWithoutKey.key;
                
                return (
                  <div 
                    style={{
                      position: 'absolute',
                      left: gridDimensions.gridOffsetX,
                      top: gridDimensions.gridOffsetY,
                      width: gridDimensions.effectiveWidth,
                      height: gridDimensions.effectiveHeight,
                      // Para debug: mostrar un borde
                      border: false ? '1px dashed rgba(255,255,255,0.2)' : 'none'
                    }}
                    className="vector-grid-positioned"
                    data-dimensions={`${gridDimensions.effectiveWidth}x${gridDimensions.effectiveHeight}`}
                    data-offset={`${Math.round(gridDimensions.gridOffsetX)}x${Math.round(gridDimensions.gridOffsetY)}`}
                  >
                    <VectorGrid 
                      ref={vectorGridRef}
                      key={gridKey}
                      {...propsWithoutKey}
                      width={gridDimensions.effectiveWidth}
                      height={gridDimensions.effectiveHeight}
                      containerFluid={false} // Forzar el uso de las dimensiones exactas
                    />
                  </div>
                );
              }, [gridProps, gridDimensions])}
            </ClientOnly>
          </div>
        </div>
        
        {/* El menú inferior con AspectRatioManager ha sido movido al panel derecho */}
      </div>
      
      {/* Columna 3: Panel Derecho (Grid Settings, Vector Settings) */}
      <div className="shadow-md md:shadow-inner md:shadow-l overflow-auto bg-card/95 backdrop-blur-sm order-3 md:order-3 transition-all">
        <ClientOnly fallback={
          <div className="p-4 flex justify-center items-center h-full">
            <div className="animate-pulse">Cargando panel de configuración...</div>
          </div>
        }>
          <RightControlPanel 
            currentProps={gridProps}
            onPropsChange={handlePropsChange}
            onGridSettingsChange={handleGridSettingsChange}
            onVectorSettingsChange={handleVectorSettingsChange}
          />
        </ClientOnly>
      </div>
    </div>
  );
};

// Componente que envuelve VectorPlayground con el proveedor de contexto
const VectorPlaygroundWithProvider = () => {
  return (
    <VectorControlProvider>
      <VectorPlayground />
    </VectorControlProvider>
  );
};

export default VectorPlaygroundWithProvider;
