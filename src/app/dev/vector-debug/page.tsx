'use client';

import React, { useRef, useState, useLayoutEffect } from 'react';
import { VectorGrid } from '@/components/vector/VectorGrid';
import type { AnimatedVectorItem } from '@/components/vector/core/types'; // Importar tipo

// Función para generar color basado en la posición del vector
const getColorByPosition = (item: AnimatedVectorItem): string => {
  // Variar el tono (Hue) basado en la fila y columna para colores distintos
  // Se multiplica por diferentes factores para asegurar más variedad
  const hue = (item.r * 30 + item.c * 60) % 360; 
  // Usar saturación y luminosidad fijas para colores vibrantes pero no demasiado brillantes
  return `hsl(${hue}, 80%, 55%)`; 
};

const VectorDebugPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [gridKey, setGridKey] = useState(0); // Para forzar re-montaje si es necesario

  useLayoutEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      console.log(`[VectorDebugPage] Container dimensions: ${clientWidth}x${clientHeight}`);
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  // Efecto para re-renderizar el grid si las dimensiones cambian significativamente
  // Esto es para asegurar que VectorGrid recibe las dimensiones correctas después del layout inicial
  useLayoutEffect(() => {
    if (dimensions) {
      // Podríamos añadir una lógica más sofisticada si el componente no se actualiza bien
      // por ahora, un cambio de key fuerza un re-montaje completo.
      // setGridKey(prev => prev + 1); 
    }
  }, [dimensions]);


  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', // Para apilar el grid y el panel de debug
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#101010',
        padding: '20px'
      }}
    >
      <div 
        ref={containerRef}
        style={{ 
          width: '80vw', // Contenedor con tamaño definido
          height: '70vh', 
          border: '2px dashed #444', 
          position: 'relative', 
          borderRadius: '8px',
          backgroundColor: '#181818', // Fondo ligeramente diferente para el contenedor
          marginBottom: '20px' // Espacio antes del panel de debug
        }}
      >
        {dimensions && (
          <VectorGrid
            key={gridKey} // Usar key para forzar re-montaje si es necesario
            width={dimensions.width}
            height={dimensions.height}
            containerFluid={false} // Usar dimensiones explícitas
            backgroundColor="transparent" // Fondo del grid transparente para ver el del contenedor
            
            gridSettings={{
              rows: 5,
              cols: 5,
              spacing: 50,
              margin: 20,
            }}
            
            vectorSettings={{
              vectorLength: 20, // Diámetro de 20px
              vectorColor: getColorByPosition, // Colores distintos por posición
              vectorWidth: 1, // Para 'dot', esto podría ser el stroke si el renderer lo usa así. Ajustar si es necesario.
              strokeLinecap: "round",
              vectorShape: "dot", 
              rotationOrigin: "center"
            }}
            
            animationType="none" // Sin animación para empezar
            
            renderAsCanvas={false} // SVG para facilitar la inspección inicial
            debugMode={true}
          />
        )}
      </div>

      <div 
        style={{
          width: '80vw',
          padding: '15px',
          border: '1px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a',
          color: '#ccc',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      >
        <h3 style={{marginTop: 0, color: '#eee', borderBottom: '1px solid #444', paddingBottom: '5px'}}>Debug Info Panel</h3>
        {dimensions ? (
          <>
            <p>Target Container Dimensions: {dimensions.width}px (width) x {dimensions.height}px (height)</p>
            {/* Aquí podríamos añadir más información emitida por VectorGrid si es necesario */}
            <p>Grid Instance Key: {gridKey}</p>
          </>
        ) : (
          <p>Calculating container dimensions...</p>
        )}
        <p style={{marginTop: '10px', fontSize: '12px', color: '#888'}}>
          Nota: `debugMode` en `VectorGrid` podría estar mostrando información adicional en la consola.
        </p>
      </div>
    </div>
  );
};

export default VectorDebugPage;
