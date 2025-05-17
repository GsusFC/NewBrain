'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fixPrecision, formatSvgPoint } from '@/utils/precision';

/**
 * Página con implementación garantizada de animación de vectores
 * Utilizando SVG puro y animación controlada por React
 */
export default function FixedAnimationPage() {
  const [time, setTime] = useState(0);
  const animationRef = useRef<number | null>(null);
  const gridRef = useRef<SVGSVGElement>(null);
  
  const cols = 15;
  const rows = 10;
  const spacing = 40;
  const vectorLength = 20;
  
  // Función de onda para animar los vectores con precisión mejorada
  const calculateAngle = (row: number, col: number, time: number): number => {
    const x = fixPrecision(col / cols, 6);
    const y = fixPrecision(row / rows, 6);
    
    // Combinación de ondas para crear efecto orgánico con precisión controlada
    const sinComponent = fixPrecision(Math.sin(fixPrecision(x * 4 + time * 2, 6)), 6);
    const cosComponent = fixPrecision(Math.cos(fixPrecision(y * 3 + time, 6)), 6);
    
    // Aplicar precisión en cada paso para evitar errores de propagación
    return fixPrecision((sinComponent * 0.5 + cosComponent * 0.5) * Math.PI, 6);
  };
  
  // Crear animación mediante requestAnimationFrame
  useEffect(() => {
    const animate = () => {
      setTime(prev => prev + 0.02); // Incremento de tiempo para animación
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-2xl font-bold mb-4">Animación Garantizada de Vectores</h1>
      
      <div className="border-4 border-red-500 p-2 bg-black">
        <svg 
          ref={gridRef}
          width={cols * spacing + 50} 
          height={rows * spacing + 50} 
          className="bg-gray-900"
        >
          {/* Generamos una cuadrícula de vectores */}
          {Array.from({ length: rows }).map((_, row) => (
            Array.from({ length: cols }).map((_, col) => {
              // Cálculo de posición con precisión fija
              const x = fixPrecision(col * spacing + spacing);
              const y = fixPrecision(row * spacing + spacing);
              
              // Ángulo animado en función del tiempo
              const angle = calculateAngle(row, col, time);
              // No necesitamos aplicar fixPrecision adicional aquí porque calculateAngle ya lo hace
              
              // Cálculo de la punta del vector con precisión fija para evitar errores de hidratación
              // Usar nuestra utilidad fixPrecision para estandarizar la precisión
              const endX = fixPrecision(x + Math.cos(angle) * vectorLength);
              const endY = fixPrecision(y + Math.sin(angle) * vectorLength);
              
              // Variación de color para efecto visual con precisión controlada
              const hue = fixPrecision((col / cols * 360 + time * 100) % 360);
              
              return (
                <g key={`vector-${row}-${col}`} className="vector-group">
                  {/* Línea principal */}
                  <line 
                    x1={x} 
                    y1={y} 
                    x2={endX} 
                    y2={endY}
                    stroke={`hsl(${hue}, 70%, 60%)`} 
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  
                  {/* Punta de flecha con precisión fija para evitar errores de hidratación */}
                  <polygon 
                    points={`
                      ${formatSvgPoint(endX, endY)},
                      ${formatSvgPoint(endX - 5 * Math.cos(angle - 0.5), endY - 5 * Math.sin(angle - 0.5))},
                      ${formatSvgPoint(endX - 5 * Math.cos(angle + 0.5), endY - 5 * Math.sin(angle + 0.5))}
                    `}
                    fill={`hsl(${hue}, 70%, 60%)`}
                    transform={`rotate(${fixPrecision(0)}, ${fixPrecision(endX)}, ${fixPrecision(endY)})`}
                  />
                </g>
              );
            })
          ))}
        </svg>
      </div>
      
      <div className="mt-4 bg-gray-800 text-white p-3 rounded-md text-sm">
        <div className="font-semibold mb-1">Información</div>
        <div>- Implementación SVG pura para garantizar animación</div>
        <div>- {cols * rows} vectores animados ({cols}×{rows})</div>
        <div>- Frame actual: {Math.floor(fixPrecision(time * 100))}</div>
      </div>
    </div>
  );
}
