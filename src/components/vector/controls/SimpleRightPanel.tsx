'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { SliderWithInput } from '@/components/ui/slider-with-input';
import { ButtonGroup } from '@/components/ui/button-group';
import { useGridSettings, useVectorSettings } from '../store/improved/hooks';
import { VectorShape } from '../core/types';

/**
 * Panel de control derecho simplificado al máximo
 * Versión ultra simplificada enfocada en que funcionen los sliders
 */
export function SimpleRightPanel() {
  // Hooks para acceder al estado global
  const { gridSettings, setGridSettings } = useGridSettings();
  const { vectorSettings, setVectorSettings } = useVectorSettings();
  
  // Estado local independiente
  const [rows, setRows] = useState(gridSettings?.rows || 10);
  const [cols, setCols] = useState(gridSettings?.cols || 10);
  const [spacing, setSpacing] = useState(gridSettings?.spacing || 8);
  const [margin, setMargin] = useState(gridSettings?.margin || 0);
  const [vectorLength, setVectorLength] = useState(
    typeof vectorSettings?.vectorLength === 'number' ? vectorSettings.vectorLength : 30
  );
  const [vectorWidth, setVectorWidth] = useState(
    typeof vectorSettings?.vectorWidth === 'number' ? vectorSettings.vectorWidth : 2
  );
  const [vectorShape, setVectorShape] = useState(vectorSettings?.vectorShape || 'arrow');
  
  // Sincronizar estado local cuando cambia el estado global
  useEffect(() => {
    setRows(gridSettings?.rows || 10);
    setCols(gridSettings?.cols || 10);
    setSpacing(gridSettings?.spacing || 8);
    setMargin(gridSettings?.margin || 0);
  }, [gridSettings]);
  
  useEffect(() => {
    if (typeof vectorSettings?.vectorLength === 'number') {
      setVectorLength(vectorSettings.vectorLength);
    }
    if (typeof vectorSettings?.vectorWidth === 'number') {
      setVectorWidth(vectorSettings.vectorWidth);
    }
    setVectorShape(vectorSettings?.vectorShape || 'arrow');
  }, [vectorSettings]);

  // Actualizar el store cuando cambian los valores locales
  const updateRows = (newRows: number) => {
    setRows(newRows);
    setGridSettings({ ...gridSettings, rows: newRows });
  };
  
  const updateCols = (newCols: number) => {
    setCols(newCols);
    setGridSettings({ ...gridSettings, cols: newCols });
  };
  
  const updateSpacing = (newSpacing: number) => {
    setSpacing(newSpacing);
    setGridSettings({ ...gridSettings, spacing: newSpacing });
  };
  
  const updateMargin = (newMargin: number) => {
    setMargin(newMargin);
    setGridSettings({ ...gridSettings, margin: newMargin });
  };
  
  const updateVectorLength = (newLength: number) => {
    setVectorLength(newLength);
    setVectorSettings({ ...vectorSettings, vectorLength: newLength });
  };
  
  const updateVectorWidth = (newWidth: number) => {
    setVectorWidth(newWidth);
    setVectorSettings({ ...vectorSettings, vectorWidth: newWidth });
  };
  
  const updateVectorShape = (newShape: string) => {
    // TypeScript quiere asegurarse de que el valor es uno válido de VectorShape
    const typedShape = newShape as VectorShape;
    setVectorShape(typedShape);
    setVectorSettings({ ...vectorSettings, vectorShape: typedShape });
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Panel Simple (Provisional)</h2>
        <p className="text-sm text-gray-500">Esta es una versión simplificada con los controles básicos.</p>
      </div>

      <div className="space-y-8 p-4 bg-slate-800/20 rounded-lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configuración del Grid</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filas: {rows}</Label>
              <SliderWithInput
                value={[rows]}
                onValueChange={([value]) => updateRows(value)}
                min={1}
                max={50}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Columnas: {cols}</Label>
              <SliderWithInput
                value={[cols]}
                onValueChange={([value]) => updateCols(value)}
                min={1}
                max={50}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Espaciado: {spacing}px</Label>
              <SliderWithInput
                value={[spacing]}
                onValueChange={([value]) => updateSpacing(value)}
                min={0}
                max={50}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Margen: {margin}px</Label>
              <SliderWithInput
                value={[margin]}
                onValueChange={([value]) => updateMargin(value)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Apariencia de Vectores</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Forma del Vector</Label>
              <ButtonGroup
                options={[
                  { label: 'Línea', value: 'line' },
                  { label: 'Flecha', value: 'arrow' },
                  { label: 'Punto', value: 'dot' },
                  { label: 'Triángulo', value: 'triangle' },
                  { label: 'Semicírculo', value: 'semicircle' },
                ]}
                value={vectorShape as string}
                onChange={updateVectorShape}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Longitud: {vectorLength}px</Label>
              <SliderWithInput
                value={[vectorLength]}
                onValueChange={([value]) => updateVectorLength(value)}
                min={1}
                max={600}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ancho: {vectorWidth}px</Label>
              <SliderWithInput
                value={[vectorWidth]}
                onValueChange={([value]) => updateVectorWidth(value)}
                min={0.5}
                max={20}
                step={0.5}
                precision={1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
