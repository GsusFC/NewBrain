import React from 'react';

interface FallbackVectorDisplayProps {
  // Props opcionales para casos de uso flexibles
  onRetry?: () => void;
  width?: number;
  height?: number;
  message?: string;
}

export const FallbackVectorDisplay: React.FC<FallbackVectorDisplayProps> = ({ 
  onRetry, 
  width = 400, 
  height = 300,
  message = "Los vectores deberían verse en esta área. Si no se ven, puede haber un problema con el renderizador."
}) => {
  return (
    <div 
      className="relative bg-black/80 flex flex-col items-center justify-center z-50" 
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="bg-white p-4 rounded-lg max-w-md">
        <h2 className="text-black font-bold text-xl mb-2">Prueba Visual</h2>
        <p className="text-black mb-4">{message}</p>
        
        {/* Vectores estáticos de prueba con SVG puro */}
        <div className="border border-gray-400 p-2 mb-4 bg-gray-100">
          <h3 className="text-sm font-bold mb-1">Prueba SVG estática:</h3>
          <svg width="400" height="100" style={{ background: '#333' }}>
            <line x1="50" y1="50" x2="100" y2="50" stroke="white" strokeWidth="3" />
            <line x1="150" y1="25" x2="200" y2="75" stroke="white" strokeWidth="3" />
            <line x1="250" y1="75" x2="300" y2="25" stroke="white" strokeWidth="3" />
            <line x1="350" y1="25" x2="350" y2="75" stroke="white" strokeWidth="3" />
          </svg>
        </div>
        
        {onRetry && (
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full"
            onClick={onRetry}
          >
            Reintentar Renderizado
          </button>
        )}
      </div>
    </div>
  );
};
