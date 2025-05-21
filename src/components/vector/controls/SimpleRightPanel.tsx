'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { Label } from '@/components/ui/label';
// import { SliderWithInput } from '@/components/ui/slider-with-input'; // Reemplazado por inputs nativos
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
  const [rows, setRows] = useState(gridSettings?.rows ?? 10);
  const [cols, setCols] = useState(gridSettings?.cols ?? 10);
  const [spacing, setSpacing] = useState(gridSettings?.spacing ?? 8);
  const [margin, setMargin] = useState(gridSettings?.margin ?? 0);
  const [vectorLength, setVectorLength] = useState(
    typeof vectorSettings?.vectorLength === 'number' ? vectorSettings.vectorLength : 30
  );
  const [vectorWidth, setVectorWidth] = useState(
    typeof vectorSettings?.vectorWidth === 'number' ? vectorSettings.vectorWidth : 2
  );
  const [vectorShape, setVectorShape] = useState(vectorSettings?.vectorShape || 'arrow');
  
  // Sincronizar estado local cuando cambian las propiedades globales individuales de gridSettings
  useEffect(() => {
    if (gridSettings?.rows !== undefined) setRows(gridSettings.rows);
  }, [gridSettings?.rows]);

  useEffect(() => {
    if (gridSettings?.cols !== undefined) setCols(gridSettings.cols);
  }, [gridSettings?.cols]);

  useEffect(() => {
    if (gridSettings?.spacing !== undefined) setSpacing(gridSettings.spacing);
  }, [gridSettings?.spacing]);

  useEffect(() => {
    if (gridSettings?.margin !== undefined) setMargin(gridSettings.margin);
  }, [gridSettings?.margin]);

  // Sincronizar estado local cuando cambian las propiedades globales individuales de vectorSettings
  useEffect(() => {
    if (vectorSettings?.vectorLength !== undefined && typeof vectorSettings.vectorLength === 'number') {
      setVectorLength(vectorSettings.vectorLength);
    }
  }, [vectorSettings?.vectorLength]);

  useEffect(() => {
    if (vectorSettings?.vectorWidth !== undefined && typeof vectorSettings.vectorWidth === 'number') {
      setVectorWidth(vectorSettings.vectorWidth);
    }
  }, [vectorSettings?.vectorWidth]);

  useEffect(() => {
    if (vectorSettings?.vectorShape !== undefined) {
      setVectorShape(vectorSettings.vectorShape);
    } else {
      setVectorShape('arrow'); // Asegurar un valor por defecto si es undefined
    }
  }, [vectorSettings?.vectorShape]);

  // Funciones debounced para actualizar el store global
  const debouncedSetGridSettings = useMemo(
    () =>
      debounce((newPartialSettings: Partial<NonNullable<typeof gridSettings>>) => {
        setGridSettings(newPartialSettings);
      }, 300),
    [setGridSettings] // setGridSettings de Zustand es estable
  );

  const debouncedSetVectorSettings = useMemo(
    () =>
      debounce((newPartialSettings: Partial<NonNullable<typeof vectorSettings>>) => {
        setVectorSettings(newPartialSettings);
      }, 300),
    [setVectorSettings] // setVectorSettings de Zustand es estable
  );

  // Actualizar el store cuando cambian los valores locales
  const updateRows = (newRows: number) => {
    setRows(newRows); // Actualización local inmediata
    debouncedSetGridSettings({ rows: newRows }); // Actualización global debounced
  };
  
  const updateCols = (newCols: number) => {
    setCols(newCols);
    debouncedSetGridSettings({ cols: newCols });
  };
  
  const updateSpacing = (newSpacing: number) => {
    setSpacing(newSpacing);
    debouncedSetGridSettings({ spacing: newSpacing });
  };
  
  const updateMargin = (newMargin: number) => {
    setMargin(newMargin);
    debouncedSetGridSettings({ margin: newMargin });
  };
  
  const updateVectorLength = (newLength: number) => {
    setVectorLength(newLength);
    debouncedSetVectorSettings({ vectorLength: newLength });
  };
  
  const updateVectorWidth = (newWidth: number) => {
    setVectorWidth(newWidth);
    debouncedSetVectorSettings({ vectorWidth: newWidth });
  };
  
  const updateVectorShape = (newShape: string) => {
    const typedShape = newShape as VectorShape;
    setVectorShape(typedShape);
    debouncedSetVectorSettings({ vectorShape: typedShape }); 
    // O si se prefiere actualización inmediata para este control específico:
    // setVectorSettings((prevSettings) => ({ ...prevSettings, vectorShape: typedShape }));
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
              <Label htmlFor="rows-input">Filas: {rows}</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="rows-slider"
                  value={rows}
                  onChange={(e) => updateRows(parseInt(e.target.value, 10))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar filas con slider"
                />
                <input
                  type="number"
                  id="rows-input"
                  value={rows}
                  onChange={(e) => updateRows(parseInt(e.target.value, 10))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para filas"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cols-input">Columnas: {cols}</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="cols-slider"
                  value={cols}
                  onChange={(e) => updateCols(parseInt(e.target.value, 10))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar columnas con slider"
                />
                <input
                  type="number"
                  id="cols-input"
                  value={cols}
                  onChange={(e) => updateCols(parseInt(e.target.value, 10))}
                  min={1}
                  max={50}
                  step={1}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para columnas"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spacing-input">Espaciado: {spacing}px</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="spacing-slider"
                  value={spacing}
                  onChange={(e) => updateSpacing(parseInt(e.target.value, 10))}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar espaciado con slider"
                />
                <input
                  type="number"
                  id="spacing-input"
                  value={spacing}
                  onChange={(e) => updateSpacing(parseInt(e.target.value, 10))}
                  min={0}
                  max={50}
                  step={1}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para espaciado"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="margin-input">Margen: {margin}px</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="margin-slider"
                  value={margin}
                  onChange={(e) => updateMargin(parseInt(e.target.value, 10))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar margen con slider"
                />
                <input
                  type="number"
                  id="margin-input"
                  value={margin}
                  onChange={(e) => updateMargin(parseInt(e.target.value, 10))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para margen"
                />
              </div>
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
              <Label htmlFor="vectorLength-input">Longitud: {vectorLength}px</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="vectorLength-slider"
                  value={vectorLength}
                  onChange={(e) => updateVectorLength(parseInt(e.target.value, 10))}
                  min={1}
                  max={600}
                  step={1}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar longitud del vector con slider"
                />
                <input
                  type="number"
                  id="vectorLength-input"
                  value={vectorLength}
                  onChange={(e) => updateVectorLength(parseInt(e.target.value, 10))}
                  min={1}
                  max={600}
                  step={1}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para longitud del vector"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vectorWidth-input">Ancho: {vectorWidth}px</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="vectorWidth-slider"
                  value={vectorWidth}
                  onChange={(e) => updateVectorWidth(parseFloat(e.target.value))}
                  min={0.5}
                  max={20}
                  step={0.5}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Ajustar ancho del vector con slider"
                />
                <input
                  type="number"
                  id="vectorWidth-input"
                  value={vectorWidth}
                  onChange={(e) => updateVectorWidth(parseFloat(e.target.value))}
                  min={0.5}
                  max={20}
                  step={0.5}
                  className="w-20 p-1 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  aria-label="Entrada numérica para ancho del vector"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
