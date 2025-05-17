import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className = '',
  labelClassName = '',
  valueClassName = 'text-xs text-muted-foreground',
}: SliderFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between">
        <Label className={labelClassName}>{label}</Label>
        <span className={valueClassName}>
          {value}
          {unit && ` ${unit}`}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
      />
    </div>
  );
}
