import { isEqual } from 'fast-deep-equal';
import { useCallback, useEffect, useMemo, useReducer, FC, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-headless';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DensityControl } from './DensityControl';
import { ManualControl } from './ManualControl';
import { AspectRatioOption, CustomAspectRatio, GridSettings } from './types';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Mode = 'aspect-ratio' | 'density' | 'manual';

interface GridState {
  settings: {
    [key in Mode]: GridSettings;
  };
  ratios: {
    [key in Mode]: AspectRatioOption;
  };
  customRatios: {
    [key in Mode]: CustomAspectRatio;
  };
  activeMode: Mode;
  lastUpdatedMode: Mode | null;
}

type GridAction =
  | { type: 'UPDATE_SETTINGS'; mode: Mode; settings: GridSettings }
  | { type: 'UPDATE_RATIO'; mode: Mode; ratio: AspectRatioOption }
  | { type: 'UPDATE_CUSTOM_RATIO'; mode: Mode; customRatio: CustomAspectRatio }
  | { type: 'SET_ACTIVE_MODE'; mode: Mode }
  | { type: 'INIT_STATE'; gridSettings: GridSettings; aspectRatio: AspectRatioOption; customAspectRatio?: CustomAspectRatio }
  | { type: 'SYNC_FROM_PROPS'; gridSettings: GridSettings; aspectRatio: AspectRatioOption; customAspectRatio?: CustomAspectRatio }; // Nueva acción para sincronización

const initialState = (gridSettings: GridSettings, aspectRatio: AspectRatioOption, customAspectRatio?: CustomAspectRatio): GridState => ({
  settings: {
    'aspect-ratio': { ...gridSettings },
    density: { ...gridSettings },
    manual: { ...gridSettings }
  },
  ratios: {
    'aspect-ratio': aspectRatio,
    density: aspectRatio,
    manual: aspectRatio
  },
  customRatios: {
    'aspect-ratio': customAspectRatio || { width: 16, height: 9 },
    density: customAspectRatio || { width: 16, height: 9 },
    manual: customAspectRatio || { width: 16, height: 9 }
  },
  activeMode: 'aspect-ratio',
  lastUpdatedMode: null
});

function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.mode]: action.settings
        },
        lastUpdatedMode: action.mode
      };
    case 'UPDATE_RATIO':
      return {
        ...state,
        ratios: {
          ...state.ratios,
          [action.mode]: action.ratio
        },
        lastUpdatedMode: action.mode
      };
    case 'UPDATE_CUSTOM_RATIO':
      // Validar valores mínimos
      const validatedCustomRatio = {
        width: Math.max(1, Math.round(action.customRatio.width)),
        height: Math.max(1, Math.round(action.customRatio.height))
      };
      
      return {
        ...state,
        customRatios: {
          ...state.customRatios,
          [action.mode]: validatedCustomRatio
        },
        lastUpdatedMode: action.mode
      };
    case 'SET_ACTIVE_MODE':
      return {
        ...state,
        activeMode: action.mode,
        lastUpdatedMode: action.mode
      };
    case 'INIT_STATE':
      return initialState(action.gridSettings, action.aspectRatio, action.customAspectRatio);
    case 'SYNC_FROM_PROPS':
      // Solo actualizar si los props son diferentes para evitar bucles de actualización
      const currentSettings = state.settings[state.activeMode];
      const currentRatio = state.ratios[state.activeMode];
      const currentCustomRatio = state.customRatios[state.activeMode];
      
      const settingsChanged = !isEqual(currentSettings, action.gridSettings);
      const ratioChanged = currentRatio !== action.aspectRatio;
      const customRatioChanged = action.aspectRatio === 'custom' && 
                               action.customAspectRatio && 
                               !isEqual(currentCustomRatio, action.customAspectRatio);
      
      if (settingsChanged || ratioChanged || customRatioChanged) {
        return initialState(action.gridSettings, action.aspectRatio, action.customAspectRatio);
      }
      return state;
    default:
      return state;
  }
}

export interface GridControlSelectorProps {
  gridSettings?: GridSettings;
  aspectRatio?: AspectRatioOption;
  customAspectRatio?: CustomAspectRatio;
  _backgroundColor?: string;
  onPropsChange: (props: {
    gridSettings: GridSettings;
    aspectRatio: AspectRatioOption;
    customAspectRatio?: CustomAspectRatio;
    _backgroundColor?: string;
  }) => void;
}

const GridControlSelector: FC<GridControlSelectorProps> = ({
  gridSettings = {},
  aspectRatio = '16:9',
  customAspectRatio = { width: 16, height: 9 },
  _backgroundColor,
  onPropsChange
}) => {
  const [state, dispatch] = useReducer(gridReducer, {
    settings: {
      'aspect-ratio': { ...gridSettings },
      density: { ...gridSettings },
      manual: { ...gridSettings }
    },
    ratios: {
      'aspect-ratio': aspectRatio,
      density: aspectRatio,
      manual: aspectRatio
    },
    customRatios: {
      'aspect-ratio': customAspectRatio,
      density: customAspectRatio,
      manual: customAspectRatio
    },
    activeMode: 'aspect-ratio'
  });

  const { settings, ratios, customRatios, activeMode } = state;

  const currentSettings = useMemo(() => settings[activeMode], [settings, activeMode]);
  const currentRatio = useMemo(() => ratios[activeMode], [ratios, activeMode]);
  const currentCustomRatio = useMemo(() => customRatios[activeMode], [customRatios, activeMode]);

  // Usar useRef para rastrear si es la primera renderización
  const isInitialMount = useRef(true);
  const prevProps = useRef({ gridSettings, aspectRatio, customAspectRatio });

  // Notificar cambios al padre de manera optimizada
  const notifyChanges = useCallback((mode: Mode, force = false) => {
    // Evitar notificaciones innecesarias en montaje inicial
    if (isInitialMount.current && !force) return;
    
    onPropsChange({
      gridSettings: settings[mode],
      aspectRatio: ratios[mode],
      customAspectRatio: ratios[mode] === 'custom' ? customRatios[mode] : undefined,
      ...(_backgroundColor ? { _backgroundColor } : {})
    });
  }, [settings, ratios, customRatios, _backgroundColor, onPropsChange]);
  
  // Efecto para manejar el montaje inicial
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Forzar notificación en el montaje inicial
      notifyChanges(activeMode, true);
    }
  }, [activeMode, notifyChanges]);

  // Manejar cambio de pestaña con accesibilidad mejorada
  const handleTabChange = useCallback((value: string) => {
    const newMode = value as Mode;
    if (newMode === activeMode) return; // Evitar cambios innecesarios
    
    dispatch({ type: 'SET_ACTIVE_MODE', mode: newMode });
    // Notificar cambios con un pequeño retraso para mejor respuesta
    const timer = setTimeout(() => notifyChanges(newMode), 0);
    return () => clearTimeout(timer);
  }, [activeMode, notifyChanges]);

  // Manejar cambios en la configuración con debounce
  const handleSettingsChange = useCallback((newSettings: GridSettings) => {
    // Validar que los cambios son significativos antes de actualizar
    if (isEqual(settings[activeMode], newSettings)) return;
    
    dispatch({ type: 'UPDATE_SETTINGS', mode: activeMode, settings: newSettings });
    
    // Usar requestAnimationFrame para agrupar actualizaciones
    requestAnimationFrame(() => {
      notifyChanges(activeMode);
    });
  }, [activeMode, settings, notifyChanges]);

  // Manejar cambio de ratio con validación
  const handleRatioChange = useCallback((newRatio: AspectRatioOption) => {
    if (ratios[activeMode] === newRatio) return;
    
    dispatch({ type: 'UPDATE_RATIO', mode: activeMode, ratio: newRatio });
    
    // Notificar cambios con un pequeño retraso
    const timer = setTimeout(() => notifyChanges(activeMode), 0);
    return () => clearTimeout(timer);
  }, [activeMode, ratios, notifyChanges]);

  // Manejar cambio de ratio personalizado con validación mejorada
  const handleCustomRatioChange = useCallback((newCustomRatio: CustomAspectRatio) => {
    // Validar valores numéricos y positivos
    const validatedRatio = {
      width: Math.max(1, Math.round(newCustomRatio.width)),
      height: Math.max(1, Math.round(newCustomRatio.height))
    };
    
    // Evitar actualizaciones innecesarias
    if (isEqual(customRatios[activeMode], validatedRatio)) return;
    
    dispatch({ type: 'UPDATE_CUSTOM_RATIO', mode: activeMode, customRatio: validatedRatio });
    
    // Notificar cambios con un pequeño retraso
    const timer = setTimeout(() => notifyChanges(activeMode), 0);
    return () => clearTimeout(timer);
  }, [activeMode, customRatios, notifyChanges]);

  // Manejar cambio de densidad con cálculo optimizado
  const handleDensityChange = useCallback((density: number) => {
    // Validar densidad dentro de límites razonables
    const validatedDensity = Math.max(1, Math.min(100, Math.round(density)));
    
    // Calcular columnas manteniendo la proporción del aspect ratio
    const aspectRatio = currentCustomRatio.width / currentCustomRatio.height;
    const newCols = Math.round(validatedDensity * aspectRatio);
    
    // Evitar actualizaciones innecesarias
    if (currentSettings.rows === validatedDensity && currentSettings.cols === newCols) return;
    
    const newSettings = {
      ...currentSettings,
      rows: validatedDensity,
      cols: newCols
    };
    
    handleSettingsChange(newSettings);
  }, [currentSettings, currentCustomRatio, handleSettingsChange]);

  // Sincronizar con cambios en las props externas
  useEffect(() => {
    // Verificar si los props han cambiado realmente
    const propsChanged = (
      !isEqual(prevProps.current.gridSettings, gridSettings) ||
      prevProps.current.aspectRatio !== aspectRatio ||
      !isEqual(prevProps.current.customAspectRatio, customAspectRatio)
    );
    
    if (propsChanged) {
      // Usar la acción SYNC_FROM_PROPS para manejar la sincronización
      dispatch({
        type: 'SYNC_FROM_PROPS',
        gridSettings,
        aspectRatio,
        customAspectRatio
      });
      
      // Actualizar la referencia a los props anteriores
      prevProps.current = { gridSettings, aspectRatio, customAspectRatio };
    }
  }, [gridSettings, aspectRatio, customAspectRatio]);

  // Tooltip de ayuda para el aspecto ratio
  const aspectRatioTooltip = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ayuda sobre aspect ratio"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 text-sm">
          <p className="font-medium mb-1">Configuración de Aspect Ratio</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Selecciona un ratio predefinido o usa uno personalizado</li>
            <li>El sistema ajustará automáticamente la cuadrícula</li>
            <li>Usa el modo manual para control total sobre filas/columnas</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Estilos para botones de aspecto ratio con mejor accesibilidad
  const aspectButtonClasses = useMemo(() => ({
    base: "flex flex-col items-center justify-center p-3 rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active: "bg-primary/15 shadow-sm ring-1 ring-primary/20 text-primary",
    inactive: "hover:bg-accent/10 hover:text-foreground text-muted-foreground",
    icon: "w-8 h-8 border-2 border-current rounded-sm mb-2",
    iconWide: "w-12 h-[27px] border-2 border-current rounded-sm mb-2",
    icon2x1: "w-12 h-6 border-2 border-current rounded-sm mb-2",
    iconCustom: "w-8 h-8 border-2 border-primary/50 rounded-sm mb-2 border-dashed"
  }), []);

  return (
    <div className="space-y-4">
      <Tabs 
        value={activeMode} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="aspect-ratio"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-sm transition-colors",
              activeMode === 'aspect-ratio' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Relación
          </TabsTrigger>
          <TabsTrigger 
            value="density"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-sm transition-colors",
              activeMode === 'density' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Densidad
          </TabsTrigger>
          <TabsTrigger 
            value="manual"
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-sm transition-colors",
              activeMode === 'manual' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Manual
          </TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {activeMode === 'aspect-ratio' && (
            <TabsContent value="aspect-ratio" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1:1', '2:1', '16:9', 'custom'].map((ratio) => {
                    const isActive = currentRatio === ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleRatioChange(ratio as AspectRatioOption)}
                        className={cn(
                          aspectButtonClasses.base,
                          isActive ? aspectButtonClasses.active : aspectButtonClasses.inactive
                        )}
                      >
                        <div 
                          className={cn(
                            ratio === '1:1' && aspectButtonClasses.icon,
                            ratio === '2:1' && aspectButtonClasses.icon2x1,
                            ratio === '16:9' && aspectButtonClasses.iconWide,
                            ratio === 'custom' && aspectButtonClasses.iconCustom
                          )}
                          style={{
                            backgroundColor: isActive ? 'currentColor' : 'transparent'
                          }}
                        />
                        <span className="text-xs font-medium">
                          {ratio === 'custom' ? 'Personalizado' : ratio}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {currentRatio === 'custom' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="custom-width">Ancho</Label>
                        <Input
                          id="custom-width"
                          type="number"
                          min={1}
                          value={currentCustomRatio.width}
                          onChange={(e) => handleCustomRatioChange({
                            ...currentCustomRatio,
                            width: Number(e.target.value)
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-height">Alto</Label>
                        <Input
                          id="custom-height"
                          type="number"
                          min={1}
                          value={currentCustomRatio.height}
                          onChange={(e) => handleCustomRatioChange({
                            ...currentCustomRatio,
                            height: Number(e.target.value)
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {activeMode === 'density' && (
            <TabsContent value="density" className="mt-4">
              <DensityControl
                gridSettings={currentSettings}
                aspectRatio={currentRatio}
                customRatio={currentCustomRatio}
                onChange={handleSettingsChange}
                onDensityChange={handleDensityChange}
              />
            </TabsContent>
          )}

          {activeMode === 'manual' && (
            <TabsContent value="manual" className="mt-4">
              <ManualControl
                initialSettings={currentSettings}
                _backgroundColor={_backgroundColor}
                onChange={handleSettingsChange}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default GridControlSelector;
