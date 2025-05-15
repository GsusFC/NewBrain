"use client";

import React from 'react';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { GridSettings } from './types';

interface ManualControlProps {
  initialSettings: GridSettings;
  backgroundColor?: string;
  onChange: (settings: GridSettings) => void;
}

export const ManualControl: React.FC<ManualControlProps> = ({
  initialSettings,
  backgroundColor,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <SliderWithLabel
        label="Filas"
        value={[initialSettings.rows || 1]}
        onValueChange={(values) => onChange({ ...initialSettings, rows: values[0] })}
        min={1}
        max={50}
        step={1}
        formatValue={(val) => val.toString()}
      />

      <SliderWithLabel
        label="Columnas"
        value={[initialSettings.columns || 1]}
        onValueChange={(values) => onChange({ ...initialSettings, columns: values[0] })}
        min={1}
        max={50}
        step={1}
        formatValue={(val) => val.toString()}
      />

      <SliderWithLabel
        label="Espaciado"
        value={[initialSettings.spacing || 0]}
        onValueChange={(values) => onChange({ ...initialSettings, spacing: values[0] })}
        min={0}
        max={50}
        step={1}
        formatValue={(val) => `${val}px`}
      />
    </div>
  );
};

