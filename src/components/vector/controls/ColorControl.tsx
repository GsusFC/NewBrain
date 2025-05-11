'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  ColorControlGradient, 
  GradientType, 
  GradientStop, 
  PREDEFINED_PALETTES,
} from '../core/color-types';
import { VectorColorValue, GradientConfig } from '../core/types';

interface ColorControlProps {
  label: string;
  value: VectorColorValue;
  onChange: (value: VectorColorValue) => void;
  disabled?: boolean;
}

/**
 * Componente avanzado para selección de colores y gradientes
 */
export function ColorControl({ 
  label, 
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
    } else {
      // Crear un gradiente nuevo por defecto
      return { 
        type: 'linear', 
        angle: 0, 
        stops: [
          { color: '#4a80f5', position: 0 }, 
          { color: '#ffffff', position: 100 }
        ] 
      };
    }
  }, [isGradient, effectiveValue, convertFromSystemGradient]);
  
  // Inicializar estados para el gradiente
  const initialGradient = useMemo(() => getInitialGradient(), [getInitialGradient]);
  const [stops, setStops] = useState<GradientStop[]>(initialGradient.stops);
  const [angle, setAngle] = useState<number>(initialGradient.angle);
  
  // Función para aplicar gradiente con stops específicos
  const applyGradientWithStops = useCallback((gradientStops: GradientStop[]) => {
    if (isFunction) return; // No aplicar si es una función
    
    // Crear un objeto GradientConfig compatible con el sistema
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
      // Crear un objeto GradientConfig compatible con el sistema
      const systemGradient = convertToSystemGradient({
        type: 'linear',
        angle: newAngle,
        stops: stops
      });
      
      // Aplicar el cambio directamente con el nuevo ángulo
      onChange(systemGradient);
    }
  }, [colorType, stops, convertToSystemGradient, onChange]);
  
  // Actualizar el componente cuando cambia el valor externo
  useEffect(() => {
    // No procesar cuando el valor es una función
    if (isFunction) return;
    
    if (typeof effectiveValue === 'string') {
      // Es un color sólido
      setColorType('solid');
      setSolidColor(effectiveValue);
    } else {
      // Es un gradiente
      const uiGradient = convertFromSystemGradient(effectiveValue as GradientConfig);
      setColorType('gradient');
      setStops(uiGradient.stops);
      setAngle(uiGradient.angle);
    }
  }, [effectiveValue, isFunction, convertFromSystemGradient]);
  
  // Maneja cambios en el gradiente
  const updateGradient = useCallback(() => {
    // Solo aplicar si el tipo de color es 'gradient'
    if (colorType === 'gradient') {
      applyGradientWithStops(stops);
    }
  }, [colorType, stops, applyGradientWithStops]);
  
  // Maneja cambios en el color sólido
  const handleSolidColorChange = useCallback((newColor: string) => {
    setSolidColor(newColor);
    if (!isFunction) onChange(newColor);
  }, [isFunction, onChange]);
  
  // Maneja cambios en el tipo de color (sólido/gradiente)
  const handleColorTypeChange = useCallback((type: 'solid' | 'gradient') => {
    setColorType(type);
    
    if (type === 'solid') {
      onChange(solidColor);
    } else {
      // Actualizar el gradiente
      applyGradientWithStops(stops);
    }
  }, [solidColor, stops, onChange, applyGradientWithStops]);
  
  // Añadir un nuevo stop al gradiente
  const addStop = useCallback(() => {
    // No permitir más de 5 stops para evitar complejidad excesiva
    if (stops.length >= 5) return;
    
    // Encontrar una posición intermedia para el nuevo stop
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const lastPos = sortedStops[sortedStops.length - 1].position;
    const firstPos = sortedStops[0].position;
    let newPos: number;
    
    if (sortedStops.length === 2) {
      // Si solo hay 2 stops, añadir uno en el medio
      newPos = Math.round((firstPos + lastPos) / 2);
    } else {
      // Buscar el hueco más grande entre stops
      let maxGap = 0;
      let gapPos = 50;
      
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          gapPos = Math.round(sortedStops[i].position + gap / 2);
        }
      }
      
      newPos = gapPos;
    }
    
    // Mezclar colores de los stops adyacentes para el nuevo stop
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
  
  // Actualizar un stop específico y aplicar cambios inmediatamente
  const updateStop = useCallback((index: number, field: 'color' | 'position', newValue: string | number) => {
    const newStops = [...stops];
    
    if (field === 'color') {
      newStops[index] = { ...newStops[index], color: newValue as string };
    } else {
      // Asegurar que la posición sea un número entre 0 y 100
      let position = typeof newValue === 'string' ? parseInt(newValue, 10) : newValue;
      position = Math.max(0, Math.min(100, position));
      newStops[index] = { ...newStops[index], position };
    }
    
    setStops(newStops);
    applyGradientWithStops(newStops);
  }, [stops, applyGradientWithStops]);
  
  // Función para manejar el arrastre de marcadores de color
  const handleMarkerDragStart = useCallback((index: number, startEvent: React.MouseEvent) => {
    const containerElement = startEvent.currentTarget.parentElement as HTMLElement;
    const containerRect = containerElement.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const startX = startEvent.clientX;
    const startPos = stops[index].position;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newPosition = Math.max(0, Math.min(100, startPos + (deltaX / containerWidth) * 100));
      const newStops = [...stops];
      newStops[index] = { ...newStops[index], position: Math.round(newPosition) };
      setStops(newStops);
      applyGradientWithStops(newStops);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [stops, applyGradientWithStops]);
  
  // Generar la vista previa del color o gradiente
  const colorPreviewStyle = useMemo(() => {
    if (colorType === 'solid') {
      return { backgroundColor: solidColor };
    } else {
      const gradientStops = stops
        .sort((a, b) => a.position - b.position)
        .map(stop => `${stop.color} ${stop.position}%`)
        .join(', ');
        
      return { background: `linear-gradient(${angle}deg, ${gradientStops})` };
    }
  }, [colorType, solidColor, stops, angle]);
  
  // Convertir a CSS para mostrar en la UI
  const colorCSSString = useMemo(() => {
    if (colorType === 'solid') {
      return solidColor;
    } else {
      const gradientStops = stops
        .sort((a, b) => a.position - b.position)
        .map(stop => `${stop.color} ${stop.position}%`)
        .join(', ');
        
      return `linear-gradient(${angle}deg, ${gradientStops})`;
    }
  }, [colorType, solidColor, stops, angle]);
  
  // Ordenar los stops por posición para una mejor visualización
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.position - b.position);
  }, [stops]);
  
  // Manejar clic en presets
  const handlePresetClick = useCallback((preset: GradientStop[]) => {
    setStops(preset);
    applyGradientWithStops(preset);
  }, [applyGradientWithStops]);
  
  // Manejar selección de ángulo
  const handleAngleSelect = useCallback((newAngle: number) => {
    applyGradientDirection(newAngle);
  }, [applyGradientDirection]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          {colorType === 'gradient' && (
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
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="h-8 w-10 p-0"
                disabled={disabled}
                aria-label="Abrir selector de color"
              >
                <div 
                  className="w-full h-full rounded-sm" 
                  style={colorPreviewStyle}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="end">
              <Tabs defaultValue={colorType} onValueChange={(v) => handleColorTypeChange(v as 'solid' | 'gradient')}>
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="solid">Sólido</TabsTrigger>
                  <TabsTrigger value="gradient">Degradado</TabsTrigger>
                </TabsList>
                
                <TabsContent value="solid" className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="w-full h-8 rounded overflow-hidden">
                      <input 
                        type="color"
                        value={solidColor}
                        onChange={(e) => handleSolidColorChange(e.target.value)}
                        className="w-full h-12 cursor-pointer"
                        style={{ margin: '-4px 0 0 0' }}
                        aria-label="Seleccionar color sólido"
                      />
                    </div>
                    
                    <Input
                      value={solidColor}
                      onChange={(e) => handleSolidColorChange(e.target.value)}
                      aria-label="Valor hexadecimal del color"
                    />
                  </div>
                  
                  <div>
                    <Label>Presets</Label>
                    <div className="grid grid-cols-8 gap-1 mt-1">
                      {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
                        '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#212121'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleSolidColorChange(color)}
                          className="w-full aspect-square rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          aria-label={`Color ${color}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleSolidColorChange(color);
                              e.preventDefault();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="gradient" className="space-y-4">
                  <div>
                    <Label>Presets</Label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {PREDEFINED_PALETTES.map((palette, i) => (
                        <button
                          key={i}
                          onClick={() => handlePresetClick(palette)}
                          className="w-full aspect-square rounded border border-gray-200 hover:scale-110 transition-transform overflow-hidden"
                          style={{
                            background: `linear-gradient(${angle}deg, ${palette
                              .sort((a, b) => a.position - b.position)
                              .map(s => `${s.color} ${s.position}%`)
                              .join(', ')})`
                          }}
                          aria-label={`Preset de gradiente ${i + 1}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handlePresetClick(palette);
                              e.preventDefault();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Vista previa</Label>
                    <div className="mb-1 h-8 rounded-md overflow-hidden relative">
                      <div className="absolute inset-0 rounded-md bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAFpJREFUOBFjZKAQMFKon2HwGcDAwOACxMgA5kIdoAHFyIDhPzMALYYboAckGhgYOHAYANILeoeRkdEFmzjMPTgNICSO1QBCikhV8xmoPQV5l5GRUQhqAhGAgQEAHQ8cEUssuRUAAAAASUVORK5CYII=')] opacity-100" />
                      <div className="absolute inset-0" style={colorPreviewStyle} />
                      <div className="absolute inset-0 flex">
                        {sortedStops.map((stop, index) => (
                          <button
                            key={index}
                            className="absolute -translate-x-1/2 -bottom-1 cursor-grab active:cursor-grabbing"
                            style={{ left: `${stop.position}%` }}
                            onMouseDown={(e) => handleMarkerDragStart(index, e)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowLeft') {
                                updateStop(index, 'position', Math.max(0, stop.position - 5));
                                e.preventDefault();
                              } else if (e.key === 'ArrowRight') {
                                updateStop(index, 'position', Math.min(100, stop.position + 5));
                                e.preventDefault();
                              }
                            }}
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

                  <div>
                    <Label>CSS</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
                      <code>{colorCSSString}</code>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
