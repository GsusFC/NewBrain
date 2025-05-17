'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AspectRatioOption, GridSettings } from './types';
import { useAspectRatioCalculator } from '@/hooks/vector/useAspectRatioCalculator';

// Valores por defecto y constantes
const MIN_DENSITY = 3;  // Mínimo número de filas
const MAX_DENSITY = 30; // Máximo número de filas
const DEFAULT_DENSITY = 10;

interface DensityControlProps {
  gridSettings?: GridSettings;
  aspectRatio: AspectRatioOption;
  customRatio?: { width: number; height: number };
  onChange: (settings: GridSettings) => void;
  onDensityChange?: (density: number) => void;
}

export function DensityControl({
  gridSettings,
  aspectRatio,
  customRatio,
  onChange,
  onDensityChange
}: DensityControlProps) {
  // Estado local para la densidad
  const [density, setDensity] = useState<number>(() => {
    if (gridSettings?.density !== undefined) {
      return Math.max(MIN_DENSITY, Math.min(gridSettings.density, MAX_DENSITY));
    }
    if (gridSettings?.rows !== undefined) {
      return Math.max(MIN_DENSITY, Math.min(gridSettings.rows, MAX_DENSITY));
    }
    return DEFAULT_DENSITY;
  });
  
  // Estado para mostrar valores durante el arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [localDensity, setLocalDensity] = useState(density);
  
  // Obtener el calculador de aspect ratio
  const { calculateRowsFromColumns } = useAspectRatioCalculator();
  
  // Calcular filas y columnas basadas en la densidad y el aspect ratio
  useEffect(() => {
    if (isDragging) return; // No recalcular durante el arrastre
    
    // Evitar recálculos innecesarios
    const rows = Math.max(MIN_DENSITY, Math.round(density));
    
    // Solo proceder si la densidad ha cambiado significativamente
    if (gridSettings?.density === density && 
        gridSettings.rows === rows && 
        gridSettings.userDefined) {
      return;
    }
    
    let cols: number;
    
    // Calcular columnas basadas en el aspect ratio
    if (aspectRatio === '1:1') {
      cols = rows;
    } else if (aspectRatio === '2:1') {
      cols = rows * 2;
    } else if (aspectRatio === '16:9') {
      cols = Math.round(rows * (16/9));
    } else if (aspectRatio === 'custom' && customRatio) {
      const ratio = customRatio.width / customRatio.height;
      cols = Math.round(rows * ratio);
    } else {
      // Para 'auto' u otros casos, mantener la relación actual o usar un valor razonable
      cols = gridSettings?.cols ? 
        Math.round(rows * (gridSettings.cols / Math.max(1, gridSettings.rows || 1))) : 
        Math.round(rows * 1.5);
    }
    
    // Asegurarnos de tener valores mínimos razonables
    const newCols = Math.max(MIN_DENSITY, cols);
    
    // Crear el nuevo estado del grid
    const newSettings = {
      ...gridSettings,
      rows,
      cols: newCols,
      density,
      userDefined: true // Marcar como definido por el usuario
    };
    
    // Notificar cambio de densidad si hay callback
    if (onDensityChange) {
      onDensityChange(density);
    }
    
    // Usar requestAnimationFrame para evitar actualizaciones síncronas
    requestAnimationFrame(() => {
      onChange(newSettings);
    });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, aspectRatio, customRatio, isDragging]);
  
  // No necesitamos un efecto separado para aspectRatio/customRatio
  // ya que el primer useEffect ya maneja estos cambios
  
  // Formatear el valor de densidad para mostrar
  const formatDensity = (value: number) => {
    return `${Math.round(value)}`;
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label htmlFor="density-slider" className="font-medium">
                Densidad
              </Label>
              <p className="text-xs text-muted-foreground">
                Ajusta vectores manteniendo proporción {aspectRatio}
              </p>
              <p className="text-xs text-muted-foreground">
                Filas: {gridSettings?.rows || '-'} | Columnas: {gridSettings?.cols || '-'}
              </p>
            </div>
            <div className="text-sm font-mono">
              {isDragging ? formatDensity(localDensity) : formatDensity(density)}
            </div>
          </div>
          
          <Slider
            id="density-slider"
            min={MIN_DENSITY}
            max={MAX_DENSITY}
            step={1}
            value={[isDragging ? localDensity : density]}
            onValueChange={(values) => {
              const newValue = values[0];
              setLocalDensity(newValue);
              if (!isDragging) {
                setDensity(newValue);
              }
            }}
            onValueCommit={(values) => {
              const newValue = values[0];
              setDensity(newValue);
              setIsDragging(false);
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            aria-label="Ajustar densidad de vectores"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Menor</span>
            <span>Mayor</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
