"use client";

import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { ColorSettings } from './grid/types';
import { HexColorPicker } from 'react-colorful';
import { useState, KeyboardEvent } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ColorAppearanceSectionProps {
  colorSettings: ColorSettings;
  onChange: (settings: Partial<ColorSettings>) => void;
}

export const ColorAppearanceSection: React.FC<ColorAppearanceSectionProps> = ({
  colorSettings = {},
  onChange,
}) => {
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const handleColorChange = (color: string, key: keyof ColorSettings) => {
    onChange({ [key]: color });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, pickerType: string) => {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setShowColorPicker(pickerType);
    }
  };

  const renderColorPickerButton = (type: 'base' | 'start' | 'end', label: string) => {
    const colorMap = {
      base: colorSettings.baseColor || '#000000',
      start: colorSettings.gradientStart || '#000000',
      end: colorSettings.gradientEnd || '#ffffff'
    };

    const colorNameMap = {
      base: 'base',
      start: 'inicial del gradiente',
      end: 'final del gradiente'
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={`${type}-color`}>
          {label}
        </Label>
        <button
          id={`${type}-color`}
          type="button"
          className="w-full h-10 rounded-md border p-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => setShowColorPicker(prev => prev === type ? null : type)}
          onKeyDown={(e) => handleKeyDown(e, type)}
          aria-label={`Color ${colorNameMap[type]}: ${colorMap[type]}. Presiona Enter o Espacio para cambiar`}
          aria-expanded={showColorPicker === type}
          aria-controls={`${type}-color-picker`}
          aria-haspopup="dialog"
        >
          <div 
            className="w-full h-full"
            style={{ backgroundColor: colorMap[type] }}
          />
        </button>
        {showColorPicker === type && (
          <div 
            id={`${type}-color-picker`}
            className="absolute z-10 bg-white p-4 rounded-lg shadow-lg"
            role="dialog"
            aria-labelledby={`${type}-color`}
          >
            <HexColorPicker 
              color={colorMap[type]} 
              onChange={(color) => handleColorChange(color, `${type}Color` as keyof ColorSettings)} 
            />
            <button 
              className="mt-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setShowColorPicker(null)}
              aria-label="Cerrar selector de color"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-4">
      <h3 className="font-medium text-gray-900">Color y Apariencia</h3>
      
      {renderColorPickerButton('base', 'Color Base')}

      <div className="flex items-center space-x-2">
        <Switch 
          id="gradient-toggle" 
          checked={colorSettings.useGradient || false}
          onChange={(checked: boolean) => onChange({ useGradient: checked })}
        />
        <Label htmlFor="gradient-toggle">Usar Gradiente</Label>
      </div>

      {colorSettings.useGradient && (
        <div className="gradient-controls space-y-4">
          {renderColorPickerButton('start', 'Color Inicial')}
          {renderColorPickerButton('end', 'Color Final')}

          <SliderWithLabel
            label="Ángulo del Gradiente (0-360°)"
            value={[colorSettings.gradientAngle || 0]}
            onValueChange={(values) => onChange({ gradientAngle: values[0] })}
            min={0}
            max={360}
            step={1}
            formatValue={(val) => `${val}°`}
          />
        </div>
      )}

      <SliderWithLabel
        label="Opacidad"
        value={[colorSettings.opacity || 100]}
        min={0}
        max={100}
        step={1}
        onValueChange={(value) => onChange({ opacity: value[0] })}
        aria-label="Control deslizante de opacidad"
      />
    </div>
  );
};
