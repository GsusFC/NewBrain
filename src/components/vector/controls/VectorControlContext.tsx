'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { VectorShape } from '../core/types';

// Interfaces para las propiedades de control de vectores
export interface VectorControlSettings {
  // Propiedades geométricas
  baseLength: number;
  baseWidth: number;
  shape: VectorShape;
  rotationOrigin: 'start' | 'center' | 'end';
  
  // Propiedades de apariencia
  color: string;
  strokeLinecap: 'butt' | 'round' | 'square';
  opacity: number;
  
  // Propiedades de comportamiento
  interactionEnabled: boolean;
  cullingEnabled: boolean;
  debugMode: boolean;
}

// Valores por defecto
const defaultSettings: VectorControlSettings = {
  baseLength: 40,
  baseWidth: 2,
  shape: 'line',
  rotationOrigin: 'center',
  
  color: '#737373',
  strokeLinecap: 'round',
  opacity: 1,
  
  interactionEnabled: true,
  cullingEnabled: true,
  debugMode: false,
};

// Interfaz del contexto
interface VectorControlContextType {
  settings: VectorControlSettings;
  updateSettings: (newSettings: Partial<VectorControlSettings>) => void;
  resetSettings: () => void;
}

// Crear el contexto
export const VectorControlContext = createContext<VectorControlContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export function useVectorControl() {
  const context = useContext(VectorControlContext);
  if (!context) {
    throw new Error('useVectorControl debe ser usado dentro de un VectorControlProvider');
  }
  return context;
}

// Proveedor del contexto
export function VectorControlProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VectorControlSettings>(defaultSettings);
  
  // Función para actualizar configuraciones parciales
  const updateSettings = (newSettings: Partial<VectorControlSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
  };
  
  // Función para resetear a valores por defecto
  const resetSettings = () => {
    setSettings(defaultSettings);
  };
  
  return (
    <VectorControlContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        resetSettings 
      }}
    >
      {children}
    </VectorControlContext.Provider>
  );
}
