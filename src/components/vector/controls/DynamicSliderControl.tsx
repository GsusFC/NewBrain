'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { debounce } from 'lodash';

interface DynamicSliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: () => void; 
  min: number;
  max: number;
  step: number;
  className?: string;
  minLabel?: string; 
  maxLabel?: string; 
}

/**
 * Componente envoltorio para SliderControl que maneja correctamente propiedades dinámicas
 * con optimizaciones para una experiencia de usuario más fluida.
 */
export function DynamicSliderControl({
  label,
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  className,
  minLabel,
  maxLabel
}: DynamicSliderControlProps) {
  // Estado interno para actualizar fluidamente durante el arrastre
  const [internalValue, setInternalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  
  // Actualizar el valor interno cuando cambia el valor externamente
  // (solo si no estamos en medio de un arrastre)
  useEffect(() => {
    if (!isDragging && internalValue !== value) {
      setInternalValue(value);
    }
  }, [value, isDragging, internalValue]);
  
  // Debounced callback para notificar cambios al padre
  const debouncedOnChange = useCallback((newValue: number) => {
    const debouncedFn = debounce((value: number) => {
      onChange(value);
    }, 50);
    debouncedFn(newValue);
  }, [onChange]);
  
  // Manejador para cambios en el slider
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0];
    setInternalValue(newValue);
    setIsDragging(true);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);
  
  // Cuando termina el arrastre, aseguramos actualización final
  const handleSliderChangeEnd = useCallback(() => {
    setIsDragging(false);
    onChange(internalValue);
    onChangeEnd?.();
  }, [internalValue, onChange, onChangeEnd]);
  
  return (
    <SliderWithLabel
      label={label}
      min={min}
      max={max}
      step={step}
      value={[internalValue]}
      onValueChange={handleSliderChange}
      onValueCommit={handleSliderChangeEnd}
      className={className}
      minLabel={minLabel}
      maxLabel={maxLabel}
    />
  );
}

export default DynamicSliderControl;
