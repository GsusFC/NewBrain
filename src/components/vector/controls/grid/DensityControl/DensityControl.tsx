import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { AspectRatioOption, CustomAspectRatio, GridControlProps, GridSettings } from '../types';
import { useAspectRatioCalculator } from '@/hooks/vector/useAspectRatioCalculator';
import { DensityRatioSelector } from './DensityRatioSelector';

export const DensityControl: React.FC<GridControlProps> = ({
  initialSettings,
  initialAspectRatio = '16:9',
  initialCustomRatio,
  onChange,
  onAspectRatioChange
}) => {
  // Estado para el aspect ratio seleccionado
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(initialAspectRatio);
  
  // Estado para el ratio personalizado
  const [customRatio, setCustomRatio] = useState<CustomAspectRatio>(
    initialCustomRatio || { width: 16, height: 9 }
  );
  
  // Estado para la configuración del grid
  const [settings, setSettings] = useState<GridSettings>(initialSettings || {
    rows: 10,
    cols: 15,
    spacing: 30,
    margin: 20
  });
  
  // Estado para mostrar/ocultar el panel de ratio personalizado
  const [showCustomPanel, setShowCustomPanel] = useState(aspectRatio === 'custom');
  
  // Hook para cálculos de aspect ratio
  const calculator = useAspectRatioCalculator();
  
  // Efecto para inicializar con los valores proporcionados
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        rows: initialSettings.rows || 10,
        cols: initialSettings.cols || 15,
        spacing: initialSettings.spacing || 30,
        margin: initialSettings.margin || 20
      });
    }
    
    if (initialAspectRatio) {
      setAspectRatio(initialAspectRatio);
      setShowCustomPanel(initialAspectRatio === 'custom');
    }
    
    if (initialCustomRatio) {
      setCustomRatio(initialCustomRatio);
    }
  }, [initialSettings, initialAspectRatio, initialCustomRatio]);
  
  // Función para manejar cambios en el ratio de aspecto
  const handleAspectRatioChange = (newRatio: AspectRatioOption, newCustomRatio?: CustomAspectRatio) => {
    setAspectRatio(newRatio);
    setShowCustomPanel(newRatio === 'custom');
    
    if (newRatio === 'custom' && newCustomRatio) {
      setCustomRatio(newCustomRatio);
    }
    
    // Recalcular columnas basadas en el nuevo ratio
    const newCols = calculator.calculateColumnsFromRows(
      settings.rows || 10,
      newRatio,
      newRatio === 'custom' ? (newCustomRatio || customRatio) : undefined
    );
    
    const newSettings = {
      ...settings,
      cols: newCols
    };
    
    setSettings(newSettings);
    onChange(newSettings);
    
    // Notificar cambio de ratio si hay callback
    if (onAspectRatioChange) {
      onAspectRatioChange(
        newRatio, 
        newRatio === 'custom' ? (newCustomRatio || customRatio) : undefined
      );
    }
  };
  
  // Función para manejar cambios en el número de filas
  const handleRowsChange = (rows: number) => {
    // Calcular columnas para mantener el aspect ratio
    const newCols = calculator.calculateColumnsFromRows(
      rows,
      aspectRatio,
      aspectRatio === 'custom' ? customRatio : undefined
    );
    
    const newSettings = {
      ...settings,
      rows,
      cols: newCols
    };
    
    setSettings(newSettings);
    onChange(newSettings);
  };
  
  // Función para manejar otros cambios en la configuración
  const handleSettingChange = (key: keyof GridSettings, value: number) => {
    if (key === 'rows') {
      handleRowsChange(value);
      return;
    }
    
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(newSettings);
    onChange(newSettings);
  };
  
  return (
    <div className="space-y-4">
      {/* Información explicativa sobre el modo de densidad */}
      <div className="bg-slate-800/50 px-3 py-2 rounded-md text-xs text-slate-300 border border-slate-700">
        <p>El modo <span className="text-emerald-400 font-medium">Densidad</span> te permite:</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>Controlar directamente el número de filas</li>
          <li>Mantener automáticamente el aspect ratio seleccionado</li>
          <li>El sistema calcula el número óptimo de columnas</li>
        </ul>
      </div>

      {/* Selector de ratio de aspecto */}
      <DensityRatioSelector 
        aspectRatio={aspectRatio}
        customRatio={customRatio}
        showCustomPanel={showCustomPanel}
        onAspectRatioChange={handleAspectRatioChange}
        onCustomRatioChange={(newCustomRatio) => {
          handleAspectRatioChange('custom', newCustomRatio);
        }}
      />
      
      {/* Control de densidad */}
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="densityRowsSlider" className="text-sm font-medium">
            Densidad (filas)
          </Label>
          <div className="text-xs text-muted-foreground">
            <span className="text-emerald-400 font-medium">{settings.rows}</span> filas × <span className="text-emerald-400 font-medium">{settings.cols}</span> columnas
          </div>
        </div>
        <SliderWithInput 
          id="densityRowsSlider"
          value={[settings.rows || 10]}
          min={1}
          max={50}
          step={1}
          precision={0}
          onValueChange={(values) => handleSettingChange('rows', values[0])}
          className="mt-1"
        />
      </div>
      
      {/* Controles de espaciado */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="densitySpacingSlider" className="text-sm font-medium">
            Espaciado
          </Label>
          <SliderWithInput 
            id="densitySpacingSlider"
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
          <Label htmlFor="densityMarginSlider" className="text-sm font-medium">
            Margen
          </Label>
          <SliderWithInput 
            id="densityMarginSlider"
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
