'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  ColorControlGradient, 
  GradientType, 
  GradientStop, 
  // PREDEFINED_PALETTES, // No utilizado actualmente
  ColorPalette,
} from '../core/color-types';
import { VectorColorValue, GradientConfig } from '../core/types';

interface ColorControlProps {
  label?: string;
  value: VectorColorValue;
  onChange: (value: VectorColorValue) => void;
  disabled?: boolean;
}

/**
 * Componente avanzado para selección de colores y gradientes
 */
export function ColorControl({ 
  value, 
  onChange, 
  disabled = false 
}: ColorControlProps) {
  // Verificar si el valor es una función (no soportada por este control)
  const isFunction = typeof value === 'function';
  const effectiveValue = isFunction ? '#4a80f5' : value;
  
  // Determinar si el valor es un color simple o un gradiente
  const isGradient = typeof effectiveValue !== 'string';
  
  // Estado para el tipo de color (sólido o gradiente)
  const [colorType, setColorType] = useState<'solid' | 'gradient'>(
    isGradient ? 'gradient' : 'solid'
  );
  
  // Estado para el color sólido
  const [solidColor, setSolidColor] = useState(
    typeof effectiveValue === 'string' ? effectiveValue : '#4a80f5'
  );
  
  // Estado para el gradiente
  const [angle, setAngle] = useState(0);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#4a80f5', position: 0 },
    { color: '#f54a80', position: 100 }
  ]);
  
  // Colores predefinidos para facilitar la selección
  const presetColors = [
    '#4a80f5', // Azul (color por defecto)
    '#f54a80', // Rosa
    '#4af580', // Verde menta
    '#f5804a', // Naranja
    '#804af5', // Púrpura
    '#f5f54a', // Amarillo
    '#4af5f5', // Cian
    '#ffffff', // Blanco
    '#000000', // Negro
  ];
  
  // Función para convertir GradientConfig del sistema a formato UI
  const convertFromSystemGradient = useCallback((sysGradient: GradientConfig): ColorControlGradient => {
    // Convertir stops de formato sistema (offset: 0-1) a formato UI (position: 0-100)
    const uiStops = sysGradient.stops.map(stop => ({
      color: stop.color,
      position: Math.round(stop.offset * 100)
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

    // Normalizar ángulo a los valores preestablecidos más cercanos (0, 45, 90, 135)
    const angles = [0, 45, 90, 135];
    const closestAngle = angles.reduce((prev, curr) => 
      (Math.abs(curr - angle) < Math.abs(prev - angle) ? curr : prev)
    );

    return {
      type: 'linear',
      angle: closestAngle,
      stops: uiStops
    };
  }, []);
  
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
  
  // Obtener un degradado inicial para la UI
  const getInitialGradient = useCallback((): ColorControlGradient => {
    if (isGradient) {
      // Si ya es un gradiente, convertirlo al formato UI
      const sysGradient = effectiveValue as GradientConfig;
      return convertFromSystemGradient(sysGradient);
    }
    
    // Si no es un gradiente, crear uno predeterminado
    return {
      type: 'linear',
      angle: 0,
      stops: [
        { color: '#4a80f5', position: 0 }, // Azul
        { color: '#f54a80', position: 100 } // Rosa
      ]
    };
  }, [isGradient, effectiveValue, convertFromSystemGradient]);
  
  // Inicializar gradiente al cargar el componente
  useEffect(() => {
    if (isGradient) {
      const uiGradient = convertFromSystemGradient(effectiveValue as GradientConfig);
      setStops(uiGradient.stops);
      setAngle(uiGradient.angle);
    }
  }, [effectiveValue, isGradient, convertFromSystemGradient]);
  
  // Aplicar un gradiente con los stops actuales
  const applyGradientWithStops = useCallback((gradientStops: GradientStop[]) => {
    if (isFunction) return;
    
    // Convertir al formato del sistema
    const systemGradient = convertToSystemGradient({
      type: 'linear',
      angle: angle,
      stops: gradientStops
    });
    
    // Aplicar el cambio
    onChange(systemGradient);
  }, [isFunction, angle, convertToSystemGradient, onChange]);
  
  // Aplicar un cambio de dirección del degradado
  const applyGradientDirection = useCallback((newAngle: number) => {
    // Actualizar el estado visual
    setAngle(newAngle);
    
    // Solo aplicar si el tipo de color es 'gradient'
    if (colorType === 'gradient') {
      // Convertir al formato del sistema con el nuevo ángulo
      const systemGradient = convertToSystemGradient({
        type: 'linear',
        angle: newAngle,
        stops: stops
      });
      
      // Aplicar el cambio
      onChange(systemGradient);
    }
  }, [colorType, stops, convertToSystemGradient, onChange]);
  
  // Cambiar el tipo de color
  const handleColorTypeChange = useCallback((type: 'solid' | 'gradient') => {
    setColorType(type);
    
    if (type === 'solid') {
      onChange(solidColor);
    } else {
      // Inicializar el gradiente si se cambia a este modo
      if (!isGradient) {
        // Crear un gradiente predeterminado usando el color sólido actual como inicio
        const initialGradient = {
          type: 'linear' as const,
          angle: 0,
          stops: [
            { color: solidColor, position: 0 },
            { color: '#f54a80', position: 100 } // Segundo color contrastante
          ]
        };
        
        // Aplicar este gradiente
        const systemGradient = convertToSystemGradient(initialGradient);
        onChange(systemGradient);
        
        // Actualizar la UI
        setStops(initialGradient.stops);
        setAngle(initialGradient.angle);
      } else {
        // Si ya es un gradiente, obtener su configuración UI
        const uiGradient = convertFromSystemGradient(effectiveValue as GradientConfig);
        setStops(uiGradient.stops);
        setAngle(uiGradient.angle);
      }
    }
  }, [effectiveValue, isGradient, solidColor, onChange, convertToSystemGradient, convertFromSystemGradient]);
  
  // Maneja cambios en el gradiente
  const updateGradient = useCallback(() => {
    // Solo aplicar si el tipo de color es 'gradient'
    if (colorType === 'gradient') {
      applyGradientWithStops(stops);
    }
  }, [colorType, stops, applyGradientWithStops]);
  
  // Manejar cambio de color sólido
  const handleSolidColorChange = useCallback((color: string) => {
    setSolidColor(color);
    
    // Solo aplicar si el tipo de color es 'solid'
    if (colorType === 'solid') {
      onChange(color);
    }
  }, [colorType, onChange]);
  
  // Manejar cambio de tipo y color
  const handleColorChange = useCallback((type: 'solid' | 'gradient', value: string | GradientStop[]) => {
    setColorType(type);
    
    if (type === 'solid') {
      setSolidColor(value as string);
      onChange(value as string);
    } else {
      // Actualizar el gradiente
      applyGradientWithStops(value as GradientStop[]);
    }
  }, [onChange, applyGradientWithStops]);
  
  // Añadir un nuevo stop al gradiente
  const addStop = useCallback(() => {
    // No permitir más de 5 stops para evitar complejidad excesiva
    if (stops.length >= 5) return;
    
    // Encontrar una posición intermedia para el nuevo stop
    const sortedPositions = stops.map(s => s.position).sort((a, b) => a - b);
    let newPos = 50; // Posición predeterminada
    
    // Buscar el hueco más grande entre stops existentes
    let maxGap = 0;
    for (let i = 0; i < sortedPositions.length - 1; i++) {
      const gap = sortedPositions[i+1] - sortedPositions[i];
      if (gap > maxGap) {
        maxGap = gap;
        newPos = sortedPositions[i] + gap / 2;
      }
    }
    
    // Añadir el nuevo stop
    const newStops = [...stops, { 
      color: '#8a8a8a', 
      position: newPos 
    }];
    
    setStops(newStops);
    applyGradientWithStops(newStops);
  }, [stops, applyGradientWithStops]);
  
  // Eliminar un stop del gradiente
  const removeStop = useCallback((index: number) => {
    // No permitir menos de 2 stops
    if (stops.length <= 2) return;
    
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
    applyGradientWithStops(newStops);
  }, [stops, applyGradientWithStops]);
  
  // Actualizar un stop existente
  const updateStop = useCallback((index: number, property: 'color' | 'position', value: string | number) => {
    const newStops = [...stops];
    
    if (property === 'color') {
      newStops[index] = { ...newStops[index], color: value as string };
    } else {
      let position = value as number;
      // Asegurarse de que está en el rango 0-100
      position = Math.max(0, Math.min(100, position));
      newStops[index] = { ...newStops[index], position };
    }
    
    setStops(newStops);
    applyGradientWithStops(newStops);
  }, [stops, applyGradientWithStops]);
  
  // Función para manejar el arrastre de marcadores de color
  const handleMarkerDragStart = useCallback((index: number, startEvent: React.MouseEvent) => {
    // Importante: Buscamos el contenedor correcto (el div que contiene la previsualización del degradado)
    // y no el botón del marcador
    const gradientContainer = startEvent.currentTarget.closest('.gradient-preview-container') as HTMLElement;
    if (!gradientContainer) return;
    
    const containerRect = gradientContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const startX = startEvent.clientX;
    const startPos = stops[index].position;
    
    // Prevenir el comportamiento predeterminado para evitar problemas con el drag
    startEvent.preventDefault();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      // Calcular la nueva posición basándonos en el movimiento del mouse relativo al contenedor
      const currentX = moveEvent.clientX;
      const deltaPx = currentX - startX;
      const deltaPct = (deltaPx / containerWidth) * 100;
      let newPos = startPos + deltaPct;
      
      // Asegurarse de que está en el rango 0-100
      newPos = Math.max(0, Math.min(100, newPos));
      
      // Crear una copia nueva de los stops y actualizar la posición
      const newStops = [...stops];
      newStops[index] = { ...newStops[index], position: newPos };
      setStops(newStops);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Aplicar el cambio al finalizar el arrastre con la última versión de los stops
      // Es importante usar newStops para asegurar que los cambios se apliquen correctamente
      applyGradientWithStops([...stops]);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [stops, applyGradientWithStops]);
  
  // Generar la vista previa del color o gradiente
  const colorPreviewStyle = useMemo(() => {
    if (colorType === 'solid') {
      return { backgroundColor: solidColor };
    } else {
      // Ordenar los stops para el linear-gradient
      const sortedStops = [...stops].sort((a, b) => a.position - b.position);
      const stopsString = sortedStops.map(stop => 
        `${stop.color} ${stop.position}%`
      ).join(', ');
      
      return {
        background: `linear-gradient(${angle}deg, ${stopsString})`
      };
    }
  }, [colorType, solidColor, stops, angle]);
  
  // Ordenar los stops por posición para una mejor visualización
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.position - b.position);
  }, [stops]);
  
  // Manejar clic en presets
  const handlePresetClick = useCallback((palette: ColorPalette) => {
    // Convertir la paleta a stops de gradiente
    const gradientStops = palette.colors.map((color, index, array) => ({
      color,
      position: Math.round((index / (array.length - 1)) * 100)
    }));
    
    setStops(gradientStops);
    applyGradientWithStops(gradientStops);
  }, [applyGradientWithStops]);
  
  // Manejar selección de ángulo
  const handleAngleSelect = useCallback((newAngle: number) => {
    applyGradientDirection(newAngle);
  }, [applyGradientDirection]);
  
  return (
    <div className="space-y-2">
      {/* Color preview */}
      <div className="flex justify-between items-center">
        <div className="w-7 h-7 rounded-md border border-input" style={colorPreviewStyle} />
      </div>
      
      {/* Selector de tipo de color (sólido o degradado) */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        <Button
          variant={colorType === 'solid' ? "secondary" : "outline"}
          size="sm"
          onClick={() => handleColorTypeChange('solid')}
          disabled={disabled}
          className="text-xs"
        >
          Color sólido
        </Button>
        <Button
          variant={colorType === 'gradient' ? "secondary" : "outline"}
          size="sm"
          onClick={() => handleColorTypeChange('gradient')}
          disabled={disabled}
          className="text-xs"
        >
          Degradado
        </Button>
      </div>
      
      {/* Contenido para color sólido */}
      {colorType === 'solid' && (
        <div className="space-y-3">
          {/* Selector de color nativo y paleta de colores rápidos */}
          <div className="flex flex-wrap gap-1.5">
            {/* Selector de color nativo */}
            <div className="w-7 h-7 overflow-hidden rounded-md border-2 border-primary">
              <input 
                type="color"
                value={solidColor}
                onChange={(e) => handleSolidColorChange(e.target.value)}
                className="w-10 h-10 cursor-pointer"
                style={{ margin: '-1.5px 0 0 -1.5px' }}
                disabled={disabled}
                aria-label="Selector de color personalizado"
              />
            </div>
            
            {/* Colores predefinidos */}
            {presetColors.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setColorType('solid');
                  setSolidColor(color);
                  onChange(color);
                }}
                className="w-7 h-7 rounded-md border border-input hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                aria-label={`Seleccionar ${color}`}
                disabled={disabled}
              />
            ))}
          </div>
          
          {/* Entrada de color */}
          <div className="flex items-center">
            <Input
              type="text"
              value={solidColor}
              onChange={(e) => handleSolidColorChange(e.target.value)}
              className="w-full font-mono text-xs"
              disabled={disabled}
              placeholder="Ingresa un color (ej. #4a80f5)"
            />
          </div>
        </div>
      )}
      
      {/* Controles de gradiente */}
      {colorType === 'gradient' && (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Dirección</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant={angle === 0 ? "secondary" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleAngleSelect(0)}
                  aria-label="Gradiente horizontal (0°)"
                >
                  →
                </Button>
                <Button
                  variant={angle === 45 ? "secondary" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleAngleSelect(45)}
                  aria-label="Gradiente diagonal descendente (45°)"
                >
                  ↘
                </Button>
                <Button
                  variant={angle === 90 ? "secondary" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleAngleSelect(90)}
                  aria-label="Gradiente vertical (90°)"
                >
                  ↓
                </Button>
                <Button
                  variant={angle === 135 ? "secondary" : "outline"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleAngleSelect(135)}
                  aria-label="Gradiente diagonal ascendente (135°)"
                >
                  ↙
                </Button>
              </div>
            </div>
            
            <div className="relative h-8 mt-4 gradient-preview-container">
              <div 
                className="absolute inset-0 rounded"
                style={colorPreviewStyle}
              />
              <div className="absolute inset-0">
                <div className="relative h-full">
                  {sortedStops.map((stop, index) => (
                    <button
                      key={index}
                      type="button"
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing hover:z-10"
                      style={{
                        left: `${stop.position}%`
                      }}
                      onMouseDown={(e) => handleMarkerDragStart(index, e)}
                      tabIndex={0}
                      title={`${stop.color} en ${stop.position}%`}
                      aria-label={`Parada de color ${index + 1}: ${stop.color} en posición ${stop.position}%`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: stop.color }}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Arrastra los puntos de color para ajustar su posición
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Paradas de color</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addStop}
                disabled={stops.length >= 5}
                aria-label="Añadir parada de color"
              >
                Añadir
              </Button>
            </div>
            
            {sortedStops.map((stop, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="w-6 h-6 overflow-hidden rounded-full border">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(index, 'color', e.target.value)}
                    className="w-10 h-10 cursor-pointer"
                    style={{ margin: '-2px 0 0 -2px' }}
                    aria-label={`Color para parada ${index + 1}`}
                  />
                </div>
                
                <Input
                  value={stop.color}
                  onChange={(e) => updateStop(index, 'color', e.target.value)}
                  className="flex-1"
                  aria-label={`Valor hexadecimal para parada ${index + 1}`}
                />
                
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(index, 'position', parseInt(e.target.value, 10))}
                  className="w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={`Posición para parada ${index + 1} (0-100)`}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(index)}
                  disabled={stops.length <= 2}
                  className="px-2"
                  aria-label={`Eliminar parada ${index + 1}`}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          {/* Sección de CSS eliminada */}
        </div>
      )}
    </div>
  );
}
