import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { AspectRatioOption, CustomAspectRatio, GridControlProps, GridSettings } from '../types';
import { useAspectRatioCalculator } from '@/hooks/vector/useAspectRatioCalculator';
import { CustomRatioPanel } from './CustomRatioPanel';
import { AspectRatioButtons } from './AspectRatioButtons';

export const AspectRatioControl: React.FC<GridControlProps> = ({
  initialSettings,
  initialAspectRatio = '16:9',
  initialCustomRatio,
  onChange,
  onAspectRatioChange
}) => {
  // Estado para el aspect ratio seleccionado
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioOption>(initialAspectRatio);
  
  // Estado para el ratio personalizado
  const [customRatio, setCustomRatio] = useState<CustomAspectRatio>(
    initialCustomRatio || { width: 16, height: 9 }
  );
  
  // Estado para mostrar/ocultar el panel de ratio personalizado
  const [showCustomPanel, setShowCustomPanel] = useState(selectedRatio === 'custom');
  
  // Estado para la configuración del grid
  const [settings, setSettings] = useState<GridSettings>(initialSettings || {
    rows: 10,
    cols: 15,
    spacing: 30,
    margin: 20
  });
  
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
      setSelectedRatio(initialAspectRatio);
      setShowCustomPanel(initialAspectRatio === 'custom');
    }
    
    if (initialCustomRatio) {
      setCustomRatio(initialCustomRatio);
    }
  }, [initialSettings, initialAspectRatio, initialCustomRatio]);
  
  // Función para manejar el cambio de ratio de aspecto
  const handleAspectRatioChange = (newRatio: AspectRatioOption) => {
    setSelectedRatio(newRatio);
    setShowCustomPanel(newRatio === 'custom');
    
    // Factores de normalización para densidad visual coherente
    // Estos factores ajustan la densidad total para que se sienta similar
    const densityNormalizationFactor: Record<AspectRatioOption, number> = {
      '1:1': 1,     // Base de referencia
      '16:9': 0.8,  // Un poco menos denso para evitar muchas columnas
      '2:1': 0.7,   // Aun menos denso en formatos muy anchos 
      'custom': 0.8, // Por defecto similar a 16:9
      'auto': 0.9   // Ligeramente menos denso que 1:1 para contenedores
    };
    
    // Obtener el factor para este ratio
    const factor = densityNormalizationFactor[newRatio] || 1;
    
    // Aplicar el factor de normalización a las filas
    // Esto dará una sensación visual similar entre ratios
    const normalizedRows = Math.round((settings.rows || 10) * factor);
    
    // Calcular columnas basadas en las filas normalizadas
    let newCols = calculator.calculateColumnsFromRows(
      normalizedRows,
      newRatio,
      newRatio === 'custom' ? customRatio : undefined
    );
    
    // Añadir columnas adicionales específicamente para el ratio 16:9
    if (newRatio === '16:9') {
      // Aumentar significativamente para asegurar que el cambio sea visible
      newCols = newCols + 10; // Aumentamos a 10 columnas para mayor visibilidad
      
      // Forzar también un mínimo de columnas si el cálculo es demasiado bajo
      newCols = Math.max(newCols, 20);
    }
    
    const newSettings = {
      ...settings,
      rows: normalizedRows,
      cols: newCols
    };
    
    setSettings(newSettings);
    onChange(newSettings);
    
    // Notificar cambio de ratio si hay callback
    if (onAspectRatioChange) {
      onAspectRatioChange(newRatio, newRatio === 'custom' ? customRatio : undefined);
    }
  };
  
  // Función para manejar cambios en el ratio personalizado
  const handleCustomRatioChange = (newCustomRatio: CustomAspectRatio) => {
    setCustomRatio(newCustomRatio);
    
    // Solo actualizar grid si el ratio actual es 'custom'
    if (selectedRatio === 'custom') {
      // Mantener la misma cantidad de filas al cambiar el ratio personalizado
      const currentRows = settings.rows || 10;
      const newCols = calculator.calculateColumnsFromRows(
        currentRows,
        'custom',
        newCustomRatio
      );
      
      const newSettings = {
        ...settings,
        cols: newCols
      };
      
      setSettings(newSettings);
      onChange(newSettings);
      
      // Notificar cambio de ratio personalizado
      if (onAspectRatioChange) {
        onAspectRatioChange('custom', newCustomRatio);
      }
    }
  };
  
  // Función para manejar cambios en la configuración del grid
  const handleSettingChange = (key: keyof GridSettings, value: number) => {
    let newSettings: GridSettings;
    
    // Si cambian las filas, recalcular columnas para mantener ratio
    if (key === 'rows') {
      const newCols = calculator.calculateColumnsFromRows(
        value,
        selectedRatio,
        selectedRatio === 'custom' ? customRatio : undefined
      );
      
      newSettings = {
        ...settings,
        rows: value,
        cols: newCols
      };
    } else {
      // Para otros cambios, simplemente actualizar el valor
      newSettings = {
        ...settings,
        [key]: value
      };
    }
    
    setSettings(newSettings);
    onChange(newSettings);
  };
  
  return (
    <div className="space-y-4">
      {/* Información explicativa sobre el modo de ratio fijo */}
      <div className="bg-slate-800/50 px-3 py-2 rounded-md text-xs text-slate-300 border border-slate-700">
        <p>El modo <span className="text-indigo-400 font-medium">Ratio Fijo</span> te permite:</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>Mantener una relación de aspecto específica</li>
          <li>El sistema calcula automáticamente filas y columnas óptimas</li>
          <li>Los vectores mantienen proporciones visuales consistentes</li>
        </ul>
      </div>

      {/* Selector de ratio de aspecto */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-medium">Ratio de aspecto</Label>
          <div className="text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">{settings.rows}</span> filas × <span className="text-indigo-400 font-medium">{settings.cols}</span> columnas
          </div>
        </div>
        <AspectRatioButtons 
          selectedRatio={selectedRatio}
          onRatioChange={handleAspectRatioChange}
        />
      </div>
      
      {/* Panel de ratio personalizado */}
      {showCustomPanel && (
        <CustomRatioPanel 
          customRatio={customRatio} 
          onChange={handleCustomRatioChange} 
        />
      )}
      
      {/* Controles de espaciado */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="fixedSpacingSlider" className="text-sm font-medium">
            Espaciado
          </Label>
          <SliderWithInput 
            id="fixedSpacingSlider"
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
          <Label htmlFor="fixedMarginSlider" className="text-sm font-medium">
            Margen
          </Label>
          <SliderWithInput 
            id="fixedMarginSlider"
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
