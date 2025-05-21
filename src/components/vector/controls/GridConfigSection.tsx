"use client";

import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { GridSettings } from './grid/types';

interface GridConfigSectionProps {
  settings: GridSettings;
  onChange: (settings: Partial<GridSettings>) => void;
}

export const GridConfigSection: React.FC<GridConfigSectionProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900">Configuración de Grid</h3>
      
      <SliderWithLabel
        label="Filas (1-200)"
        value={[settings.rows || 10]}
        onValueChange={(values) => onChange({ rows: values[0] })}
        min={1}
        max={200}
        step={1}
      />

      <SliderWithLabel
        label="Columnas (1-200)"
        value={[settings.cols || 10]}
        onValueChange={(values) => onChange({ cols: values[0] })}
        min={1}
        max={200}
        step={1}
      />

      <SliderWithLabel
        label="Tamaño del Vector (px)"
        value={[settings.vectorSize || 20]}
        onValueChange={(values) => onChange({ vectorSize: values[0] })}
        min={1}
        max={100}
        step={1}
      />

      <SliderWithLabel
        label="Espaciado (px)"
        value={[settings.spacing || 10]}
        onValueChange={(values) => onChange({ spacing: values[0] })}
        min={0}
        max={100}
        step={1}
      />
    </div>
  );
};
