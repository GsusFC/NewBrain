import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AspectRatioControl } from './AspectRatioControl';
import { DensityControl } from './DensityControl';
import { ManualControl } from './ManualControl';
import { AspectRatioOption, CustomAspectRatio, GridSettings } from './types';

export interface GridControlSelectorProps {
  gridSettings?: GridSettings;
  aspectRatio?: AspectRatioOption;
  customAspectRatio?: CustomAspectRatio;
  backgroundColor?: string;
  onPropsChange: (props: {
    gridSettings?: GridSettings;
    aspectRatio?: AspectRatioOption;
    customAspectRatio?: CustomAspectRatio;
  }) => void;
}

export const GridControlSelector: React.FC<GridControlSelectorProps> = ({
  gridSettings = {},
  aspectRatio = '16:9',
  customAspectRatio,
  backgroundColor,
  onPropsChange
}) => {
  // Estado para controlar el modo de configuración activo
  const [activeMode, setActiveMode] = useState<'aspect-ratio' | 'density' | 'manual'>('aspect-ratio');
  
  // Estados independientes para cada modo
  const [aspectRatioSettings, setAspectRatioSettings] = useState<GridSettings>(gridSettings);
  const [aspectRatioSelection, setAspectRatioSelection] = useState<AspectRatioOption>(aspectRatio);
  const [aspectRatioCustom, setAspectRatioCustom] = useState<CustomAspectRatio>(
    customAspectRatio || { width: 16, height: 9 }
  );
  
  const [densitySettings, setDensitySettings] = useState<GridSettings>(gridSettings);
  const [densityRatio, setDensityRatio] = useState<AspectRatioOption>(aspectRatio);
  const [densityCustomRatio, setDensityCustomRatio] = useState<CustomAspectRatio>(
    customAspectRatio || { width: 16, height: 9 }
  );
  
  const [manualSettings, setManualSettings] = useState<GridSettings>(gridSettings);
  
  // Inicializar estados cuando cambian las props
  useEffect(() => {
    // Actualizar estados cuando cambian las props correspondientes
    if (Object.keys(gridSettings).length > 0) {
      setAspectRatioSettings(gridSettings);
      setDensitySettings(gridSettings);
      setManualSettings(gridSettings);
    }
    
    if (aspectRatio) {
      setAspectRatioSelection(aspectRatio);
      setDensityRatio(aspectRatio);
    }
    
    if (customAspectRatio) {
      setAspectRatioCustom(customAspectRatio);
      setDensityCustomRatio(customAspectRatio);
    }
  }, [gridSettings, aspectRatio, customAspectRatio]);
  
  // Manejadores para cada modo
  const handleAspectRatioSettingsChange = (newSettings: GridSettings) => {
    setAspectRatioSettings(newSettings);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'aspect-ratio') {
      onPropsChange({
        gridSettings: newSettings,
        aspectRatio: aspectRatioSelection,
        customAspectRatio: aspectRatioSelection === 'custom' ? aspectRatioCustom : undefined
      });
    }
  };
  
  const handleAspectRatioSelectionChange = (
    newRatio: AspectRatioOption, 
    newCustomRatio?: CustomAspectRatio
  ) => {
    setAspectRatioSelection(newRatio);
    
    if (newRatio === 'custom' && newCustomRatio) {
      setAspectRatioCustom(newCustomRatio);
    }
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'aspect-ratio') {
      onPropsChange({
        aspectRatio: newRatio,
        customAspectRatio: newRatio === 'custom' ? (newCustomRatio || aspectRatioCustom) : undefined
      });
    }
  };
  
  const handleDensitySettingsChange = (newSettings: GridSettings) => {
    setDensitySettings(newSettings);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'density') {
      onPropsChange({
        gridSettings: newSettings,
        aspectRatio: densityRatio,
        customAspectRatio: densityRatio === 'custom' ? densityCustomRatio : undefined
      });
    }
  };
  
  const handleDensityRatioChange = (
    newRatio: AspectRatioOption, 
    newCustomRatio?: CustomAspectRatio
  ) => {
    setDensityRatio(newRatio);
    
    if (newRatio === 'custom' && newCustomRatio) {
      setDensityCustomRatio(newCustomRatio);
    }
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'density') {
      onPropsChange({
        aspectRatio: newRatio,
        customAspectRatio: newRatio === 'custom' ? (newCustomRatio || densityCustomRatio) : undefined
      });
    }
  };
  
  const handleManualSettingsChange = (newSettings: GridSettings) => {
    setManualSettings(newSettings);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'manual') {
      onPropsChange({
        gridSettings: newSettings
      });
    }
  };
  
  // Función para cambiar de modo
  const handleModeChange = (newMode: 'aspect-ratio' | 'density' | 'manual') => {
    setActiveMode(newMode);
    
    // Aplicar la configuración correspondiente al modo seleccionado
    if (newMode === 'aspect-ratio') {
      onPropsChange({
        gridSettings: aspectRatioSettings,
        aspectRatio: aspectRatioSelection,
        customAspectRatio: aspectRatioSelection === 'custom' ? aspectRatioCustom : undefined
      });
    } else if (newMode === 'density') {
      onPropsChange({
        gridSettings: densitySettings,
        aspectRatio: densityRatio,
        customAspectRatio: densityRatio === 'custom' ? densityCustomRatio : undefined
      });
    } else if (newMode === 'manual') {
      onPropsChange({
        gridSettings: manualSettings
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Selector de modo */}
      <div>
        <Label className="mb-2 block">Modo de control</Label>
        <ToggleGroup 
          type="single" 
          value={activeMode}
          onValueChange={(value) => {
            if (value) handleModeChange(value as 'aspect-ratio' | 'density' | 'manual');
          }}
          className="justify-start border border-slate-700 rounded-md p-1 bg-slate-800"
        >
          <ToggleGroupItem value="aspect-ratio" className="text-xs bg-indigo-900/30">
            Ratio Fijo
          </ToggleGroupItem>
          <ToggleGroupItem value="density" className="text-xs bg-emerald-900/30">
            Densidad
          </ToggleGroupItem>
          <ToggleGroupItem value="manual" className="text-xs bg-amber-900/30">
            Manual
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Controles según el modo seleccionado */}
      {activeMode === 'aspect-ratio' && (
        <AspectRatioControl 
          initialSettings={aspectRatioSettings}
          initialAspectRatio={aspectRatioSelection}
          initialCustomRatio={aspectRatioCustom}
          backgroundColor={backgroundColor}
          onChange={handleAspectRatioSettingsChange}
          onAspectRatioChange={handleAspectRatioSelectionChange}
        />
      )}
      
      {activeMode === 'density' && (
        <DensityControl 
          initialSettings={densitySettings}
          initialAspectRatio={densityRatio}
          initialCustomRatio={densityCustomRatio}
          backgroundColor={backgroundColor}
          onChange={handleDensitySettingsChange}
          onAspectRatioChange={handleDensityRatioChange}
        />
      )}
      
      {activeMode === 'manual' && (
        <ManualControl 
          initialSettings={manualSettings}
          backgroundColor={backgroundColor}
          onChange={handleManualSettingsChange}
        />
      )}
    </div>
  );
};
