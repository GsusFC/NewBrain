import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { GridControlProps, GridSettings } from '../types';

export const ManualControl: React.FC<GridControlProps> = ({
  initialSettings,
  onChange
}) => {
  const [settings, setSettings] = useState<GridSettings>(initialSettings || {
    rows: 10,
    cols: 15,
    spacing: 30,
    margin: 20
  });
  
  // Efecto para inicializar los settings con los valores iniciales
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        rows: initialSettings.rows || 10,
        cols: initialSettings.cols || 15,
        spacing: initialSettings.spacing || 30,
        margin: initialSettings.margin || 20
      });
    }
  }, [initialSettings]);
  
  const handleSettingChange = (key: keyof GridSettings, value: number) => {
    // Assert: El valor debe ser un número finito y positivo
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`[ManualControl] Valor inválido para '${key}': ${value}`);
    }
    // Log para depuración
    // eslint-disable-next-line no-console
    console.log(`[ManualControl] Cambio en '${key}':`, value);
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  // Log de render para depuración
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ManualControl] Render SliderWithInput margin:', settings.margin);
  }, [settings.margin]);
  
  return (
    <div className="space-y-4">
      {/* Información explicativa sobre el modo manual */}
      <div className="bg-slate-800/50 px-3 py-2 rounded-md text-xs text-slate-300 border border-slate-700">
        <p>El modo <span className="text-amber-400 font-medium">Manual</span> te permite:</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>Controlar directamente el número de filas y columnas</li>
          <li>Configurar la cuadrícula con total libertad</li>
          <li><span className="text-amber-400/80">Nota:</span> Este modo no mantiene automáticamente el aspect ratio</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="manualRowsSlider" className="text-sm font-medium">
              Filas
            </Label>
            <span className="text-xs text-amber-400 font-medium">{settings.rows}</span>
          </div>
          <SliderWithInput 
            id="manualRowsSlider"
            value={[settings.rows || 10]}
            min={1}
            max={50}
            step={1}
            precision={0}
            onValueChange={(values) => handleSettingChange('rows', values[0])}
            className="mt-1"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="manualColsSlider" className="text-sm font-medium">
              Columnas
            </Label>
            <span className="text-xs text-amber-400 font-medium">{settings.cols}</span>
          </div>
          <SliderWithInput 
            id="manualColsSlider"
            value={[settings.cols || 15]}
            min={1}
            max={50}
            step={1}
            precision={0}
            onValueChange={(values) => handleSettingChange('cols', values[0])}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manualSpacingSlider" className="text-sm font-medium">
            Espaciado
          </Label>
          <SliderWithInput 
            id="manualSpacingSlider"
            value={[settings.spacing || 30]}
            min={0}
            max={100}
            step={1}
            precision={0}
            onValueChange={(values) => handleSettingChange('spacing', values[0])}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="manualMarginSlider" className="text-sm font-medium">
            Margen
          </Label>
          <SliderWithInput 
            id="manualMarginSlider"
            value={[settings.margin || 20]}
            min={0}
            max={100}
            step={1}
            precision={0}
            onValueChange={(values) => handleSettingChange('margin', values[0])}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
