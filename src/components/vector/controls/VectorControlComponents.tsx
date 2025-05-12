'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label as UILabel } from '@/components/ui/label';

// Componente Label personalizado basado en UILabel de shadcn/ui
const Label = ({ htmlFor, className = '', children }: { htmlFor?: string; className?: string; children: React.ReactNode }) => (
  <UILabel htmlFor={htmlFor} className={className}>{children}</UILabel>
);

// Nota: Ya no necesitamos este componente Input porque ahora usamos el de shadcn/ui

// Componente para control deslizante (slider)
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: () => void; // Nuevo prop para capturar el final del arrastre
  min: number;
  max: number;
  step: number;
  className?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  onChangeEnd, // Nuevo prop
  min,
  max,
  step,
  className = "",
}: SliderControlProps) {
  // Proteger contra posibles valores inválidos
  const safeValue = useMemo(() => {
    return Math.max(min, Math.min(max, value));
  }, [value, min, max]);
  
  // Formatear los valores numéricos para mostrar
  const formatValue = useCallback((val: number) => {
    // Determinar el número de decimales basado en el step
    const decimalPlaces = step.toString().includes('.') 
      ? step.toString().split('.')[1].length 
      : 0;
    return val.toFixed(decimalPlaces);
  }, [step]);
  
  // Input value como string, sincronizado con el valor del slider
  const [inputValue, setInputValue] = useState(() => formatValue(safeValue));
  
  // Actualizar el input cuando cambia externamente el valor del slider
  useEffect(() => {
    setInputValue(formatValue(safeValue));
  }, [safeValue, formatValue]);
  
  // Manejar cambios en el input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Actualizar el estado local primero
    setInputValue(e.target.value);
    
    // Intentar convertir a número
    const numberValue = parseFloat(e.target.value);
    if (!isNaN(numberValue) && numberValue >= min && numberValue <= max) {
      onChange(numberValue);
    }
  }, [min, max, onChange]);
  
  // Manejar cuando el input pierde el foco
  const handleInputBlur = useCallback(() => {
    const parsedValue = parseFloat(inputValue);
    
    if (isNaN(parsedValue) || parsedValue < min || parsedValue > max) {
      // Restaurar al valor actual si no es válido
      setInputValue(formatValue(safeValue));
    } else {
      // Ajustar al step más cercano
      const steppedValue = Math.round(parsedValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));
      
      setInputValue(formatValue(clampedValue));
      onChange(clampedValue);
    }
    
    // Notificar el final de la edición
    onChangeEnd?.();
  }, [inputValue, min, max, step, formatValue, safeValue, onChange, onChangeEnd]);
  
  // Manejar cambios en el slider (memoizado)
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
    setInputValue(formatValue(newValue));
  }, [onChange, formatValue]);
  
  // Combinamos los eventos para manejar el final del arrastre
  // Nota: shadcn/ui Slider no tiene onValueChangeEnd, implementamos un enfoque alternativo
  const handleSliderChangeComplete = useCallback(() => {
    // Cuando se suelta el slider, notificamos al padre
    if (onChangeEnd) {
      setTimeout(() => {
        onChangeEnd();
      }, 0);
    }
  }, [onChangeEnd]);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`slider-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        <div className="text-xs text-muted-foreground">
          {formatValue(min)} - {formatValue(max)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Slider
            id={`slider-${label}`}
            value={[safeValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange}
            // Al soltar el ratón:
            onPointerUp={handleSliderChangeComplete}
            className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-[#4a80f5]/50 [&_[role=slider]]:shadow-md [&_[role=slider]]:transition-all [&_[role=slider]]:duration-200 [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:focus:scale-110 [&_[role=slider]]:data-[dragging=true]:scale-110 [&_.SliderTrack]:h-2 [&_.SliderRange]:h-2 [&_.SliderRange]:bg-[#4a80f5] hover:[&_.SliderRange]:bg-[#4a80f5] data-[focus]:outline-none"
          />
        </div>
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-20 h-8 text-xs text-right"
        />
      </div>
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
        <SelectTrigger id={`select-${label}`} className="w-full h-8 text-xs">
          <SelectValue placeholder={`Seleccionar ${label}`} />
        </SelectTrigger>
        <SelectContent className="text-xs">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
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
    <div className={`flex flex-col gap-2 p-3 rounded-lg border border-slate-200 hover:border-[#4a80f5]/70 transition-all ${checked ? 'bg-[#4a80f5]/10' : 'bg-slate-50'} ${className}`}>
      <div className="flex items-center justify-between w-full">
        <Label htmlFor={`switch-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        <Switch
          id={`switch-${label}`}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-[#4a80f5] h-6 w-11"
        />
      </div>
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
        <input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-0 overflow-hidden border border-input rounded-md"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
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
