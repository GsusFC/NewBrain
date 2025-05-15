import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  
  const handleAspectRatioChange = (newRatio: AspectRatioOption) => {
    setAspectRatioSelection(newRatio);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'aspect-ratio') {
      onPropsChange({
        aspectRatio: newRatio,
        customAspectRatio: newRatio === 'custom' ? aspectRatioCustom : undefined
      });
    }
  };
  
  const handleAspectRatioCustomChange = (newCustomRatio: CustomAspectRatio) => {
    setAspectRatioCustom(newCustomRatio);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'aspect-ratio') {
      onPropsChange({
        aspectRatio: 'custom',
        customAspectRatio: newCustomRatio
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

  const handleDensityRatioChange = (newRatio: AspectRatioOption) => {
    setDensityRatio(newRatio);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'density') {
      onPropsChange({
        aspectRatio: newRatio,
        customAspectRatio: newRatio === 'custom' ? densityCustomRatio : undefined
      });
    }
  };

  const handleDensityCustomRatioChange = (newCustomRatio: CustomAspectRatio) => {
    setDensityCustomRatio(newCustomRatio);
    
    // Solo actualizar props globales si este modo está activo
    if (activeMode === 'density') {
      onPropsChange({
        aspectRatio: 'custom',
        customAspectRatio: newCustomRatio
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
    
    // Al cambiar de modo, actualizar las props globales con los valores del nuevo modo
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
        gridSettings: manualSettings,
        aspectRatio: manualRatio,
        customAspectRatio: manualRatio === 'custom' ? manualCustomRatio : undefined
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs
        value={activeMode}
        onValueChange={(value) => {
          handleModeChange(value as 'aspect-ratio' | 'density' | 'manual');
        }}
      >
        <TabsList className="grid w-full grid-cols-3 h-auto mb-8 bg-background/50 rounded-md p-1">
            <TabsTrigger 
              value="aspect-ratio" 
              className="data-[state=active]:bg-primary/10 transition-colors duration-200 hover:bg-primary/5 rounded-sm"
            >
              <span className="text-xs font-medium">Ratio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="density" 
              className="data-[state=active]:bg-primary/10 transition-colors duration-200 hover:bg-primary/5 rounded-sm"
            >
              <span className="text-xs font-medium">Densidad</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="data-[state=active]:bg-primary/10 transition-colors duration-200 hover:bg-primary/5 rounded-sm"
            >
              <span className="text-xs font-medium">Manual</span>
            </TabsTrigger>
        </TabsList>

        <div>
          <div className={activeMode !== 'aspect-ratio' ? 'hidden' : ''}>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => handleAspectRatioChange('1:1')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  aspectRatioSelection === '1:1' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-8 h-8 border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">1:1</span>
              </button>
              <button
                onClick={() => handleAspectRatioChange('16:9')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  aspectRatioSelection === '16:9' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-12 h-[27px] border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">16:9</span>
              </button>
              <button
                onClick={() => handleAspectRatioChange('2:1')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  aspectRatioSelection === '2:1' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-12 h-6 border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">2:1</span>
              </button>
              <button
                onClick={() => handleAspectRatioChange('custom')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  aspectRatioSelection === 'custom' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-8 h-8 border-2 border-primary/50 rounded-sm mb-2 border-dashed" />
                <span className="text-xs font-medium">Custom</span>
              </button>
            </div>

            {aspectRatioSelection === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-xs mb-2">Ancho</Label>
                  <Input
                    type="number"
                    min="1"
                    value={aspectRatioCustom.width}
                    onChange={(e) => handleAspectRatioCustomChange({ ...aspectRatioCustom, width: parseInt(e.target.value) || 1 })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-2">Alto</Label>
                  <Input
                    type="number"
                    min="1"
                    value={aspectRatioCustom.height}
                    onChange={(e) => handleAspectRatioCustomChange({ ...aspectRatioCustom, height: parseInt(e.target.value) || 1 })}
                    className="h-9"
                  />
                </div>
              </div>
            )}

            <SliderWithLabel
              label="Espaciado"
              value={[aspectRatioSettings.spacing || 0]}
              onValueChange={(values) => handleAspectRatioSettingsChange({ ...aspectRatioSettings, spacing: values[0] })}
              min={0}
              max={50}
              step={1}
              formatValue={(val) => `${val}px`}
            />
          </div>

          <div className={activeMode !== 'density' ? 'hidden' : 'space-y-6'}>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => handleDensityRatioChange('1:1')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  densityRatio === '1:1' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-8 h-8 border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">1:1</span>
              </button>
              <button
                onClick={() => handleDensityRatioChange('16:9')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  densityRatio === '16:9' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-12 h-[27px] border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">16:9</span>
              </button>
              <button
                onClick={() => handleDensityRatioChange('2:1')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  densityRatio === '2:1' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-12 h-6 border-2 border-primary/50 rounded-sm mb-2" />
                <span className="text-xs font-medium">2:1</span>
              </button>
              <button
                onClick={() => handleDensityRatioChange('custom')}
                className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors duration-200 ${
                  densityRatio === 'custom' ? 'bg-primary/10' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-8 h-8 border-2 border-primary/50 rounded-sm mb-2 border-dashed" />
                <span className="text-xs font-medium">Custom</span>
              </button>
            </div>

            {densityRatio === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-xs mb-2">Ancho</Label>
                  <Input
                    type="number"
                    min="1"
                    value={densityCustomRatio.width}
                    onChange={(e) => handleDensityCustomRatioChange({ ...densityCustomRatio, width: parseInt(e.target.value) || 1 })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-2">Alto</Label>
                  <Input
                    type="number"
                    min="1"
                    value={densityCustomRatio.height}
                    onChange={(e) => handleDensityCustomRatioChange({ ...densityCustomRatio, height: parseInt(e.target.value) || 1 })}
                    className="h-9"
                  />
                </div>
              </div>
            )}

            <DensityControl 
              initialSettings={densitySettings}
              backgroundColor={backgroundColor}
              onChange={handleDensitySettingsChange}
            />
          </div>

          <div className={activeMode !== 'manual' ? 'hidden' : 'space-y-6'}>
            <ManualControl 
              initialSettings={manualSettings}
              backgroundColor={backgroundColor}
              onChange={handleManualSettingsChange}
            />
          </div>
        </div>
      </Tabs>
    </div>
  );
};

