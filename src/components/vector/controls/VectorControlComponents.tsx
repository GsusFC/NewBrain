'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { Slider } from '@/components/ui/slider-headless';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-headless';
import { Switch } from '@/components/ui/switch-headless';
import { Button } from '@/components/ui/button';
import { Label as UILabel } from '@/components/ui/label-headless';

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
  onChangeEnd?: () => void; // Prop para capturar el final del arrastre
  min: number;
  max: number;
  step: number;
  className?: string;
  minLabel?: string; // Etiqueta opcional para el valor mínimo
  maxLabel?: string; // Etiqueta opcional para el valor máximo
}

export function SliderControl({
  label,
  value,
  onChange,
  onChangeEnd,
  min,
  max,
  step,
  className = "",
  minLabel,
  maxLabel,
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
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs text-gray-500">{formatValue(safeValue)}</span>
      </div>
      
      <div className="flex items-center gap-2 pt-1">
        {minLabel && <span className="text-xs">{minLabel}</span>}
        <Slider
          value={[safeValue]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderChangeComplete}
          className="flex-1"
        />
        {maxLabel && <span className="text-xs">{maxLabel}</span>}
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
      <Label className="text-xs font-medium">{label}</Label>
      <Select
        value={value}
        onChange={onChange}
      >
        <SelectTrigger>
          <SelectValue>{options.find(opt => opt.value === value)?.label || 'Selecciona opción'}</SelectValue>
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
  onChange?: (checked: boolean) => void;
  /** @deprecated Use onChange instead */
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

type SwitchProps = React.ComponentProps<typeof Switch>;

export function SwitchControl({
  label,
  checked,
  onChange,
  onCheckedChange,
  className = "",
  ...props
}: SwitchControlProps & Omit<SwitchProps, 'checked' | 'onChange'>) {
  // Manejar el cambio de estado
  const handleChange = React.useCallback((newChecked: boolean) => {
    // Primero intentamos con onChange (nuevo estándar)
    if (typeof onChange === 'function') {
      onChange(newChecked);
    } 
    // Luego con onCheckedChange (mantenemos por compatibilidad)
    else if (typeof onCheckedChange === 'function') {
      onCheckedChange(newChecked);
    }
  }, [onChange, onCheckedChange]);

  // Filtramos las props para eliminar onCheckedChange y otras no deseadas
  const filteredProps = React.useMemo(() => {
    const { onCheckedChange: _, ...rest } = props as Record<string, unknown>;
    return rest as Omit<SwitchProps, 'checked' | 'onChange'>;
  }, [props]);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Label className="text-xs font-medium">{label}</Label>
      <Switch
        checked={checked}
        onChange={handleChange}
        className="data-[state=checked]:bg-primary"
        {...filteredProps}
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

// Componente para control deslizante con entrada de texto (slider con input)
interface SliderWithInputProps {
  id?: string;
  label?: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

export function SliderWithInput({
  id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  label, // Marcado con comentario para indicar que no se usa
  value: externalValue,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  precision = 0,
  onValueChange,
  className,
}: SliderWithInputProps) {
  // Estado local para actualizaciones inmediatas durante el arrastre
  const [localValue, setLocalValue] = useState<number[]>(externalValue || defaultValue);
  const [inputValue, setInputValue] = useState<string>(
    (externalValue?.[0] ?? defaultValue[0]).toFixed(precision)
  );
  
  // Actualizar estado local cuando cambien las props externas
  useEffect(() => {
    if (externalValue && externalValue[0] !== localValue[0]) {
      setLocalValue(externalValue);
      setInputValue(externalValue[0].toFixed(precision));
    }
  }, [externalValue, precision, localValue]);
  
  // Aplicar debounce al callback de cambio para evitar actualizaciones excesivas
  // Utilizando una función inline para evitar la advertencia sobre dependencies desconocidas
  const debouncedOnValueChange = useCallback((value: number[]) => {
    const debouncedFn = debounce((val: number[]) => {
      onValueChange(val);
    }, 50);
    debouncedFn(value);
    // Asegurarse de que el debounce se limpie cuando el componente se desmonte
    return () => debouncedFn.cancel();
  }, [onValueChange]);
  
  // Manejar cambio en el slider
  const handleSliderChange = (value: number[]) => {
    setLocalValue(value);
    setInputValue(value[0].toFixed(precision));
    debouncedOnValueChange(value);
  };
  
  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const numValue = parseFloat(e.target.value);
    
    if (!isNaN(numValue)) {
      // Limitar al rango min-max
      const boundedValue = Math.min(Math.max(numValue, min), max);
      setLocalValue([boundedValue]);
      debouncedOnValueChange([boundedValue]);
    }
  };
  
  // Commit el valor al perder el foco
  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      // Si no es un número válido, revertir al último valor válido
      setInputValue(localValue[0].toFixed(precision));
    } else {
      // Limitar al rango y actualizar
      const boundedValue = Math.min(Math.max(numValue, min), max);
      setLocalValue([boundedValue]);
      setInputValue(boundedValue.toFixed(precision));
      onValueChange([boundedValue]); // Llamada directa sin debounce al perder el foco
    }
  };
  
  return (
    <div className={`grid grid-cols-[1fr,80px] gap-2 items-center ${className}`}>
      <Slider
        value={localValue}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        className="col-span-1"
      />
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="col-span-1 h-8 text-center"
      />
    </div>
  );
}
