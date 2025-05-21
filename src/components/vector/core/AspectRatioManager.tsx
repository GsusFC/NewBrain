"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SliderWithInput } from "@/components/ui/slider-with-input";
import { AspectRatioOption, GridSettings, Mode } from "./types";
import { useAspectRatioCalculator } from "@/hooks/vector/useAspectRatioCalculator";
import { cn } from "@/lib/utils";

interface AspectRatioManagerProps {
  initialAspectRatio: AspectRatioOption;
  initialGridSettings: GridSettings;
  customAspectRatio?: { width: number; height: number };
  containerWidth: number;
  containerHeight: number;
  onConfigChange: (config: {
    aspectRatio: AspectRatioOption;
    gridSettings: GridSettings;
    customAspectRatio?: { width: number; height: number };
  }) => void;
  disabled?: boolean;
}

/**
 * Componente que gestiona la relación entre el aspect ratio y la configuración
 * de la cuadrícula, ofreciendo dos modos de operación: fijar aspect ratio o
 * fijar configuración de cuadrícula.
 */
export function AspectRatioManager({
  initialAspectRatio,
  initialGridSettings,
  customAspectRatio = { width: 16, height: 9 },
  containerWidth,
  containerHeight,
  onConfigChange,
  disabled = false,
}: AspectRatioManagerProps) {
  // Estado para controlar el modo de funcionamiento
  const [mode, setMode] = useState<Mode>('aspect-fixed');

  // Estados para configuración
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(initialAspectRatio);
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    rows: Math.max(1, initialGridSettings.rows ?? 1),
    cols: Math.max(1, initialGridSettings.cols ?? 1),
    spacing: initialGridSettings.spacing ?? 30,
    margin: initialGridSettings.margin ?? 20,
    vectorsPerFlock: initialGridSettings.vectorsPerFlock,
    userSvg: initialGridSettings.userSvg,
    userSvgPreserveAspectRatio: initialGridSettings.userSvgPreserveAspectRatio,
  });
  
  const [localCustomRatio, setLocalCustomRatio] = useState<{ width: number; height: number }>(
    customAspectRatio || { width: 16, height: 9 }
  );

  // Estado para panel de ratio personalizado
  const [customPanelOpen, setCustomPanelOpen] = useState(false);

  // Obtener las funciones de cálculo
  const { calculateOptimalGrid, detectAspectRatioFromGrid } =
    useAspectRatioCalculator();

  // Memorizar los parámetros para el cálculo de la cuadrícula óptima
  const calculationParams = React.useMemo(
    () => ({
      containerWidth,
      containerHeight,
      spacing: gridSettings.spacing || 30,
      margin: gridSettings.margin || 20,
    }),
    [
      containerWidth,
      containerHeight,
      gridSettings.spacing,
      gridSettings.margin,
    ],
  );

  // Calcular el máximo de filas/columnas basado en el tamaño del contenedor
  const { maxRows, maxCols } = useMemo(() => {
    // Incluir el espaciado y 2px para bordes en el cálculo del tamaño mínimo de celda
    const minCellSize = (gridSettings.spacing ?? 30) + 2;
    return {
      maxRows: Math.max(1, Math.floor(containerHeight / minCellSize)),
      maxCols: Math.max(1, Math.floor(containerWidth / minCellSize))
    };
  }, [containerWidth, containerHeight, gridSettings.spacing]);

  // Memoizar la llamada a onConfigChange para reducir recreaciones
  const updateConfig = useCallback(
    (newConfig: {
      aspectRatio: AspectRatioOption;
      gridSettings: GridSettings;
      customAspectRatio?: { width: number; height: number };
    }) => {
      // Verificar si hay cambios reales antes de llamar a onConfigChange
      const aspectRatioChanged = newConfig.aspectRatio !== aspectRatio;
      const gridChanged =
        newConfig.gridSettings.rows !== gridSettings.rows ||
        newConfig.gridSettings.cols !== gridSettings.cols ||
        newConfig.gridSettings.spacing !== gridSettings.spacing ||
        newConfig.gridSettings.margin !== gridSettings.margin;
      
      const customAspectRatioChanged = 
        newConfig.customAspectRatio && 
        (newConfig.customAspectRatio.width !== localCustomRatio.width ||
         newConfig.customAspectRatio.height !== localCustomRatio.height);

      // Solo notificar si hay cambios reales
      if (aspectRatioChanged || gridChanged || customAspectRatioChanged) {
        onConfigChange(newConfig);
      }
    },
    [onConfigChange, aspectRatio, gridSettings, localCustomRatio],
  );

  // Cuando cambia el modo, recalcular según corresponda
  useEffect(() => {
    if (disabled) return;

    if (mode === "aspect-fixed") {
      // En modo aspect ratio fijo, recalcular la cuadrícula óptima
      const optimalGrid = calculateOptimalGrid(
        aspectRatio as import('../controls/grid/types').AspectRatioOption,
        aspectRatio === "custom" ? localCustomRatio : undefined,
        calculationParams,
      );

      // Si la cuadrícula cambió, notificar
      if (
        optimalGrid.rows !== gridSettings.rows ||
        optimalGrid.cols !== gridSettings.cols
      ) {
        setGridSettings(optimalGrid);

        // Usar la función memoizada
        updateConfig({
          aspectRatio,
          gridSettings: optimalGrid,
          customAspectRatio:
            aspectRatio === "custom" ? localCustomRatio : undefined,
        });
      }
  
} else if (mode === 'manual') {
  // En modo cuadrícula fija …
      const { aspectRatio: detectedRatio } =
        detectAspectRatioFromGrid(gridSettings);

      // Si el ratio detectado es diferente, actualizar
      if (detectedRatio !== aspectRatio) {
        setAspectRatio(detectedRatio);

        // Usar la función memoizada
        updateConfig({
          aspectRatio: detectedRatio,
          gridSettings,
          customAspectRatio:
            detectedRatio === "custom" ? localCustomRatio : undefined,
        });
      }
    }
  }, [
    mode,
    disabled,
    aspectRatio,
    localCustomRatio,
    calculationParams, // Usar el objeto memoizado en lugar de valores individuales
  gridSettings, // sufficient – remove the primitives
    calculateOptimalGrid,
    detectAspectRatioFromGrid,
    updateConfig, // Usar la función memoizada
  ]);

  // Cuando cambien las dimensiones del contenedor, recalcular en modo aspect-fixed
  useEffect(() => {
    if (disabled || mode !== "aspect-fixed") return;

    // Usar el objeto calculationParams ya memoizado
    const optimalGrid = calculateOptimalGrid(
      aspectRatio,
      aspectRatio === "custom" ? localCustomRatio : undefined,
      calculationParams,
    );

    // Verificar si realmente hay cambios antes de actualizar
    const hasChanged =
      optimalGrid.rows !== gridSettings.rows ||
      optimalGrid.cols !== gridSettings.cols;

    if (hasChanged) {
      setGridSettings(optimalGrid);
      // Usar la función memoizada que ya incluye comprobación de cambios
      updateConfig({
        aspectRatio,
        gridSettings: optimalGrid,
        customAspectRatio:
          aspectRatio === "custom" ? localCustomRatio : undefined,
      });
    }
  }, [
    disabled,
    mode,
    aspectRatio,
    localCustomRatio,
    // Usar dependencias estables
    calculationParams,
    gridSettings.rows,
    gridSettings.cols,
    calculateOptimalGrid,
    updateConfig,
  ]);

  // Manejador para cambio de aspect ratio
  const handleAspectRatioChange = useCallback(
    (newRatio: AspectRatioOption) => {
      if (disabled) return;

      setAspectRatio(newRatio);
      setMode("aspect-fixed");

      // Calcular la grid óptima para este ratio
      const optimalGrid = calculateOptimalGrid(
        newRatio,
        newRatio === "custom" ? localCustomRatio : undefined,
        {
          containerWidth,
          containerHeight,
          spacing: gridSettings.spacing || 30,
          margin: gridSettings.margin || 20,
        },
      );

      setGridSettings(optimalGrid);
      onConfigChange({
        aspectRatio: newRatio,
        gridSettings: optimalGrid,
        customAspectRatio: newRatio === "custom" ? localCustomRatio : undefined,
      });

      // Cerrar panel custom si no se seleccionó custom
      if (newRatio !== "custom") {
        setCustomPanelOpen(false);
      }
    },
    [
      containerWidth,
      containerHeight,
      gridSettings.spacing,
      gridSettings.margin,
      localCustomRatio,
      disabled,
      calculateOptimalGrid,
      onConfigChange,
    ],
  );

  // Manejador para cambio de configuración de cuadrícula
  const handleGridSettingsChange = useCallback(
    (newSettings: Partial<GridSettings>) => {
      if (disabled) return;

      const updatedSettings = {
        ...gridSettings,
        ...newSettings,
      };

      setGridSettings(updatedSettings);
      setMode("manual");

      // Detectar el aspect ratio más cercano
      const { aspectRatio: detectedRatio } =
        detectAspectRatioFromGrid(updatedSettings);

      setAspectRatio(detectedRatio);
      onConfigChange({
        aspectRatio: detectedRatio,
        gridSettings: updatedSettings,
        customAspectRatio:
          detectedRatio === "custom" ? localCustomRatio : undefined,
      });
    },
    [
      gridSettings,
      localCustomRatio,
      disabled,
      detectAspectRatioFromGrid,
      onConfigChange,
    ],
  );

  // Manejador para cambio de ratio personalizado
  const handleCustomRatioChange = useCallback(
    (newCustomRatio: { width: number; height: number }) => {
      if (disabled) return;

      setLocalCustomRatio(newCustomRatio);

      if (aspectRatio === "custom" && mode === "aspect-fixed") {
        // Recalcular grid si actualmente estamos en modo custom
        const optimalGrid = calculateOptimalGrid("custom", newCustomRatio, {
          containerWidth,
          containerHeight,
          spacing: gridSettings.spacing || 30,
          margin: gridSettings.margin || 20,
        });

        setGridSettings(optimalGrid);
        onConfigChange({
          aspectRatio: "custom",
          gridSettings: optimalGrid,
          customAspectRatio: newCustomRatio,
        });
      }
    },
    [
      aspectRatio,
      mode,
      containerWidth,
      containerHeight,
      gridSettings,
      disabled,
      calculateOptimalGrid,
      onConfigChange,
    ],
  );

      {/* Controles según el modo */}
      {mode === "aspect-fixed" ? (
        <div className="aspect-ratio-controls">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md bg-slate-700 p-0.5">
              {/* No incluimos el botón 'auto' pues no tiene utilidad */}

              {/* 1:1 */}
              <button
                type="button"
                onClick={() => handleAspectRatioChange("1:1")}
                className={cn(
                  "px-2.5 py-1 text-xs transition-all w-10 flex items-center justify-center",
                  aspectRatio === "1:1"
                    ? "bg-slate-600 text-white rounded-sm shadow-sm"
                    : "text-slate-300 hover:text-white",
                )}
                disabled={disabled}
              >
                1:1
              </button>

              {/* 2:1 */}
              <button
                type="button"
                onClick={() => handleAspectRatioChange("2:1")}
                className={cn(
                  "px-2.5 py-1 text-xs transition-all w-10 flex items-center justify-center",
                  aspectRatio === "2:1"
                    ? "bg-slate-600 text-white rounded-sm shadow-sm"
                    : "text-slate-300 hover:text-white",
                )}
                disabled={disabled}
              >
                2:1
              </button>

              {/* 16:9 */}
              <button
                type="button"
                onClick={() => handleAspectRatioChange("16:9")}
                className={cn(
                  "px-2.5 py-1 text-xs transition-all w-10 flex items-center justify-center",
                  aspectRatio === "16:9"
                    ? "bg-slate-600 text-white rounded-sm shadow-sm"
                    : "text-slate-300 hover:text-white",
                )}
                disabled={disabled}
              >
                16:9
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => {
                  handleAspectRatioChange("custom");
                  setCustomPanelOpen((prev) => !prev);
                }}
                className={cn(
                  "px-2.5 py-1 text-xs transition-all",
                  aspectRatio === "custom"
                    ? "bg-slate-600 text-white rounded-sm shadow-sm"
                    : "text-slate-300 hover:text-white",
                )}
                disabled={disabled}
              >
                Custom
              </button>
            </div>

            {/* Mostrar el ratio actual cuando es custom */}
            {aspectRatio === "custom" && (
              <span className="text-xs text-slate-300 ml-1">
                {localCustomRatio.width}:{localCustomRatio.height}
              </span>
            )}
          </div>

          {/* Panel para custom ratio */}
          {customPanelOpen && (
            <div className="custom-ratio-panel mt-2 p-2 bg-slate-800 rounded-md">
              <div className="flex items-center gap-2">
                <SliderWithInput
                  min={1}
                  max={maxCols}
                  step={1}
                  precision={0}
                  value={[Math.min(localCustomRatio.width, maxCols)]}
                  onValueChange={(value) => {
                    const width = Math.max(1, Math.min(value[0] || 1, maxCols));
                    handleCustomRatioChange({ ...localCustomRatio, width });
                  }}
                  className="w-24"
                  inputClassName="w-16 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                  disabled={disabled}
                  aria-label="Ancho del ratio personalizado"
                />
                <span className="text-xs text-slate-300">:</span>
                <SliderWithInput
                  min={1}
                  max={maxRows}
                  step={1}
                  precision={0}
                  value={[Math.min(localCustomRatio.height, maxRows)]}
                  onValueChange={(value) => {
                    const height = Math.max(1, Math.min(value[0] || 1, maxRows));
                    handleCustomRatioChange({ ...localCustomRatio, height });
                  }}
                  className="w-24"
                  inputClassName="w-16 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                  disabled={disabled}
                  aria-label="Alto del ratio personalizado"
                />

                <button
                  type="button"
                  onClick={() => handleCustomRatioChange(localCustomRatio)}
                  className="ml-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-sm"
                  disabled={disabled}
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {/* Información de la cuadrícula */}
          <div className="grid-info mt-3">
            {aspectRatio === "1:1" || aspectRatio === "2:1" || aspectRatio === "16:9" ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Cuadrícula resultante:</span>
                <span className="font-medium">{gridSettings.rows} × {gridSettings.cols}</span>
                <span>celdas</span>
              </div>
            ) : (
              // Caso para 'custom'
              <div className="grid-info mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Cuadrícula resultante:</span>
                  <span className="font-medium">
                    {gridSettings.rows} × {gridSettings.cols}
                  </span>
                  <span>celdas</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-controls">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 w-16">
                Filas:
              </span>
              <SliderWithInput
                min={1}
                max={maxRows}
                step={1}
                precision={0}
                value={[gridSettings.rows]}
                onValueChange={(value) => {
                  const rows = Math.max(1, value[0] ?? 1);
                  handleGridSettingsChange({ rows });
                }}
                className="w-32"
                inputClassName="w-20 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                disabled={disabled}
                aria-valuemin={1}
                aria-valuemax={maxRows}
                aria-valuenow={gridSettings.rows}
                aria-label="Número de filas"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 w-16">
                Columnas:
              </span>
              <SliderWithInput
                min={1}
                max={maxCols}
                step={1}
                precision={0}
                value={[gridSettings.cols]}
                onValueChange={(value) => {
                  const cols = Math.max(1, value[0] ?? 1);
                  handleGridSettingsChange({ cols });
                }}
                className="w-32"
                inputClassName="w-20 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                disabled={disabled}
                aria-valuemin={1}
                aria-valuemax={maxCols}
                aria-valuenow={gridSettings.cols}
                aria-label="Número de columnas"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 w-16">
                Espaciado:
              </span>
              <SliderWithInput
                min={1}
                max={100}
                step={1}
                precision={0}
                value={[gridSettings.spacing || 30]}
                onValueChange={(value) => {
                  const spacing = Math.max(1, value[0] || 30);
                  handleGridSettingsChange({ spacing });
                }}
                className="w-32"
                inputClassName="w-20 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                disabled={disabled}
              />
              <span className="text-xs text-slate-400">px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 w-16">
                Margen:
              </span>
              <SliderWithInput
                min={0}
                max={100}
                step={1}
                precision={0}
                value={[gridSettings.margin || 20]}
                onValueChange={(value) => {
                  const margin = Math.max(0, value[0] || 20);
                  handleGridSettingsChange({ margin });
                }}
                className="w-32"
                inputClassName="w-20 bg-slate-700 border border-slate-600 rounded-sm px-2 py-1 text-xs text-white"
                disabled={disabled}
              />
              <span className="text-xs text-slate-400">px</span>
            </div>
          </div>

          {/* Muestra el aspect ratio detectado */}
          <div className="aspect-ratio-info mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Aspect ratio resultante:</span>
              <span className="font-medium">
                {aspectRatio === "custom"
                  ? `${localCustomRatio.width}:${localCustomRatio.height}`
                  : aspectRatio}
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
