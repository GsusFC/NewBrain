'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Componentes básicos hasta tener shadcn/ui configurado
const Label = ({ htmlFor, className = '', children }: any) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium ${className}`}>{children}</label>
);

const Input = ({ id, type = 'text', value, onChange, className = '' }: any) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm ${className}`}
  />
);

const Button = ({ variant = 'default', size = 'default', onClick, className = '', children }: any) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none ${
      variant === 'outline' ? 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
    } ${
      size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 py-2'
    } ${className}`}
  >
    {children}
  </button>
);

// Componente para control deslizante (slider)
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  className = "",
}: SliderControlProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`slider-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground w-12 text-right">
          {value}
        </span>
      </div>
      <Slider
        id={`slider-${label}`}
        min={min}
        max={max}
        step={step}
        defaultValue={[value]}
        onValueChange={(values) => onChange(values[0])}
        className="w-full"
      />
    </div>
  );
}

// Componente para selector (dropdown)
interface SelectControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectControl({
  label,
  value,
  onChange,
  options,
  className = "",
}: SelectControlProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={`select-${label}`} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`select-${label}`} className="w-full">
          <SelectValue placeholder={`Seleccionar ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Componente para interruptores (switch)
interface SwitchControlProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function SwitchControl({
  label,
  checked,
  onCheckedChange,
  className = "",
}: SwitchControlProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Label htmlFor={`switch-${label}`} className="text-sm font-medium">
        {label}
      </Label>
      <Switch
        id={`switch-${label}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

// Componente para selección de color
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({
  label,
  value,
  onChange,
  className = "",
}: ColorPickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`color-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        <div 
          className="w-6 h-6 rounded-full border border-border"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-0 overflow-hidden"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8"
        />
      </div>
    </div>
  );
}

// Componente de botón de reset
interface ResetButtonProps {
  onClick: () => void;
  className?: string;
}

export function ResetButton({ onClick, className = "" }: ResetButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      className={`w-full ${className}`}
    >
      Restablecer valores
    </Button>
  );
}
