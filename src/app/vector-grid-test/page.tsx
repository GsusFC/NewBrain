'use client'; // Necesario para hooks de React en App Router

'use client';

import React from 'react';
import { VectorGrid } from '@/components/vector/VectorGrid';
import { VectorGridWithControls } from '@/components/vector/controls/VectorGridWithControls';
import type { AnimatedVectorItem, FrameInfo } from '@/components/vector/core/types';
// Componentes básicos hasta tener shadcn/ui
const Button = ({ children, variant = 'default', className = '', onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md ${variant === 'default' ? 'bg-primary text-primary-foreground' : 
      variant === 'outline' ? 'border border-input bg-background hover:bg-accent' : 
      'bg-secondary text-secondary-foreground'} ${className}`}
  >
    {children}
  </button>
);

const VectorGridTestPage: React.FC = () => {
  // Estado para controlar el tipo de renderizado (SVG o Canvas)
  const [renderAsCanvas, setRenderAsCanvas] = React.useState(true);
  // Estado para controlar el uso de propiedades dinámicas
  const [useDynamicProps, setUseDynamicProps] = React.useState(false);
  // Estado para controlar la visibilidad del panel
  const [showControls, setShowControls] = React.useState(true);
  
  // Funciones para propiedades dinámicas de los vectores
  
  // Función para calcular longitud basada en posición X y tiempo
  const dynamicLength = React.useCallback((item: AnimatedVectorItem, frameInfo: FrameInfo) => {
    // Base fija
    const baseLength = 40;
    
    if (!useDynamicProps) return baseLength;
    
    // Usar valores predeterminados si frameInfo no está definido
    const timestamp = frameInfo?.timestamp || 0;
    
    // Cálculo dinámico basado en la posición X y el tiempo
    const xFactor = Math.sin(item.baseX / 100 + timestamp / 2000) * 0.5 + 1; // Entre 0.5 y 1.5
    
    // Efecto de "respiración" global usando el timestamp
    const breatheFactor = Math.sin(timestamp / 1000) * 0.2 + 1; // Entre 0.8 y 1.2
    
    // Combinar factores
    return baseLength * xFactor * breatheFactor;
  }, [useDynamicProps]);
  
  // Función para calcular grosor basado en ángulo
  const dynamicWidth = React.useCallback((item: AnimatedVectorItem, frameInfo: FrameInfo) => {
    // Base fija
    const baseWidth = 2.5;
    
    if (!useDynamicProps) return baseWidth;
    
    // Asegurarnos que item tenga un ángulo válido (podría ser undefined durante el renderizado inicial)
    const currentAngle = item.currentAngle || 0;
    
    // Valores normalizados para aplicar variaciones
    const angleNormalized = (currentAngle % 360) / 360; // 0-1
    
    // Variación de grosor basada en el ángulo actual (más grueso cuando apunta en ciertas direcciones)
    const angleFactor = Math.abs(Math.sin(angleNormalized * Math.PI * 2)) * 0.7 + 0.8; // Entre 0.8 y 1.5
    
    // Variación adicional basada en la posición Y
    const yFactor = (item.baseY % 100) / 100 * 0.4 + 0.8; // Entre 0.8 y 1.2
    
    // Combinar factores
    return baseWidth * angleFactor * yFactor;
  }, [useDynamicProps]);

  return (
    <div className="flex flex-col p-6 gap-6 bg-background text-foreground h-screen overflow-hidden">
      <div className="flex gap-4 items-center">
        <Button
          variant={renderAsCanvas ? "default" : "secondary"}
          onClick={() => setRenderAsCanvas(!renderAsCanvas)}
          className="gap-2"
        >
          Renderizado: {renderAsCanvas ? 'Canvas' : 'SVG'}
          <span className="text-xs opacity-70">
            {renderAsCanvas ? '(Mejor rendimiento)' : '(Mejor interactividad)'}
          </span>
        </Button>
        
        <Button
          variant={useDynamicProps ? "default" : "secondary"}
          onClick={() => setUseDynamicProps(!useDynamicProps)}
          className="gap-2"
        >
          Props Dinámicas: {useDynamicProps ? 'ON' : 'OFF'}
          <span className="text-xs opacity-70">
            {useDynamicProps ? '(Valores calculados)' : '(Valores estáticos)'}
          </span>
        </Button>
        
        <Button
          variant={showControls ? "outline" : "secondary"}
          onClick={() => setShowControls(!showControls)}
          className="ml-auto"
        >
          {showControls ? 'Ocultar Panel' : 'Mostrar Panel'}
        </Button>
      </div>

      <div className="flex-1 w-full rounded-md overflow-hidden border border-border">
        {showControls ? (
          <VectorGridWithControls
            // --- Configuración Simplificada para Desarrollo ---
            backgroundColor="#1a1a1a"
            containerFluid={true}
            // --- Reducción del número de vectores ---
            gridSettings={{
              rows: 10,
              cols: 15,
              spacing: 45,
              margin: 50,
            }}
            
            // --- Animación Garantizada Sin Paradas ---
            animationType="smoothWaves"
            animationProps={{
              waveFrequency: 0.001,
              waveAmplitude: 20,
              baseAngle: 0,
              patternScale: 0.015,
              waveType: 'diagonal', 
            }}
            
            // --- Parámetros Críticos para Movimiento Continuo ---
            easingFactor={0.2}
            timeScale={1.0}
            dynamicLengthEnabled={true}
            dynamicWidthEnabled={false}
            dynamicIntensity={0}
            
            renderAsCanvas={renderAsCanvas}
            throttleMs={1}
          />
        ) : (
          <VectorGrid
            // --- Configuración Simplificada para Desarrollo ---
            backgroundColor="#1a1a1a"
            containerFluid={true}
            // --- Reducción del número de vectores ---
            gridSettings={{
              rows: 10,
              cols: 15,
              spacing: 45,
              margin: 50,
            }}
            
            // --- Estilo de vectores con soporte para propiedades dinámicas ---
            vectorSettings={{
              vectorLength: useDynamicProps ? dynamicLength : 30,
              vectorColor: "#4a80f5",
              vectorWidth: useDynamicProps ? dynamicWidth : 2.5,
              strokeLinecap: "round", 
              vectorShape: "line",
              rotationOrigin: "center"
            }}
            
            // --- Animación Garantizada Sin Paradas ---
            animationType="smoothWaves"
            animationProps={{
              waveFrequency: 0.001,
              waveAmplitude: 20,
              baseAngle: 0,
              patternScale: 0.015,
              waveType: 'diagonal',
            }}
            
            // --- Parámetros Críticos para Movimiento Continuo ---
            easingFactor={0.2}
            timeScale={1.0}
            dynamicLengthEnabled={true}
            dynamicWidthEnabled={false}
            dynamicIntensity={0}
            
            renderAsCanvas={renderAsCanvas}
            throttleMs={1}
            debugMode={true}
          />
        )}
      </div>
    </div>
  );
};

export default VectorGridTestPage;
