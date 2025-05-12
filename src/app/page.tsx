'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { VectorGrid } from '@/components/vector/VectorGrid';
import { useContainerDimensions } from '@/hooks/vector/useContainerDimensions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { SliderControl } from '@/components/vector/controls/VectorControlComponents';
import { ColorControl } from '@/components/vector/controls/ColorControl';
import type { AnimatedVectorItem, VectorShape, VectorColorValue } from '@/components/vector/core/types';

/**
 * Página de prueba básica para VectorGrid
 * Ahora adaptada para usar Tailwind y shadcn/ui
 */
export default function VectorTestBasicPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useContainerDimensions(containerRef);
  
  // Estados para controles básicos
  const [renderAsCanvas, setRenderAsCanvas] = useState(true);
  const [useDynamicProps, setUseDynamicProps] = useState(false);
  
  // Estado para la configuración del grid
  const [gridConfig, setGridConfig] = useState({
    rows: 10,
    cols: 15,
    spacing: 45,
    margin: 50,
  });
  
  // Estado para estilos de vectores
  const [vectorStyle, setVectorStyle] = useState({
    color: "#4a80f5" as VectorColorValue, // Puede ser string, función o GradientConfig
    strokeLinecap: "round" as "round" | "butt" | "square",
    vectorShape: "line" as VectorShape,
    staticLength: 30,
    staticWidth: 2.5,
    rotationOrigin: "center" as "center" | "end" | "start"
  });
  
  // Estado para configuración de animación
  const [animationConfig, setAnimationConfig] = useState({
    type: "smoothWaves" as "smoothWaves",
    waveFrequency: 0.001,
    waveAmplitude: 20,
    baseAngle: 0,
    patternScale: 0.015,
    waveType: 'diagonal' as 'diagonal' | 'horizontal' | 'vertical' | 'radial',
  });
  
  // Tiempo global para animaciones (se actualiza con requestAnimationFrame)
  const [timestamp, setTimestamp] = useState(0);
  
  // Actualizar timestamp para animaciones
  useEffect(() => {
    let animationFrameId: number;
    
    const updateTimestamp = () => {
      setTimestamp(Date.now());
      animationFrameId = requestAnimationFrame(updateTimestamp);
    };
    
    animationFrameId = requestAnimationFrame(updateTimestamp);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  // Función dinámica para longitud de vectores
  const dynamicLength = useCallback((item: AnimatedVectorItem) => {
    // Base fija
    const baseLength = 40;
    
    if (!useDynamicProps) return baseLength;
    
    // Cálculo dinámico basado en la posición X y el tiempo
    const xFactor = Math.sin(item.baseX / 100 + timestamp / 2000) * 0.5 + 1; // Entre 0.5 y 1.5
    
    // Efecto de "respiración" global
    const breatheFactor = Math.sin(timestamp / 1000) * 0.2 + 1; // Entre 0.8 y 1.2
    
    return baseLength * xFactor * breatheFactor;
  }, [useDynamicProps, timestamp]);
  
  // Función dinámica para grosor de vectores
  const dynamicWidth = useCallback((item: AnimatedVectorItem) => {
    // Base fija
    const baseWidth = 2.5;
    
    if (!useDynamicProps) return baseWidth;
    
    // Asegurarse que item tenga un ángulo válido
    const currentAngle = item.currentAngle || 0;
    
    // Normalización para aplicar variaciones
    const angleNormalized = (currentAngle % 360) / 360; // 0-1
    
    // Variación de grosor basada en el ángulo actual
    const angleFactor = Math.abs(Math.sin(angleNormalized * Math.PI * 2)) * 0.7 + 0.8; // Entre 0.8 y 1.5
    
    // Variación adicional basada en la posición Y
    const yFactor = (item.baseY % 100) / 100 * 0.4 + 0.8; // Entre 0.8 y 1.2
    
    return baseWidth * angleFactor * yFactor;
  }, [useDynamicProps]);
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* COLUMNA IZQUIERDA: Selector de animaciones */}
      <div className="w-64 border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-2">Animaciones</h2>
          <p className="text-xs text-muted-foreground">Selecciona un tipo de animación para aplicar al grid de vectores.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
              Ondas Suaves
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
              Radial Pulse
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
              Horizontal Waves
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
              Vertical Waves
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
              Aleatorio
            </Button>
          </div>
        </div>
      </div>
      
      {/* COLUMNA CENTRAL: Visualizador */}
      <div className="flex-1 flex flex-col h-full">
        {/* Menú superior */}
        <div className="flex items-center border-b border-border p-4 gap-4">
          <div className="flex space-x-1">
            <Button 
              variant={renderAsCanvas ? "default" : "outline"}
              size="sm"
              onClick={() => setRenderAsCanvas(true)}
            >
              Canvas
            </Button>
            <Button 
              variant={!renderAsCanvas ? "default" : "outline"}
              size="sm"
              onClick={() => setRenderAsCanvas(false)}
            >
              SVG
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant={useDynamicProps ? "default" : "outline"}
              onClick={() => setUseDynamicProps(!useDynamicProps)}
              size="sm"
            >
              Props Dinámicas: {useDynamicProps ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          <div className="ml-auto">
            <Button size="sm" variant="outline">
              Verificar dimensiones
            </Button>
          </div>
        </div>
        
        {/* Área de visualización principal */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4" ref={containerRef}>
            <VectorGrid 
              width={dimensions.width}
              height={dimensions.height}
              containerFluid={true}
              externalContainerRef={containerRef}
              backgroundColor="rgba(0,0,0,0.8)"
              gridSettings={{
                rows: gridConfig.rows,
                cols: gridConfig.cols,
                spacing: gridConfig.spacing,
                margin: gridConfig.margin
              }}
              vectorSettings={{
                vectorColor: vectorStyle.color,
                vectorLength: useDynamicProps ? undefined : vectorStyle.staticLength,
                vectorWidth: useDynamicProps ? undefined : vectorStyle.staticWidth,
                vectorShape: vectorStyle.vectorShape,
                strokeLinecap: vectorStyle.strokeLinecap,
                rotationOrigin: vectorStyle.rotationOrigin,
              }}
              animationType={animationConfig.type}
              animationProps={{
                waveFrequency: animationConfig.waveFrequency,
                waveAmplitude: animationConfig.waveAmplitude,
                baseAngle: animationConfig.baseAngle,
                patternScale: animationConfig.patternScale,
                waveType: animationConfig.waveType,
              }}
              easingFactor={0.2}
              timeScale={1.0}
              renderAsCanvas={renderAsCanvas}
              throttleMs={1}
              debugMode={true}
            />
          </div>
        </div>
        
        {/* Menú inferior */}
        <div className="border-t border-border p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">Dimensiones: {dimensions.width}x{dimensions.height}px</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Preset 1</Button>
              <Button variant="outline" size="sm">Preset 2</Button>
              <Button variant="outline" size="sm">Preset 3</Button>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: Panel de configuración */}
      <div className="w-80 border-l border-border flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Configuración</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Configuración del Grid */}
            <div>
              <h3 className="text-md font-medium mb-2">Grid</h3>
              <Separator className="mb-3" />
              <div className="space-y-4">
                <SliderControl
                  label="Filas"
                  min={3}
                  max={20}
                  step={1}
                  value={gridConfig.rows}
                  onChange={(value) => setGridConfig({...gridConfig, rows: value})}
                />
                
                <SliderControl
                  label="Columnas"
                  min={3}
                  max={25}
                  step={1}
                  value={gridConfig.cols}
                  onChange={(value) => setGridConfig({...gridConfig, cols: value})}
                />
                
                <SliderControl
                  label="Espaciado"
                  min={20}
                  max={100}
                  step={1}
                  value={gridConfig.spacing}
                  onChange={(value) => setGridConfig({...gridConfig, spacing: value})}
                />
                
                <SliderControl
                  label="Margen"
                  min={0}
                  max={100}
                  step={1}
                  value={gridConfig.margin}
                  onChange={(value) => setGridConfig({...gridConfig, margin: value})}
                />
              </div>
            </div>
            
            {/* Estilos de vectores */}
            <div>
              <h3 className="text-md font-medium mb-2">Estilos</h3>
              <Separator className="mb-3" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="vector-shape">Forma</Label>
                    <span className="text-sm">{vectorStyle.vectorShape}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'line', label: 'Línea' },
                      { value: 'arrow', label: 'Flecha' },
                      { value: 'dot', label: 'Punto' },
                      { value: 'triangle', label: 'Triángulo' },
                      { value: 'semicircle', label: 'Semicírculo' },
                      { value: 'curve', label: 'Curva' }
                    ].map((shapeOption) => (
                      <Button 
                        key={shapeOption.value}
                        size="sm"
                        variant={vectorStyle.vectorShape === shapeOption.value ? 'default' : 'outline'}
                        onClick={() => {
                          console.log(`Seleccionando forma: ${shapeOption.value}`);
                          setVectorStyle({...vectorStyle, vectorShape: shapeOption.value as VectorShape});
                        }}
                      >
                        {shapeOption.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <ColorControl
                  label="Color"
                  value={vectorStyle.color}
                  onChange={(value) => setVectorStyle({...vectorStyle, color: value})}
                />
                
                {!useDynamicProps && (
                  <SliderControl
                    label="Longitud"
                    min={5}
                    max={100}
                    step={1}
                    value={vectorStyle.staticLength}
                    onChange={(value) => setVectorStyle({...vectorStyle, staticLength: value})}
                  />
                )}
                
                {!useDynamicProps && (
                  <SliderControl
                    label="Grosor"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={vectorStyle.staticWidth}
                    onChange={(value) => setVectorStyle({...vectorStyle, staticWidth: value})}
                  />
                )}
              </div>
            </div>
            
            {/* Configuración de animación */}
            <div>
              <h3 className="text-md font-medium mb-2">Animación</h3>
              <Separator className="mb-3" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="mb-1">Tipo de onda</Label>
                  <div className="flex flex-wrap gap-2">
                    {['diagonal', 'horizontal', 'vertical', 'radial'].map((waveType) => (
                      <Button 
                        key={waveType}
                        size="sm"
                        variant={animationConfig.waveType === waveType ? 'default' : 'outline'}
                        onClick={() => setAnimationConfig({...animationConfig, waveType: waveType as 'diagonal' | 'horizontal' | 'vertical' | 'radial'})}
                      >
                        {waveType}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <SliderControl
                  label="Frecuencia"
                  min={0.0001}
                  max={0.01}
                  step={0.0001}
                  value={animationConfig.waveFrequency}
                  onChange={(value) => setAnimationConfig({...animationConfig, waveFrequency: value})}
                />
                
                <SliderControl
                  label="Amplitud"
                  min={0}
                  max={50}
                  step={1}
                  value={animationConfig.waveAmplitude}
                  onChange={(value) => setAnimationConfig({...animationConfig, waveAmplitude: value})}
                />
                
                <SliderControl
                  label="Escala de patrón"
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  value={animationConfig.patternScale}
                  onChange={(value) => setAnimationConfig({...animationConfig, patternScale: value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
