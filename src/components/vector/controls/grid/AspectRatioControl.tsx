"use client";

import React, { useEffect, useState } from 'react';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { GridSettings } from './types';

interface AspectRatioControlProps {
  initialSettings: GridSettings;
  onChange: (settings: GridSettings) => void;
}

export function AspectRatioControl({
  initialSettings,
  onChange,
}: AspectRatioControlProps) {
  // Local state
  const [settings, setSettings] = useState<GridSettings>(initialSettings);

  // Update state when props change
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
      label="Spacing"
      value={[settings.spacing ?? 0]}
      onValueChange={handleSpacingChange}
      min={0}
      max={50}
      step={1}
      formatValue={(val) => `${val}px`}
    />
  );
}
