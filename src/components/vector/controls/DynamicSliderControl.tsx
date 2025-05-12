'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SliderControl } from './VectorControlComponents';
import { debounce } from 'lodash';

// Extraer las props de SliderControl para reutilizarlas
interface SliderControlProps {
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
export function DynamicSliderControl(props: SliderControlProps) {
  // Estado interno para actualizar fluidamente durante el arrastre
  const [internalValue, setInternalValue] = useState(props.value);
  const [isDragging, setIsDragging] = useState(false);
  const resetKeyRef = useRef(0);
  
  // Valores previos para comparación (solo para min/max/step)
  const [rangeProps, setRangeProps] = useState({
    min: props.min,
    max: props.max,
    step: props.step
  });
  
  // Reset key solo cuando cambian los límites, no el valor
  useEffect(() => {
    const hasRangeChanged = 
      props.min !== rangeProps.min || 
      props.max !== rangeProps.max || 
      props.step !== rangeProps.step;
    
    if (hasRangeChanged) {
      resetKeyRef.current += 1;
      setRangeProps({
        min: props.min,
        max: props.max,
        step: props.step
      });
    }
  }, [props.min, props.max, props.step, rangeProps]);
  
  // Actualizar el valor interno cuando cambia props.value externamente
  // (solo si no estamos en medio de un arrastre)
  useEffect(() => {
    if (!isDragging && internalValue !== props.value) {
      setInternalValue(props.value);
    }
  }, [props.value, isDragging, internalValue]);
  
  // Extraemos onChange del props para evitar dependencia del objeto completo
  const { onChange } = props;
  
  // Debounced callback para notificar cambios al padre
  // Esto permite que la UI se actualice fluidamente mientras el arrastre está en progreso
  const debouncedOnChange = useCallback(() => {
    // Creamos una nueva función debounce cada vez que cambia onChange
    // Esto evita el warning de dependencias desconocidas
    const debouncedFn = debounce((newValue: number) => {
      onChange(newValue);
    }, 50); // 50ms debounce
    
    return (newValue: number) => debouncedFn(newValue);
  }, [onChange])();
  
  // Manejador mejorado para cambios en el slider
  const handleSliderChange = useCallback((value: number) => {
    setInternalValue(value);
    setIsDragging(true);
    debouncedOnChange(value);
  }, [debouncedOnChange]);
  
  // Cuando termina el arrastre, aseguramos actualización final
  const handleSliderChangeEnd = useCallback(() => {
    setIsDragging(false);
    onChange(internalValue); // Notificación final no debounced
  }, [internalValue, onChange]);
  
  // Separamos props para no pasar properties que no necesitamos y evitar errores de tipo
  const { label, min, max, step, className } = props;
  
  return (
    <SliderControl
      key={resetKeyRef.current}
      label={label}
      min={min}
      max={max}
      step={step}
      className={className}
      value={internalValue} // Usar el valor interno para una actualización fluida
      onChange={handleSliderChange} // Usamos nuestro manejador optimizado
      onChangeEnd={handleSliderChangeEnd} // Nuevo prop para el final del arrastre
    />
  );
}

export default DynamicSliderControl;
