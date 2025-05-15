// src/components/vector/controls/RightControlPanel.tsx
'use client';

import React from 'react';
import type { VectorGridProps, GridSettings, VectorSettings } from '../core/types';

// Tipos locales para elementos que no estén exportados desde core/types
type VectorShape = 'arrow' | 'triangle' | 'circle' | 'semicircle' | 'curve' | 'rectangle' | 'plus' | 'userSvg';
type RotationOrigin = 'start' | 'center' | 'end';
type StrokeLinecap = 'butt' | 'round' | 'square';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { Textarea } from '@/components/ui/textarea'; // Para userSvgString
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridControls } from './grid/GridControls';

// Definiciones de tipos específicos para callbacks
type PropsChangeHandler = (newValues: Partial<VectorGridProps>) => void;
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
  value: string | number | boolean, // Tipos más específicos para las propiedades de vectores
  onVectorSettingsChange?: VectorSettingsChangeHandler, 
  onPropsChange?: PropsChangeHandler
) => {
  if (onVectorSettingsChange) {
    onVectorSettingsChange({ [propName]: value });
  } else if (onPropsChange) {
    onPropsChange({ vectorSettings: { [propName]: value } });
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
      onPropsChange({ vectorSettings: { [propName]: value[0] } });
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
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Componente de configuración del Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Grid</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Vectores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
            <Label htmlFor="vectorShapeSelect">Forma del Vector</Label>
            <Select 
              value={vectorShape as string} 
              onValueChange={(value) => handleVectorChange('vectorShape', value as VectorShape, onVectorSettingsChange, onPropsChange)}
            >
              <SelectTrigger id="vectorShapeSelect">
                <SelectValue placeholder="Selecciona forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Línea</SelectItem>
                <SelectItem value="arrow">Flecha</SelectItem>
                <SelectItem value="dot">Punto</SelectItem>
                <SelectItem value="triangle">Triángulo</SelectItem>
                <SelectItem value="semicircle">Semicírculo</SelectItem>
                <SelectItem value="curve">Curva</SelectItem>
                <SelectItem value="rectangle">Rectángulo</SelectItem>
                <SelectItem value="plus">Cruz</SelectItem>
                <SelectItem value="userSvg">SVG Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vectorShape === 'userSvg' && (
            <div className="p-3 border rounded-md space-y-2 mt-2 border-slate-700">
              <Label htmlFor="userSvgInput">Código SVG del Usuario</Label>
              <Textarea 
                id="userSvgInput" 
                value={userSvg || ''} 
                onChange={e => onGridSettingsChange?.({
                  userSvg: e.target.value
                })} 
                placeholder="<svg viewBox='0 0 10 10'><path d='...' fill='currentColor'/></svg>" 
                rows={5}
              />
            </div>
          )}

          <div>
            <Label htmlFor="vecLenSlider">Longitud (px)</Label>
            <SliderWithInput 
              id="vecLenSlider" 
              value={[typeof vectorLength === 'number' ? vectorLength : 30]} 
              max={600} 
              min={1} 
              step={1} 
              precision={0} 
              onValueChange={(val) => handleVectorSliderChange('vectorLength', val, onVectorSettingsChange, onPropsChange)} 
            />
          </div>
          
          <div>
            <Label htmlFor="vecColorInput">Color del Vector</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                id="vecColorPicker" 
                type="color" 
                value={typeof vectorColor === 'string' ? vectorColor : '#ffffff'} 
                onChange={(e) => handleVectorChange('vectorColor', e.target.value, onVectorSettingsChange, onPropsChange)} 
                className="h-10 w-12 p-1" 
                disabled={typeof vectorColor !== 'string'}
              />
              <Input 
                id="vecColorText" 
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

          <div>
            <Label htmlFor="vecWidthSlider">Grosor (px)</Label>
            <SliderWithInput 
              id="vecWidthSlider" 
              value={[typeof vectorWidth === 'number' ? vectorWidth : 2]} 
              max={50} 
              min={0.1} 
              step={0.1} 
              precision={1} 
              onValueChange={(val) => handleVectorSliderChange('vectorWidth', val, onVectorSettingsChange, onPropsChange)} 
            />
          </div>
          
          <div>
            <Label htmlFor="strokeLinecapSelect">Extremo de Línea</Label>
            <Select 
              value={strokeLinecap} 
              onValueChange={(value) => handleVectorChange('strokeLinecap', value as StrokeLinecap, onVectorSettingsChange, onPropsChange)}
            >
              <SelectTrigger id="strokeLinecapSelect">
                <SelectValue placeholder="Selecciona extremo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="butt">Butt</SelectItem>
                <SelectItem value="round">Round</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rotationOriginSelect">Origen de Rotación</Label>
            <Select 
              value={rotationOrigin} 
              onValueChange={(value) => handleVectorChange('rotationOrigin', value as RotationOrigin, onVectorSettingsChange, onPropsChange)}
            >
              <SelectTrigger id="rotationOriginSelect">
                <SelectValue placeholder="Selecciona origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Inicio</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="end">Final</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
