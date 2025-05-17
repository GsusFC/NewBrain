// src/components/vector/controls/RightControlPanel.tsx
'use client';

import React from 'react';
import type { VectorGridProps, GridSettings, VectorSettings } from '../core/types';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from "@/components/ui/button-group";
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { Textarea } from '@/components/ui/textarea'; // Para userSvgString

import { GridControls } from './grid/GridControls';

// Definiciones de tipos específicos para callbacks
type PropsChangeHandler = (newValues: Partial<VectorGridProps> | ((prev: VectorGridProps) => VectorGridProps)) => void;
type GridSettingsChangeHandler = (newGridSettings: Partial<GridSettings>) => void;
type VectorSettingsChangeHandler = (newVectorSettings: Partial<VectorSettings>) => void;

interface RightControlPanelProps {
  currentProps: VectorGridProps;
  onPropsChange: PropsChangeHandler;
  onGridSettingsChange?: GridSettingsChangeHandler;
  onVectorSettingsChange?: VectorSettingsChangeHandler;
}

// Helper para manejar cambios de propiedades de vectores
const handleVectorChange = (
  propName: keyof VectorSettings, 
  value: string | number | boolean,
  onVectorSettingsChange?: VectorSettingsChangeHandler, 
  onPropsChange?: PropsChangeHandler
) => {
  if (onVectorSettingsChange) {
    onVectorSettingsChange({ [propName]: value });
  } else if (onPropsChange) {
    onPropsChange((prev) => ({
      ...prev,
      vectorSettings: {
        ...prev.vectorSettings,
        [propName]: value
      }
    }));
  }
};

// Helper para manejar cambios de slider para propiedades de vectores
const handleVectorSliderChange = (
  propName: keyof VectorSettings, 
  value: number[], 
  onVectorSettingsChange?: VectorSettingsChangeHandler, 
  onPropsChange?: PropsChangeHandler
) => {
  if (value.length > 0) {
    if (onVectorSettingsChange) {
      onVectorSettingsChange({ [propName]: value[0] });
    } else if (onPropsChange) {
      onPropsChange((prev) => ({
        ...prev,
        vectorSettings: {
          ...prev.vectorSettings,
          [propName]: value[0]
        }
      }));
    }
  }
};

export function RightControlPanel({ 
  currentProps, 
  onPropsChange,
  onGridSettingsChange,
  onVectorSettingsChange 
}: RightControlPanelProps) {
  // Extraer propiedades relevantes de currentProps
  const { 
    vectorSettings = {},
    gridSettings = {} 
  } = currentProps;

  const { userSvg } = gridSettings;

  const {
    vectorLength,
    vectorWidth,
    vectorColor,
    vectorShape = 'arrow',
    strokeLinecap = 'round',
    rotationOrigin = 'start',
  } = vectorSettings;

  return (
    <ScrollArea className="h-full w-full" data-component-name="RightControlPanel">
      <div className="p-4 space-y-6">
        <h3 className="text-xl font-semibold tracking-tight text-center">Configuración del Grid</h3>
        <Separator />
        <div className="space-y-6">
          <GridControls 
            currentProps={{
              gridSettings: currentProps.gridSettings,
              aspectRatio: currentProps.aspectRatio,
              customAspectRatio: currentProps.customAspectRatio,
              backgroundColor: currentProps.backgroundColor
            }}
            onPropsChange={(props) => {
              onPropsChange(props);
              // Si existe onGridSettingsChange y hay cambios en gridSettings, llamarlo también
              if (onGridSettingsChange && props.gridSettings) {
                onGridSettingsChange(props.gridSettings);
              }
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
                onChange={(value) => handleVectorChange('vectorShape', value, onVectorSettingsChange, onPropsChange)}
                options={[
                  { value: 'arrow', label: 'Flecha' },
                  { value: 'line', label: 'Línea' },
                  { value: 'dot', label: 'Punto' },
                  { value: 'triangle', label: 'Triángulo' },
                  { value: 'semicircle', label: 'Semicírculo' },
                  { value: 'curve', label: 'Curva' },
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
                  onChange={e => onGridSettingsChange?.({
                    userSvg: e.target.value
                  })} 
                  placeholder="<svg viewBox='0 0 10 10'><path d='...' fill='currentColor'/></svg>" 
                  rows={5}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-xs">Longitud</Label>
                <span className="text-xs text-muted-foreground">
                  {typeof vectorLength === 'number' ? vectorLength : 30}px
                </span>
              </div>
              <SliderWithInput 
                value={[typeof vectorLength === 'number' ? vectorLength : 30]} 
                max={600} 
                min={1} 
                step={1}
                precision={0}
                aria-label="Longitud del vector en píxeles"
                onValueChange={(val) => handleVectorSliderChange('vectorLength', val, onVectorSettingsChange, onPropsChange)}
                className="mt-1"
                inputClassName="w-16 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="font-medium text-xs">Color del Vector</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="color" 
                  value={typeof vectorColor === 'string' ? vectorColor : '#ffffff'} 
                  onChange={(e) => handleVectorChange('vectorColor', e.target.value, onVectorSettingsChange, onPropsChange)} 
                  className="h-10 w-12 p-1" 
                  disabled={typeof vectorColor !== 'string'}
                />
                <Input 
                  type="text" 
                  value={typeof vectorColor === 'string' ? vectorColor : '(Complejo)'} 
                  onChange={(e) => handleVectorChange('vectorColor', e.target.value, onVectorSettingsChange, onPropsChange)} 
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-xs">Grosor</Label>
                <span className="text-xs text-muted-foreground">
                  {typeof vectorWidth === 'number' ? vectorWidth.toFixed(1) : '2.0'}px
                </span>
              </div>
              <SliderWithInput 
                value={[typeof vectorWidth === 'number' ? vectorWidth : 2]} 
                max={50} 
                min={0.1} 
                step={0.1}
                precision={1}
                aria-label="Grosor del vector en píxeles"
                onValueChange={(val) => handleVectorSliderChange('vectorWidth', val, onVectorSettingsChange, onPropsChange)}
                className="mt-1"
                inputClassName="w-16 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="font-medium text-xs">Extremo de Línea</Label>
              <ButtonGroup
                value={strokeLinecap}
                onChange={(value) => handleVectorChange('strokeLinecap', value, onVectorSettingsChange, onPropsChange)}
                options={[
                  { value: 'butt', label: 'Plano' },
                  { value: 'round', label: 'Redondo' },
                  { value: 'square', label: 'Cuadrado' }
                ]}
                size="sm"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-medium text-xs">Origen de Rotación</Label>
              <ButtonGroup
                value={rotationOrigin}
                onChange={(value) => handleVectorChange('rotationOrigin', value, onVectorSettingsChange, onPropsChange)}
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
    </ScrollArea>
  );
}
