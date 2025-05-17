'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs-headless';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { 
  ColorControlGradient,
  GradientStop
} from '../core/color-types';
import { VectorColorValue, GradientConfig } from '../core/types';
import { cn } from '@/lib/utils';

interface ColorControlProps {
  label?: string;
  value: VectorColorValue;
  onChange: (value: VectorColorValue) => void;
  disabled?: boolean;
  className?: string;
  /** 
   * Si es true, el ángulo se ajustará a los valores más cercanos (0, 45, 90, 135 grados).
   * Si es false, se usará el ángulo exacto. Por defecto es false.
   */
  snapAngle?: boolean;
}

/**
 * Componente avanzado para selección de colores y gradientes
 */
export function ColorControl({ 
  label,
  value, 
  onChange, 
  disabled = false,
  className,
  snapAngle = false
}: ColorControlProps) {
  // Verificar si el valor es una función (no soportada por este control)
  const isFunction = typeof value === 'function';
  const effectiveValue = isFunction ? 'var(--primary)' : value;
  
  // Determinar si el valor es un color simple o un gradiente
  const isGradient = typeof effectiveValue !== 'string';
  
  // Estado para el tipo de color (sólido o gradiente)
  const [colorType, setColorType] = useState<'solid' | 'gradient'>(
    isGradient ? 'gradient' : 'solid'
  );
  
  // Estado para el color sólido
  const [solidColor, setSolidColor] = useState(
    typeof effectiveValue === 'string' ? effectiveValue : 'var(--primary)'
  );
  
  // Estado para el gradiente
  const [angle, setAngle] = useState(0);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: 'var(--primary)', position: 0 },
    { color: '#f54a80', position: 100 }
  ]);
  
  // Función para convertir GradientConfig del sistema a formato UI
  const convertFromSystemGradient = useCallback((sysGradient: GradientConfig): ColorControlGradient => {
    // Convertir stops de formato sistema (offset: 0-1) a formato UI (position: 0-100)
    const uiStops = sysGradient.stops.map(stop => ({
      color: stop.color,
      position: Math.round(stop.offset * 100),
      id: Math.random().toString(36).substr(2, 9)
    }));

    // Calcular ángulo basado en coordenadas
    let angle = 0;
    
    if (sysGradient.coords) {
      const x1 = Number(sysGradient.coords.x1) || 0;
      const y1 = Number(sysGradient.coords.y1) || 0;
      const x2 = Number(sysGradient.coords.x2) || 1;
      const y2 = Number(sysGradient.coords.y2) || 0;
      
      const angleRad = Math.atan2(y2 - y1, x2 - x1);
      angle = Math.round(((angleRad * 180) / Math.PI + 360) % 360);
    }

    // Aplicar snapping de ángulo si está habilitado
    const snapToNearestAngle = (angle: number): number => {
      if (!snapAngle) return angle;
      
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      return angles.reduce((prev, curr) => 
        (Math.abs(curr - angle) < Math.abs(prev - angle) ? curr : prev)
      );
    };
    
    const finalAngle = snapToNearestAngle(angle);

    return {
      type: 'linear',
      angle: finalAngle,
      stops: uiStops
    };
  }, [snapAngle]);
  
  // Función para convertir formato UI a GradientConfig para el sistema
  const convertToSystemGradient = useCallback((uiGradient: ColorControlGradient): GradientConfig => {
    // IMPORTANTE: Asegurarnos de que los stops estén ordenados por posición
    const sortedStops = [...uiGradient.stops].sort((a, b) => a.position - b.position);
    
    // Convertir stops de formato UI (position: 0-100) a formato sistema (offset: 0-1)
    const systemStops = sortedStops.map(stop => ({
      offset: stop.position / 100,
      color: stop.color,
      opacity: 1
    }));

    // Calcular coordenadas basadas en el ángulo para el degradado lineal
    const angle = uiGradient.angle % 360;
    const radians = (angle * Math.PI) / 180;
    
    // Calcular coordenadas X e Y basadas en el ángulo
    const x1 = 0.5 - 0.5 * Math.cos(radians);
    const y1 = 0.5 - 0.5 * Math.sin(radians);
    const x2 = 0.5 + 0.5 * Math.cos(radians);
    const y2 = 0.5 + 0.5 * Math.sin(radians);
    
    // Devolver la configuración del sistema
    return {
      type: 'linear',
      stops: systemStops,
      coords: {
        x1: x1.toString(),
        y1: y1.toString(), 
        x2: x2.toString(), 
        y2: y2.toString()
      },
      units: 'objectBoundingBox'
    };
  }, []);
  
  // Inicializar estados cuando cambia el valor
  useEffect(() => {
    if (isFunction) return;
    
    if (typeof effectiveValue === 'string') {
      setColorType('solid');
      setSolidColor(effectiveValue);
    } else {
      setColorType('gradient');
      const uiGradient = convertFromSystemGradient(effectiveValue as GradientConfig);
      setAngle(uiGradient.angle);
      setStops(prev => (
        // Solo actualizar si los stops realmente cambiaron
        JSON.stringify(prev) !== JSON.stringify(uiGradient.stops) 
          ? uiGradient.stops 
          : prev
      ));
    }
    // convertFromSystemGradient es estable mientras snapAngle no cambie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveValue, isFunction, snapAngle]);
  
  // Manejar cambio de tipo y color
  const handleColorTypeChange = useCallback((type: 'solid' | 'gradient') => {
    setColorType(type);
    
    if (type === 'solid') {
      onChange(solidColor);
    } else {
      onChange(convertToSystemGradient({
        type: 'linear',
        angle,
        stops
      }));
    }
  }, [solidColor, angle, stops, onChange, convertToSystemGradient]);
  
  // Manejar cambio de color sólido
  const handleSolidColorChange = useCallback((color: string) => {
    setSolidColor(color);
    
    // Solo aplicar si el tipo de color es 'solid'
    if (colorType === 'solid') {
      onChange(color);
    }
  }, [colorType, onChange]);
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <Tabs value={colorType} onValueChange={handleColorTypeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solid">Color Sólido</TabsTrigger>
            <TabsTrigger value="gradient">Degradado</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {colorType === 'solid' ? (
              <ColorPicker
                label={label}
                color={solidColor}
                onChange={handleSolidColorChange}
                disabled={disabled}
              />
            ) : (
              <GradientPicker
                label={label}
                angle={angle}
                stops={stops}
                onAngleChange={(newAngle) => {
                  setAngle(newAngle);
                  onChange(convertToSystemGradient({
                    type: 'linear',
                    angle: newAngle,
                    stops
                  }));
                }}
                onStopsChange={(newStops) => {
                  setStops(newStops);
                  onChange(convertToSystemGradient({
                    type: 'linear',
                    angle,
                    stops: newStops
                  }));
                }}
                disabled={disabled}
              />
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
