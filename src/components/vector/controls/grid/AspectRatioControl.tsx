"use client";

import React, { useEffect, useState } from 'react';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { GridSettings } from './types';

interface AspectRatioControlProps {
  initialSettings: GridSettings;
  backgroundColor?: string;
  onChange: (settings: GridSettings) => void;
}

export function AspectRatioControl({
  initialSettings,
  backgroundColor,
  onChange,
}: AspectRatioControlProps) {
  // Estados locales
  const [settings, setSettings] = useState<GridSettings>(initialSettings);

  // Actualizar estados cuando cambian las props
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSpacingChange = (values: number[]) => {
    const newSettings = { ...settings, spacing: values[0] };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <SliderWithLabel
      label="Espaciado"
      value={[settings.spacing || 0]}
      onValueChange={handleSpacingChange}
      min={0}
      max={50}
      step={1}
      formatValue={(val) => `${val}px`}
    />
  );
}
