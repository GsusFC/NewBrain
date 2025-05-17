'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SliderWithLabel } from '@/components/ui/slider-with-label';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';

interface DynamicSliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: () => void; 
  /** Valor mínimo del control deslizante. Por defecto: 0 */
  min?: number;
  /** Valor máximo del control deslizante. Por defecto: 100 */
  max?: number;
  /** Incremento entre valores. Por defecto: 1 */
  step?: number;
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
  
  // Actualizar el valor interno cuando cambia el valor externo
  // (solo si no estamos en medio de un arrastre)
  useEffect(() => {
    if (!isDragging && internalValue !== value) {
      setInternalValue(value);
    }
    // Eliminamos internalValue de las dependencias para evitar ejecuciones redundantes
    // La comparación con internalValue se mantiene en la lógica del efecto
  }, [value, isDragging]);
  
  // Debounced callback para notificar cambios al padre
  const debouncedOnChange = useMemo(
    () => debounce((v: number) => onChange(v), 50),
    [onChange]
  );
  
  // Cancelar el debounce al desmontar para evitar fugas de memoria
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);
  
  // Manejador para cambios en el slider
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0];
    setInternalValue(newValue);
    if (isDragging) {
      debouncedOnChange(newValue);
    } else {
      // Si no estamos arrastrando, actualizamos inmediatamente
      debouncedOnChange.cancel();
      onChange(newValue);
    }
  }, [debouncedOnChange, isDragging, onChange]);
  
  // Manejador para cuando comienza el arrastre
  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  // Manejador para cuando termina el arrastre
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      debouncedOnChange.flush();
      setIsDragging(false);
      onChangeEnd?.();
    }
  }, [debouncedOnChange, isDragging, onChangeEnd]);
  
  return (
    <SliderWithLabel
      label={label}
      min={min}
      max={max}
      step={step}
      value={[internalValue]}
      onValueChange={handleSliderChange}
      onValueCommit={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(className, 'select-none')}
      minLabel={minLabel}
      maxLabel={maxLabel}
    />
  );
}

export default DynamicSliderControl;
