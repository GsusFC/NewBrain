import isEqual from 'fast-deep-equal';
import { useCallback, useEffect, useMemo, useReducer, FC, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-headless';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DensityControl } from './DensityControl';
import { ManualControl } from './ManualControl';
import { AspectRatioOption, CustomAspectRatio, GridSettings } from './types';
import { Info } from 'lucide-react';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  | { type: 'SYNC_FROM_PROPS'; gridSettings: GridSettings; aspectRatio: AspectRatioOption; customAspectRatio?: CustomAspectRatio }; // Nueva acciu00f3n para sincronizaciu00f3n

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
      // Validar valores mu00ednimos
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
      // Solo actualizar si los props son diferentes para evitar bucles de actualizaciu00f3n
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
  const [state, dispatch] = useReducer(
    gridReducer,
    initialState(gridSettings, aspectRatio, customAspectRatio)
  );

  const { settings, ratios, customRatios, activeMode } = state;

  const currentSettings = useMemo(() => settings[activeMode], [settings, activeMode]);
  const currentRatio = useMemo(() => ratios[activeMode], [ratios, activeMode]);
  const currentCustomRatio = useMemo(() => customRatios[activeMode], [customRatios, activeMode]);

  // Usar useRef para rastrear si es la primera renderizaciu00f3n
  const isInitialMount = useRef(true);
  const prevProps = useRef({ gridSettings, aspectRatio, customAspectRatio });

  // Notificar cambios al padre de manera optimizada
  const notifyChanges = useCallback((mode: Mode, force = false) => {
    // Evitar notificaciones innecesarias en montaje inicial
    if (isInitialMount.current && !force) return;

    let finalGridSettings = { ...settings[mode] };
    const finalAspectRatio = ratios[mode];
    const finalCustomRatio = customRatios[mode];

    if (mode === 'manual') {
      const isManualRatioFixed = 
        finalAspectRatio !== 'auto' && 
        !(finalAspectRatio === 'custom' && (finalCustomRatio.width <= 0 || finalCustomRatio.height <= 0));

      if (isManualRatioFixed) {
        const manualRows = finalGridSettings.rows || 0;
        const manualCols = finalGridSettings.cols || 0;

        if (manualRows > 0 && manualCols === 0) {
          // Filas fijas, Columnas Auto (cols ya es 0, solo asegurar)
          finalGridSettings.cols = 0; 
        } else if (manualCols > 0 && manualRows === 0) {
          // Columnas fijas, Filas Auto
          finalGridSettings.rows = 0;
        } else if (manualRows === 0 && manualCols === 0) {
          // Ambos Auto: Filas = 10 (DEFAULT_DENSITY), Columnas Auto
          finalGridSettings.rows = 10; 
          finalGridSettings.cols = 0;
        }
        // Si manualRows > 0 y manualCols > 0, se usan ambos, no se modifica nada aquu00ed.
      }
    }
    
    onPropsChange({
      gridSettings: finalGridSettings,
      aspectRatio: finalAspectRatio,
      customAspectRatio: finalAspectRatio === 'custom' ? finalCustomRatio : undefined,
      ...(_backgroundColor ? { _backgroundColor } : {})
    });
  }, [settings, ratios, customRatios, _backgroundColor, onPropsChange]);
  
  // Efecto para manejar el montaje inicial
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      notifyChanges(activeMode, true); // Forzar en montaje
    }
    // Dejar activeMode y notifyChanges como dependencias es correcto para el montaje,
    // pero este efecto solo debe correr una vez.
  }, [activeMode, notifyChanges]); // Mantener dependencias por si activeMode se define tarde.

  // Nuevo useEffect para reaccionar a cambios de estado interno que deben notificarse
  useEffect(() => {
    if (!isInitialMount.current && state.lastUpdatedMode) {
      notifyChanges(state.lastUpdatedMode);
      // Considera resetear lastUpdatedMode aquu00ed si causa notificaciones no deseadas en otros flujos
      // Ejemplo: dispatch({ type: 'CLEAR_LAST_UPDATED_MODE' }); // Necesitaru00eda nueva acciu00f3n
    }
  }, [state.lastUpdatedMode, state.settings, state.ratios, state.customRatios, notifyChanges]); // Depender de los datos asegura la notificaciu00f3n si cambian.

  // Manejar cambio de pestau00f1a con accesibilidad mejorada
  const handleTabChange = useCallback((value: string) => {
    const newMode = value as Mode;
    dispatch({ type: 'SET_ACTIVE_MODE', mode: newMode });
  }, [dispatch]);

  const handleSettingsChange = useCallback((newSettings: GridSettings) => {
    if (isEqual(settings[activeMode], newSettings)) return;
    dispatch({ type: 'UPDATE_SETTINGS', mode: activeMode, settings: newSettings });
  }, [dispatch, activeMode, settings]);

  const handleRatioChange = useCallback((newRatio: AspectRatioOption) => {
    if (ratios[activeMode] === newRatio) return;
    dispatch({ type: 'UPDATE_RATIO', mode: activeMode, ratio: newRatio });
  }, [dispatch, activeMode, ratios]);

  const handleCustomRatioChange = useCallback((newCustomRatio: CustomAspectRatio) => {
    const validatedRatio = {
      width: Math.max(1, Math.round(newCustomRatio.width)),
      height: Math.max(1, Math.round(newCustomRatio.height))
    };
    if (isEqual(customRatios[activeMode], validatedRatio)) return;
    dispatch({ type: 'UPDATE_CUSTOM_RATIO', mode: activeMode, customRatio: validatedRatio });
  }, [dispatch, activeMode, customRatios]);

  const handleDensityChange = useCallback((density: number) => {
    const activeSettings = settings[activeMode];
    const activeCustomRatio = customRatios[activeMode];
    const validatedDensity = Math.max(1, Math.min(100, Math.round(density)));
    
    if (activeCustomRatio.width <= 0 || activeCustomRatio.height <= 0) {
        // console.warn("Custom ratio no vu00e1lido para calcular densidad.");
        const newSettings = { ...activeSettings, rows: validatedDensity, cols: activeSettings.cols }; // Mantener cols si AR no es vu00e1lido
        if (!isEqual(activeSettings, newSettings)) {
            dispatch({ type: 'UPDATE_SETTINGS', mode: activeMode, settings: newSettings });
        }
        return;
    }

    const aspectRatioValue = activeCustomRatio.width / activeCustomRatio.height;
    const newCols = Math.round(validatedDensity * aspectRatioValue);
    
    if (activeSettings.rows === validatedDensity && activeSettings.cols === newCols) return;
    
    const newSettingsWithCols = {
      ...activeSettings,
      rows: validatedDensity,
      cols: newCols
    };
    dispatch({ type: 'UPDATE_SETTINGS', mode: activeMode, settings: newSettingsWithCols });
  }, [settings, customRatios, activeMode, dispatch]);

  // Sincronizar con cambios en las props externas (ya existente y parece correcto)
  useEffect(() => {
    const propsChanged = (
      !isEqual(prevProps.current.gridSettings, gridSettings) ||
      prevProps.current.aspectRatio !== aspectRatio ||
      !isEqual(prevProps.current.customAspectRatio, customAspectRatio)
    );
    if (propsChanged) {
      dispatch({
        type: 'SYNC_FROM_PROPS',
        gridSettings,
        aspectRatio,
        customAspectRatio
      });
      prevProps.current = { gridSettings, aspectRatio, customAspectRatio };
    }
  }, [gridSettings, aspectRatio, customAspectRatio, dispatch]); // Added dispatch to dependencies

  // const aspectRatioTooltip = (
  //   <TooltipProvider>
  //     <Tooltip>
  //       <TooltipTrigger asChild>
  //         <button 
  //           type="button" 
  //           className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
  //           aria-label="Ayuda sobre aspect ratio"
  //         >
  //           <Info className="w-3.5 h-3.5" />
  //         </button>
  //       </TooltipTrigger>
  //       <TooltipContent side="top" className="max-w-xs p-3 text-sm">
  //         <p className="font-medium mb-1">Configuraciu00f3n de Aspect Ratio</p>
  //         <ul className="list-disc pl-4 space-y-1">
  //           <li>Selecciona un ratio predefinido o usa uno personalizado</li>
  //           <li>El sistema ajustaru00e1 automu00e1ticamente la cuadru00edcula</li>
  //           <li>Usa el modo manual para control total sobre filas/columnas</li>
  //         </ul>
  //       </TooltipContent>
  //     </Tooltip>
  //   </TooltipProvider>
  // );

  const aspectButtonClasses = useMemo(() => ({
    base: "flex flex-col items-center justify-center p-3 rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active: "bg-primary/15 shadow-sm ring-1 ring-primary/20 text-primary",
    inactive: "hover:bg-accent/10 hover:text-foreground text-muted-foreground",
    icon: "w-8 h-8 border-2 border-current rounded-sm mb-2",
    iconWide: "w-12 h-[27px] border-2 border-current rounded-sm mb-2",
    icon2x1: "w-12 h-6 border-2 border-current rounded-sm mb-2",
    iconCustom: "w-8 h-8 border-2 border-primary/50 rounded-sm mb-2 border-dashed"
  }), []);

  return null;
};

export default GridControlSelector;