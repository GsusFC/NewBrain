import React, { useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { ButtonGroup } from '@/components/ui/button-group';

import { 
  useGridSettings, 
  useVectorSettings,
  useRenderSettings,
  useUpdateProps
} from '../store/improved/hooks';
import { VectorShape } from '../core/types';

// Crear un componente GridControls simplificado directamente aquí para evitar dependencias externas
const GridControls = ({ currentProps, onPropsChange }) => {
  const { gridSettings, aspectRatio, backgroundColor } = currentProps;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-medium text-xs">Filas y Columnas</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="rowsInput" className="text-xs opacity-70">Filas</Label>
            <Input
              id="rowsInput"
              type="number"
              value={gridSettings?.rows || 10}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  onPropsChange({
                    gridSettings: { ...(gridSettings || {}), rows: value }
                  });
                }
              }}
              min="1"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="colsInput" className="text-xs opacity-70">Columnas</Label>
            <Input
              id="colsInput"
              type="number"
              value={gridSettings?.cols || 10}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  onPropsChange({
                    gridSettings: { ...(gridSettings || {}), cols: value }
                  });
                }
              }}
              min="1"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-xs">Espaciado</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="spacingXInput" className="text-xs opacity-70">Horizontal</Label>
            <Input
              id="spacingXInput"
              type="number"
              value={gridSettings?.spacingX || 40}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 0) {
                  onPropsChange({
                    gridSettings: { ...(gridSettings || {}), spacingX: value }
                  });
                }
              }}
              min="0"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="spacingYInput" className="text-xs opacity-70">Vertical</Label>
            <Input
              id="spacingYInput"
              type="number"
              value={gridSettings?.spacingY || 40}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 0) {
                  onPropsChange({
                    gridSettings: { ...(gridSettings || {}), spacingY: value }
                  });
                }
              }}
              min="0"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-xs">Relación de Aspecto</Label>
        <div className="space-y-2">
          <div>
            <select
              value={aspectRatio}
              onChange={(e) => onPropsChange({ 
                aspectRatio: e.target.value as any,
                // Reset custom aspect ratio when switching to a preset
                ...(e.target.value !== 'custom' && { customAspectRatio: undefined })
              })}
              className="w-full px-3 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring appearance-none"
            >
              <option value="auto">Auto</option>
              <option value="1:1">1:1 (Cuadrado)</option>
              <option value="2:1">2:1 (Doble ancho)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          {aspectRatio === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="aspectWidth" className="text-xs opacity-70">Ancho</Label>
                <Input
                  id="aspectWidth"
                  type="number"
                  min="1"
                  value={currentProps.customAspectRatio?.width || 16}
                  onChange={(e) => {
                    const width = parseInt(e.target.value, 10);
                    if (!isNaN(width) && width > 0) {
                      onPropsChange({
                        customAspectRatio: {
                          ...(currentProps.customAspectRatio || { width: 16, height: 9 }),
                          width
                        }
                      });
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="aspectHeight" className="text-xs opacity-70">Alto</Label>
                <Input
                  id="aspectHeight"
                  type="number"
                  min="1"
                  value={currentProps.customAspectRatio?.height || 9}
                  onChange={(e) => {
                    const height = parseInt(e.target.value, 10);
                    if (!isNaN(height) && height > 0) {
                      onPropsChange({
                        customAspectRatio: {
                          ...(currentProps.customAspectRatio || { width: 16, height: 9 }),
                          height
                        }
                      });
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-xs">Color de Fondo</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={backgroundColor || '#000000'}
            onChange={(e) => onPropsChange({ backgroundColor: e.target.value })}
            className="h-10 w-12 p-1"
          />
          <Input
            type="text"
            value={backgroundColor || '#000000'}
            onChange={(e) => onPropsChange({ backgroundColor: e.target.value })}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Panel de control derecho completamente integrado con la arquitectura Zustand
 * Esta versión elimina la propagación de props y los ciclos de renderizado
 */
export function RightControlPanelWithStore() {
  // Acceso directo al estado a través de hooks selectores
  const { gridSettings, aspectRatio, customAspectRatio, setGridSettings } = useGridSettings();
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  const { backgroundColor } = useRenderSettings();
  
  // Hook para actualizar múltiples propiedades a la vez
  const updateProps = useUpdateProps();
  
  // Extraer valores del store para facilitar el acceso
  const { userSvg } = gridSettings;
  const {
    vectorLength = 30,
    vectorWidth = 2,
    vectorColor = '#ffffff',
    vectorShape = 'arrow',
    strokeLinecap = 'round',
    rotationOrigin = 'start',
  } = vectorSettings;
  
  // Handler para cambios en propiedades de vectores
  const handleVectorChange = (
    property: string,
    value: any
  ) => {
    setVectorSettings({
      ...vectorSettings,
      [property]: value
    });
  };
  
  // Handler para cambios en propiedades con slider
  const handleVectorSliderChange = (
    property: string,
    values: number[]
  ) => {
    if (values && values.length > 0) {
      setVectorSettings({
        ...vectorSettings,
        [property]: values[0]
      });
    }
  };
  
  // Renderizado memoizado para evitar renders innecesarios
  const renderContent = useMemo(() => (
    <div className="p-4 space-y-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xl font-semibold tracking-tight text-center">Configuración del Grid</h3>
      <Separator />
      <div className="space-y-6">
        <GridControls 
          currentProps={{
            gridSettings,
            aspectRatio,
            customAspectRatio,
            backgroundColor
          }}
          onPropsChange={(props) => {
            // Actualizar múltiples propiedades mediante el hook centralizado
            updateProps(props);
          }}
        />
      </div>

      <Separator />
      <div className="space-y-6">
        <h3 className="text-xl font-semibold tracking-tight text-center">Configuración de Vectores</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="font-medium text-xs">Forma del Vector</Label>
            <ButtonGroup
              value={vectorShape}
              onChange={(value) => handleVectorChange('vectorShape', value)}
              options={[
                { value: 'arrow', label: 'Flecha' },
                { value: 'line', label: 'Línea' },
                { value: 'dot', label: 'Punto' },
                { value: 'triangle', label: 'Triángulo' },
                { value: 'circle', label: 'Círculo' },
                { value: 'semicircle', label: 'Semicírculo' },
                { value: 'curve', label: 'Curva' },
                { value: 'rectangle', label: 'Rectángulo' },
                { value: 'plus', label: 'Cruz' },
                { value: 'userSvg', label: 'SVG' }
              ]}
              size="sm"
            />
          </div>

          {vectorShape === 'userSvg' && (
            <div className="p-3 border rounded-md space-y-2 mt-2 border-border">
              <Label>Código SVG del Usuario</Label>
              <Textarea 
                value={userSvg || ''} 
                onChange={e => setGridSettings({
                  ...gridSettings,
                  userSvg: e.target.value
                })} 
                placeholder="<svg viewBox='0 0 10 10'><path d='...' fill='currentColor'/></svg>" 
                rows={5}
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="font-medium text-xs">Longitud (px)</Label>
            <SliderWithInput 
              value={[typeof vectorLength === 'number' ? vectorLength : 30]} 
              max={600} 
              min={1} 
              step={1} 
              precision={0} 
              onValueChange={(val) => handleVectorSliderChange('vectorLength', val)} 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="font-medium text-xs">Ancho del trazo (px)</Label>
            <SliderWithInput 
              value={[typeof vectorWidth === 'number' ? vectorWidth : 2]} 
              max={20} 
              min={0.5} 
              step={0.5} 
              precision={1} 
              onValueChange={(val) => handleVectorSliderChange('vectorWidth', val)} 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="font-medium text-xs">Color del Vector</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="color" 
                value={typeof vectorColor === 'string' ? vectorColor : '#ffffff'} 
                onChange={(e) => handleVectorChange('vectorColor', e.target.value)} 
                className="h-10 w-12 p-1" 
                disabled={typeof vectorColor !== 'string'}
              />
              <Input 
                type="text" 
                value={typeof vectorColor === 'string' ? vectorColor : '(Complejo)'} 
                onChange={(e) => handleVectorChange('vectorColor', e.target.value)} 
                placeholder="#ffffff" 
                className="flex-1" 
                disabled={typeof vectorColor !== 'string'}
              />
            </div>
            {typeof vectorColor !== 'string' && (
              <p className="text-xs text-muted-foreground mt-1">
                Color definido por función o gradiente.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-xs">Terminación de trazo</Label>
            <ButtonGroup
              value={strokeLinecap}
              onChange={(value) => handleVectorChange('strokeLinecap', value)}
              options={[
                { value: 'round', label: 'Redonda' },
                { value: 'butt', label: 'Plana' },
                { value: 'square', label: 'Cuadrada' }
              ]}
              size="sm"
            />
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-xs">Punto de rotación</Label>
            <ButtonGroup
              value={rotationOrigin}
              onChange={(value) => handleVectorChange('rotationOrigin', value)}
              options={[
                { value: 'start', label: 'Inicio' },
                { value: 'center', label: 'Centro' },
                { value: 'end', label: 'Final' }
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  ), [
    gridSettings, 
    aspectRatio, 
    customAspectRatio, 
    backgroundColor,
    vectorSettings,
    vectorLength,
    vectorWidth,
    vectorColor,
    vectorShape,
    strokeLinecap,
    rotationOrigin,
    userSvg,
    setGridSettings,
    updateProps,
    handleVectorChange,
    handleVectorSliderChange
  ]);

  return renderContent;
}
