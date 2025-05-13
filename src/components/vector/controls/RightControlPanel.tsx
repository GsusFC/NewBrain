// src/components/vector/controls/RightControlPanel.tsx
'use client';

import React from 'react';
import type { VectorGridProps, VectorShape, RotationOrigin, StrokeLinecap, GridSettings, VectorSettings } from '../core/types';
import { ScrollArea } from '@/components/ui/scroll-area';
// Accordions eliminados en favor de secciones directamente visibles
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea'; // Para userSvgString

// Importa tus sub-componentes de control si los tienes (NumericInputControl, SliderControl)

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

// Helper para manejar cambios de input numérico para propiedades de grid
const handleGridNumericChange = (
  propName: keyof GridSettings, 
  value: string, 
  onGridSettingsChange?: GridSettingsChangeHandler, 
  onPropsChange?: PropsChangeHandler
) => {
    const numValue = parseInt(value, 10); // Usar parseInt para rows/cols
    if (!isNaN(numValue)) {
      if (onGridSettingsChange) {
        onGridSettingsChange({ [propName]: numValue });
      } else if (onPropsChange) {
        onPropsChange({ gridSettings: { [propName]: numValue } });
      }
    } else if (value === '') {
      if (onGridSettingsChange) {
        onGridSettingsChange({ [propName]: undefined });
      } else if (onPropsChange) {
        onPropsChange({ gridSettings: { [propName]: undefined } });
      }
    }
};

// Helper para manejar cambios de slider para propiedades de grid (shadcn Slider devuelve un array)
const handleGridSliderChange = (
  propName: keyof GridSettings, 
  value: number[], 
  onGridSettingsChange?: GridSettingsChangeHandler, 
  onPropsChange?: PropsChangeHandler
) => {
    if (onGridSettingsChange) {
      onGridSettingsChange({ [propName]: value[0] });
    } else if (onPropsChange) {
      onPropsChange({ gridSettings: { [propName]: value[0] } });
    }
};

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
    if (onVectorSettingsChange) {
      onVectorSettingsChange({ [propName]: value[0] });
    } else if (onPropsChange) {
      onPropsChange({ vectorSettings: { [propName]: value[0] } });
    }
};

// Helpers para manejar propiedades específicas de la cuadrícula y vectores
// (Las funciones handleNumericChange se eliminaron ya que no se necesitan más)

export function RightControlPanel({ 
  currentProps, 
  onPropsChange,
  onGridSettingsChange,
  onVectorSettingsChange 
}: RightControlPanelProps) {
  // Extraemos las propiedades de la nueva estructura jerárquica
  const {
    backgroundColor,
    gridSettings = {}, // Usar objeto vacío como fallback
    vectorSettings = {}, // Usar objeto vacío como fallback
  } = currentProps;
  
  // Desestructurar gridSettings
  const {
    rows, 
    cols, 
    spacing, 
    margin
  } = gridSettings;
  
  // Desestructurar vectorSettings
  const {
    vectorShape,
    vectorLength,
    vectorColor,
    vectorWidth,
    strokeLinecap,
    rotationOrigin
  } = vectorSettings;
  
  // Acceder a userSvg desde gridSettings, no vectorSettings
  const userSvg = gridSettings.userSvg;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <h3 className="text-xl font-semibold tracking-tight text-center">Cuadrícula y Vectores</h3>
        <Separator />
        
        {/* Sección: Configuración de Cuadrícula */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-base">Configuración de Cuadrícula</h4>
              <div>
                <Label htmlFor="rightBgColor">Color de Fondo Canvas</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input id="rightBgColorPicker" type="color" value={backgroundColor || '#000000'} onChange={(e) => onPropsChange({ backgroundColor: e.target.value })} className="h-10 w-12 p-1"/>
                  <Input id="rightBgColorText" type="text" value={backgroundColor || '#000000'} onChange={(e) => onPropsChange({ backgroundColor: e.target.value })} placeholder="#000000" className="flex-1"/>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="rowsInput" className="whitespace-nowrap text-xs">Filas</Label>
                  <Input 
                    id="rowsInput" 
                    type="number" 
                    value={rows ?? ''} 
                    onChange={(e) => handleGridNumericChange('rows', e.target.value, onGridSettingsChange, onPropsChange)} 
                    min="1" 
                    className="w-14 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Label htmlFor="colsInput" className="whitespace-nowrap text-xs">Columnas</Label>
                  <Input 
                    id="colsInput" 
                    type="number" 
                    value={cols ?? ''} 
                    onChange={(e) => handleGridNumericChange('cols', e.target.value, onGridSettingsChange, onPropsChange)} 
                    min="1" 
                    className="w-14 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>
              </div>
              <Label htmlFor="spacingSlider">Espaciado (px)</Label>
              <SliderWithInput id="spacingSlider" value={[spacing || 30]} max={150} min={5} step={1} precision={0} onValueChange={(val) => handleGridSliderChange('spacing', val, onGridSettingsChange, onPropsChange)} />
              <Label htmlFor="marginSlider">Margen (px)</Label>
              <SliderWithInput id="marginSlider" value={[margin || 0]} max={100} min={0} step={1} precision={0} onValueChange={(val) => handleGridSliderChange('margin', val, onGridSettingsChange, onPropsChange)} />
        </div>
        
        <Separator className="my-4" />
        
        {/* Sección: Estilo de Vectores */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-base">Estilo de Vectores</h4>
              <Label htmlFor="vectorShapeSelect">Forma</Label>
              <Select value={vectorShape} onValueChange={(value) => handleVectorChange('vectorShape', value as VectorShape, onVectorSettingsChange, onPropsChange)}>
                <SelectTrigger id="vectorShapeSelect"><SelectValue placeholder="Selecciona forma" /></SelectTrigger>
                <SelectContent>
                    {/* ... opciones de forma ... */}
                    <SelectItem value="line">Línea</SelectItem><SelectItem value="arrow">Flecha</SelectItem>
                    <SelectItem value="dot">Punto</SelectItem><SelectItem value="triangle">Triángulo</SelectItem>
                    <SelectItem value="semicircle">Semicírculo</SelectItem><SelectItem value="curve">Curva</SelectItem>
                    <SelectItem value="rectangle">Rectángulo</SelectItem><SelectItem value="plus">Cruz</SelectItem>
                    <SelectItem value="userSvg">SVG Usuario</SelectItem>
                </SelectContent>
              </Select>

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
                  {/* Input para userSvgPreserveAspectRatio (Select) */}
                </div>
              )}

              <Label htmlFor="vecLenSlider">Longitud (px)</Label>
              <SliderWithInput id="vecLenSlider" value={[typeof vectorLength === 'number' ? vectorLength : 30]} max={200} min={1} step={1} precision={0} onValueChange={(val) => handleVectorSliderChange('vectorLength', val, onVectorSettingsChange, onPropsChange)} />
              
              <Label htmlFor="vecColorInput">Color del Vector</Label>
              <div className="flex items-center gap-2 mt-1">
                  <Input id="vecColorPicker" type="color" value={typeof vectorColor === 'string' ? vectorColor : '#ffffff'} onChange={(e) => handleVectorChange('vectorColor', e.target.value, onVectorSettingsChange, onPropsChange)} className="h-10 w-12 p-1" disabled={typeof vectorColor !== 'string'}/>
                  <Input id="vecColorText" type="text" value={typeof vectorColor === 'string' ? vectorColor : '(Complejo)'} onChange={(e) => handleVectorChange('vectorColor', e.target.value, onVectorSettingsChange, onPropsChange)} placeholder="#ffffff" className="flex-1" disabled={typeof vectorColor !== 'string'}/>
              </div>
              {typeof vectorColor !== 'string' && <p className="text-xs text-muted-foreground mt-1">Color definido por función o gradiente.</p>}


              <Label htmlFor="vecWidthSlider">Grosor (px)</Label>
              <SliderWithInput id="vecWidthSlider" value={[typeof vectorWidth === 'number' ? vectorWidth : 2]} max={50} min={0.1} step={0.1} precision={1} onValueChange={(val) => handleVectorSliderChange('vectorWidth', val, onVectorSettingsChange, onPropsChange)} />
              
              <Label htmlFor="strokeLinecapSelect">Extremo de Línea</Label>
              <Select value={strokeLinecap} onValueChange={(value) => handleVectorChange('strokeLinecap', value as StrokeLinecap, onVectorSettingsChange, onPropsChange)}>
                <SelectTrigger id="strokeLinecapSelect"><SelectValue placeholder="Selecciona extremo" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="butt">Butt</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="rotationOriginSelect">Origen de Rotación</Label>
              <Select value={rotationOrigin} onValueChange={(value) => handleVectorChange('rotationOrigin', value as RotationOrigin, onVectorSettingsChange, onPropsChange)}>
                <SelectTrigger id="rotationOriginSelect"><SelectValue placeholder="Selecciona origen" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="start">Inicio</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="end">Final</SelectItem>
                </SelectContent>
              </Select>
        </div>
        

      </div>
    </ScrollArea>
  );
}
