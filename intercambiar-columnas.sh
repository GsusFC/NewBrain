#!/bin/bash
# Script para intercambiar las columnas en page.tsx

# Hacer una copia de seguridad
cp src/app/page.tsx src/app/page.tsx.bak

# Extraer contenido del archivo
CONTENIDO=$(cat src/app/page.tsx)

# Crear archivo temporal
cat > temp-page.tsx << 'EOL'
'use client';

import React, { useRef, useCallback, useState } from 'react';
import { VectorGrid } from '@/components/vector/VectorGrid';
import { useContainerDimensions } from '@/hooks/vector/useContainerDimensions';
import { AnimationType } from '@/components/vector/core/animations/animationTypes';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeftPanel } from '@/components/vector/LeftPanel';
import { SwitchControl } from '@/components/vector/controls/VectorControlComponents';
import type { VectorShape, VectorColorValue, AnimationSettings } from '@/components/vector/core/types';

/**
 * Página para VectorGrid con diseño de tres columnas a pantalla completa
 */
export default function VectorTestBasicPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerDimensions(containerRef);
  
  // Estados para controles básicos
  const [renderAsCanvas, setRenderAsCanvas] = useState(true);
  const [useDynamicProps, setUseDynamicProps] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  // Estado para la configuración del grid
  const [gridConfig, setGridConfig] = useState({
    rows: 15,
    cols: 15,
    spacing: 40,
    margin: 20
  });

  // Estado para el estilo de los vectores
  const [vectorStyle, setVectorStyle] = useState({
    vectorShape: 'arrow' as VectorShape,
    staticLength: 25,
    staticWidth: 3,
    color: 'white' as VectorColorValue,
    rotationOrigin: 'center' as 'center' | 'start' | 'end',
    strokeLinecap: 'round' as 'round' | 'butt' | 'square',
  });

  // Estados para las animaciones
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings & {animationType: AnimationType}>({
    animationType: 'none',
    animationProps: {},
    isPaused: false,
    easingFactor: 0.1,
    timeScale: 1,
    dynamicLengthEnabled: false,
    dynamicWidthEnabled: false,
    dynamicIntensity: 1,
  });
  
  // Manejador para cuando se completa un pulso individual
  const handlePulseComplete = useCallback(() => {
    // Implementación futura si es necesario
  }, []);
  
  // Manejar cambios en la configuración de animación
  const handleAnimationChange = useCallback((newSettings: any) => {
    setAnimationSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Manejar cambios en los controles de grid
  const handleGridConfigChange = (key: keyof typeof gridConfig, value: number) => {
    setGridConfig({ ...gridConfig, [key]: value });
  };

  // Manejar cambios en el estilo del vector
  const handleVectorStyleChange = (key: keyof typeof vectorStyle, value: any) => {
    setVectorStyle({ ...vectorStyle, [key]: value });
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background dark:bg-[#1e1e2d]">
      {/* Panel izquierdo con animaciones (antes estaba a la derecha) */}
      {showLeftPanel && (
        <div className="w-64 border-r border-border bg-muted p-4 overflow-y-auto">
          <LeftPanel 
            animationSettings={animationSettings}
            onAnimationChange={handleAnimationChange}
          />
        </div>
      )}

      {/* Área principal con el VectorGrid (en el centro) */}
      <div className="flex-1 flex items-center justify-center bg-background dark:bg-[#1e1e2d] p-4">
        <div 
          ref={containerRef}
          className="w-full h-full relative bg-background dark:bg-[#1e1e2d] overflow-hidden flex items-center justify-center"
        >
          <VectorGrid
            renderAsCanvas={renderAsCanvas}
            backgroundColor="#1e1e2d" 
            gridSettings={{
              rows: gridConfig.rows,
              cols: gridConfig.cols,
              spacing: gridConfig.spacing,
              margin: gridConfig.margin,
            }}
            vectorSettings={{
              vectorShape: vectorStyle.vectorShape,
              vectorLength: vectorStyle.staticLength,
              vectorWidth: vectorStyle.staticWidth,
              vectorColor: vectorStyle.color,
              rotationOrigin: vectorStyle.rotationOrigin,
              strokeLinecap: vectorStyle.strokeLinecap
            }}
            animationType={animationSettings.animationType}
            animationProps={animationSettings.animationProps}
            easingFactor={animationSettings.easingFactor}
            timeScale={animationSettings.timeScale}
            dynamicLengthEnabled={animationSettings.dynamicLengthEnabled}
            dynamicWidthEnabled={animationSettings.dynamicWidthEnabled}
            dynamicIntensity={animationSettings.dynamicIntensity}
            isPaused={animationSettings.isPaused}
            onPulseComplete={handlePulseComplete}
            width={dimensions.width}
            height={dimensions.height}
            containerFluid={true}
          />
        </div>
      </div>
      
      {/* Panel derecho con controles generales (antes estaba a la izquierda) */}
      <div className="w-64 border-l border-border bg-muted p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Controles Generales</h3>
          <SwitchControl 
            label="Canvas" 
            onCheckedChange={setRenderAsCanvas}
            checked={renderAsCanvas}
          />
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-medium opacity-70">Grid</h4>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="rows" className="text-xs">Filas: {gridConfig.rows}</Label>
              </div>
              <Slider
                id="rows"
                min={5}
                max={30}
                step={1}
                value={[gridConfig.rows]}
                onValueChange={(value) => handleGridConfigChange('rows', value[0])}
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="cols" className="text-xs">Columnas: {gridConfig.cols}</Label>
              </div>
              <Slider
                id="cols"
                min={5}
                max={30}
                step={1}
                value={[gridConfig.cols]}
                onValueChange={(value) => handleGridConfigChange('cols', value[0])}
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="spacing" className="text-xs">Espaciado: {gridConfig.spacing}px</Label>
              </div>
              <Slider
                id="spacing"
                min={10}
                max={100}
                step={1}
                value={[gridConfig.spacing]}
                onValueChange={(value) => handleGridConfigChange('spacing', value[0])}
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="margin" className="text-xs">Margen: {gridConfig.margin}px</Label>
              </div>
              <Slider
                id="margin"
                min={0}
                max={50}
                step={1}
                value={[gridConfig.margin]}
                onValueChange={(value) => handleGridConfigChange('margin', value[0])}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-medium opacity-70">Estilo de Vector</h4>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vectorShape" className="text-xs">Forma</Label>
              <Select
                value={vectorStyle.vectorShape}
                onValueChange={(value: VectorShape) => handleVectorStyleChange('vectorShape', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Línea</SelectItem>
                  <SelectItem value="arrow">Flecha</SelectItem>
                  <SelectItem value="dot">Punto</SelectItem>
                  <SelectItem value="triangle">Triángulo</SelectItem>
                  <SelectItem value="semicircle">Semicírculo</SelectItem>
                  <SelectItem value="curve">Curva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="staticLength" className="text-xs">Longitud: {vectorStyle.staticLength}px</Label>
              </div>
              <Slider
                id="staticLength"
                min={5}
                max={50}
                step={1}
                value={[vectorStyle.staticLength]}
                onValueChange={(value) => handleVectorStyleChange('staticLength', value[0])}
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="staticWidth" className="text-xs">Grosor: {vectorStyle.staticWidth}px</Label>
              </div>
              <Slider
                id="staticWidth"
                min={1}
                max={10}
                step={0.5}
                value={[vectorStyle.staticWidth]}
                onValueChange={(value) => handleVectorStyleChange('staticWidth', value[0])}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="rotationOrigin" className="text-xs">Origen de Rotación</Label>
              <Select
                value={vectorStyle.rotationOrigin}
                onValueChange={(value: 'start' | 'center' | 'end') => handleVectorStyleChange('rotationOrigin', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Inicio</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="end">Fin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
EOL

# Reemplazar el archivo original
mv temp-page.tsx src/app/page.tsx

echo "Columnas intercambiadas correctamente"
