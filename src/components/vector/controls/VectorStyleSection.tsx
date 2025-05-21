"use client";

import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { VectorStyle } from './grid/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VectorStyleSectionProps {
  vectorStyle: VectorStyle;
  onChange: (style: Partial<VectorStyle>) => void;
}

type VectorShape = 'line' | 'arrow' | 'dot' | 'triangle' | 'semicircle' | 'curve' | 'custom-svg';

const VECTOR_SHAPES: { value: VectorShape; label: string }[] = [
  { value: 'line', label: 'Línea' },
  { value: 'arrow', label: 'Flecha' },
  { value: 'dot', label: 'Punto' },
  { value: 'triangle', label: 'Triángulo' },
  { value: 'semicircle', label: 'Semicírculo' },
  { value: 'curve', label: 'Curva' },
  { value: 'custom-svg', label: 'SVG Personalizado' },
];

export const VectorStyleSection: React.FC<VectorStyleSectionProps> = ({
  vectorStyle = {},
  onChange,
}) => {
  const handleShapeChange = (value: string) => {
    onChange({ shape: value as VectorShape });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-4">
      <h3 className="font-medium text-gray-900">Estilo del Vector</h3>
      
      <div className="space-y-2">
        <Label htmlFor="vector-shape-select">Forma</Label>
        <Select
          value={vectorStyle.shape || 'line'}
          onValueChange={handleShapeChange}
        >
          <SelectTrigger id="vector-shape-select" className="w-full">
            <SelectValue aria-label={vectorStyle.shape || 'line'}>
              {VECTOR_SHAPES.find(s => s.value === (vectorStyle.shape || 'line'))?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {VECTOR_SHAPES.map((shape) => (
              <SelectItem key={shape.value} value={shape.value}>
                {shape.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SliderWithLabel
        label="Longitud"
        value={[typeof vectorStyle.length === 'number' ? vectorStyle.length : 20]}
        onValueChange={(values) => onChange({ length: values[0] })}
        min={1}
        max={200}
        step={1}
        formatValue={(val) => `${val}px`}
      />

      <SliderWithLabel
        label="Grosor (px)"
        value={[vectorStyle.thickness || 2]}
        onValueChange={(values) => onChange({ thickness: values[0] })}
        min={1}
        max={20}
        step={0.5}
      />
    </div>
  );
};
