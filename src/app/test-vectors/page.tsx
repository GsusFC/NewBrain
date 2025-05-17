'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VectorGrid } from '@/components/vector/VectorGrid';
import { FallbackVectorDisplay } from '@/components/vector/FallbackVectorDisplay';
import type { AnimationType } from '@/components/vector/core/types';

/**
 * Página de prueba minimalista para visualización de vectores
 * Con indicadores visuales fallback si los vectores no se renderizan
 */
export default function TestVectorsPage() {
  // Estado para contar intentos de renderizado
  const [renderAttempt, setRenderAttempt] = useState(1);
  const [showFallback, setShowFallback] = useState(false);

  // Efecto para manejar el timer del fallback
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    // Solo configurar el temporizador si no se está mostrando el fallback
    if (!showFallback) {
      timer = setTimeout(() => {
        setShowFallback(true);
      }, 3000);
    }
    
    // Limpieza del temporizador al desmontar o cuando cambie showFallback
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showFallback, renderAttempt]); // Incluimos renderAttempt para reiniciar el temporizador en reintentos

  // Reintentar renderizado
  const handleRetry = useCallback(() => {
    setRenderAttempt(prev => prev + 1);
    setShowFallback(false);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <h1 className="text-white text-2xl mb-4 font-bold">Prueba de Visualización de Vectores</h1>
      <p className="text-white mb-4">Intento #{renderAttempt} - Esta página está diseñada para probar la visualización de vectores sin dependencias externas.</p>
      
      <div 
        className="w-[800px] h-[600px] border-4 border-red-500 relative overflow-visible bg-[#121212] flex items-center justify-center"
      >
        {/* Vector Grid con configuración totalmente explícita */}
        <VectorGrid 
          key={`attempt-${renderAttempt}`}
          width={800}
          height={600}
          backgroundColor="#121212"
          vectorSettings={{
            vectorColor: "#ffffff",
            vectorLength: 20,
            vectorWidth: 4,
            vectorShape: "arrow",
            strokeLinecap: "round",
            rotationOrigin: "center"
          }}
          gridSettings={{
            rows: 15,
            cols: 20,
            spacing: 30,
            margin: 20
          }}
          // Configuración de animación con valores más agresivos para notar el movimiento
          animationType="smoothWaves"
          animationProps={{
            waveFrequency: 0.001, // Aumentado para mayor movimiento
            waveAmplitude: 40,   // Aumentado para mayor visibilidad
            waveType: 'circular',
            centerX: 0.5,        // Centro explícito
            centerY: 0.5,        // Centro explícito
            timeScale: 2.0       // Más rápido
          }}
          renderAsCanvas={false}  // SVG para mejor visualización en desarrollo
          debugMode={true}        // Activar logs para diagnóstico
          easingFactor={0.1}      // Más responsive
          timeScale={1.5}         // Acelerar animación
          dynamicLengthEnabled={true}
          dynamicWidthEnabled={true} // Activar para mayor efecto visual
          dynamicIntensity={1.0}    // Máxima intensidad
          isPaused={false}        // Asegurar que no esté pausado
        />
        
        {/* Fallback visual para confirmar que el contenedor funciona */}
        {showFallback && <FallbackVectorDisplay onRetry={handleRetry} />}
      </div>
      
      <div className="mt-4 bg-gray-800 text-white p-3 rounded-lg">
        <p className="text-sm">Debug: Si los vectores no se ven, abre la consola del navegador (F12) para ver posibles errores.</p>
      </div>
    </div>
  );
}
