"use client";

import React, { useState, useEffect } from 'react';
import { SliderWithInput } from "@/components/ui/slider-with-input";
import { Label } from '@/components/ui/label';
import { Separator } from "@/components/ui/separator";
import { AspectRatioOption, GridSettings } from '../../core/types';
import { cn } from "@/lib/utils";
import { useAspectRatioCalculator } from '@/hooks/vector/useAspectRatioCalculator';

interface DensityModeControlProps {
  aspectRatio: AspectRatioOption;
  gridSettings: GridSettings;
  customRatio?: { width: number; height: number };
  onGridSettingsChange: (settings: Partial<GridSettings>) => void;
  onAspectRatioChange?: (newAspectRatio: AspectRatioOption, customRatio?: { width: number; height: number }) => void;
  disabled?: boolean;
}

/**
 * Componente integrado para el modo "Densidad" que permite:
 * 1. Seleccionar el aspect ratio deseado
 * 2. Ajustar la densidad (filas) mientras se mantiene el aspect ratio seleccionado
 */
export function DensityModeControl({
  aspectRatio,
  gridSettings,
  customRatio = { width: 16, height: 9 },
  onGridSettingsChange,
  onAspectRatioChange,
  disabled = false
}: DensityModeControlProps) {
  // Obtener las funciones de cálculo de aspect ratio
  const { calculateOptimalGrid } = useAspectRatioCalculator();
  
  // Estado para el panel de ratio personalizado
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  // Estado local para el ratio personalizado
  const [localCustomRatio, setLocalCustomRatio] = useState(customRatio);

  // Inicializar panel si el ratio es custom cuando el componente se monta
  useEffect(() => {
    if (aspectRatio === 'custom') {
      setShowCustomPanel(true);
    }
  }, [aspectRatio]);

  // Manejador para cambios en el aspect ratio
  const handleAspectRatioChange = (newRatio: AspectRatioOption) => {
    if (newRatio === 'custom') {
      setShowCustomPanel(true);
    } else {
      setShowCustomPanel(false);
    }
    
    // Solo invocar si está definido
    if (onAspectRatioChange) {
      onAspectRatioChange(newRatio);
    }
  };

  // Manejador para cambios en el ratio personalizado
  const handleCustomRatioChange = (dimension: 'width' | 'height', value: number) => {
    const newCustomRatio = {
      ...localCustomRatio,
      [dimension]: value
    };
    setLocalCustomRatio(newCustomRatio);
    
    // Solo invocar si está definido
    if (onAspectRatioChange) {
      onAspectRatioChange('custom', newCustomRatio);
    }
  };

  return (
    <div className="density-controls space-y-4">
      {/* Selector de Aspect Ratio - Sin título para coherencia */}
      <div className="aspect-ratio-selector">
        <div className="grid grid-cols-4 gap-2">
          <button
            className={`px-3 py-2 text-xs rounded-sm ${
              aspectRatio === "1:1" ? "bg-slate-700 text-white" : "bg-slate-800 text-muted-foreground hover:text-white"
            }`}
            onClick={() => handleAspectRatioChange("1:1")}
          >
            1:1
          </button>
          <button
            className={`px-3 py-2 text-xs rounded-sm ${
              aspectRatio === "2:1" ? "bg-slate-700 text-white" : "bg-slate-800 text-muted-foreground hover:text-white"
            }`}
            onClick={() => handleAspectRatioChange("2:1")}
          >
            2:1
          </button>
          <button
            className={`px-3 py-2 text-xs rounded-sm ${
              aspectRatio === "16:9" ? "bg-slate-700 text-white" : "bg-slate-800 text-muted-foreground hover:text-white"
            }`}
            onClick={() => handleAspectRatioChange("16:9")}
          >
            16:9
          </button>
          <button
            className={`px-3 py-2 text-xs rounded-sm ${
              aspectRatio === "custom" ? "bg-slate-700 text-white" : "bg-slate-800 text-muted-foreground hover:text-white"
            }`}
            onClick={() => handleAspectRatioChange("custom")}
          >
            Custom
          </button>
        </div>

        {/* Panel de configuración de ratio personalizado */}
        {showCustomPanel && (
          <div className={cn(
            "custom-aspect-ratio-panel p-2 mt-2 border border-border rounded-md bg-slate-800/50 mb-4",
            aspectRatio !== 'custom' && "hidden"
          )}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ancho</Label>
                <SliderWithInput
                  min={1}
                  max={32}
                  step={1}
                  precision={0}
                  value={[localCustomRatio.width]}
                  onValueChange={(values) => handleCustomRatioChange('width', values[0])}
                  className="mt-1"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className="text-xs">Alto</Label>
                <SliderWithInput
                  min={1}
                  max={32}
                  step={1}
                  precision={0}
                  value={[localCustomRatio.height]}
                  onValueChange={(values) => handleCustomRatioChange('height', values[0])}
                  className="mt-1"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Control de densidad (filas) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16">
            Filas:
          </span>
          <SliderWithInput
            min={1}
            max={100}
            step={1}
            precision={0}
            value={[gridSettings.rows || 10]}
            onValueChange={(value) => {
              const rows = Math.max(1, value[0] || 1);
              
              // Calcular nuevas columnas manteniendo exactamente el aspect ratio
              const calculatedGrid = calculateOptimalGrid(
                aspectRatio, // AspectRatioOption ya es el tipo correcto
                aspectRatio === 'custom' ? localCustomRatio : undefined,
                {
                  containerWidth: 800, // Valores de referencia
                  containerHeight: 600,
                  spacing: gridSettings.spacing || 30,
                  margin: gridSettings.margin || 20,
                  density: rows // Pasar las filas como densidad para mantener el ratio
                }
              );
              
              // Actualizar tanto filas como columnas calculadas para mantener el ratio
              onGridSettingsChange({
                rows,
                cols: calculatedGrid.cols // Usar el valor calculado que mantiene el ratio
              });
            }}
            className="w-full"
            disabled={disabled}
          />
        </div>

        {/* Columnas calculadas automáticamente */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16">
            Columnas:
          </span>
          <div className="flex items-center h-8 px-2 bg-slate-700/50 rounded-sm border border-border text-xs text-muted-foreground">
            <span className="font-medium">{gridSettings.cols || 0}</span>
            <span className="ml-1 text-muted-foreground">(calculadas)</span>
          </div>
        </div>

        {/* Información de celdas y dimensiones */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-sm">
            <span className="text-[10px] text-muted-foreground">Grid:</span>
            <span className="text-xs font-medium">
              {gridSettings.rows || 0} × {gridSettings.cols || 0}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-sm">
            <span className="text-[10px] text-muted-foreground">Ratio:</span>
            <span className="text-xs font-medium">
              {aspectRatio === "custom"
                ? `${localCustomRatio.width}:${localCustomRatio.height}`
                : aspectRatio}
            </span>
          </div>
        </div>
      </div>

      {/* Espaciado y márgenes - sin título para coherencia con Ratio Fijo */}
      <Separator className="my-4" />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="densitySpacingSlider" className="text-sm font-medium">Espaciado</Label>
          <SliderWithInput
            id="densitySpacingSlider"
            value={[gridSettings.spacing || 30]}
            min={5}
            max={150}
            step={1}
            precision={0}
            onValueChange={(values) => onGridSettingsChange({ spacing: values[0] })}
            className="mt-1"
            disabled={disabled}
          />
        </div>
        
        <div>
          <Label htmlFor="densityMarginSlider" className="text-sm font-medium">Margen</Label>
          <SliderWithInput
            id="densityMarginSlider"
            value={[gridSettings.margin || 0]}
            min={0}
            max={300}
            step={1}
            precision={0}
            onValueChange={(values) => onGridSettingsChange({ margin: values[0] })}
            className="mt-1"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
