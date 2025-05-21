'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { AspectRatioOption, GridSettings } from '../../core/types';

interface CustomAspectRatio {
  width: number;
  height: number;
}

interface GridControlsProps {
  currentProps: {
    gridSettings?: GridSettings;
    aspectRatio?: AspectRatioOption;
    customAspectRatio?: CustomAspectRatio;
    backgroundColor?: string;
  };
  onPropsChange: (props: {
    gridSettings?: GridSettings;
    aspectRatio?: AspectRatioOption;
    customAspectRatio?: CustomAspectRatio;
    backgroundColor?: string;
  }) => void;
}

/**
 * Componente simplificado que no hace nada pero mantiene compatibilidad
 * con el código existente para evitar errores.
 */
export function GridControls({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPropsChange,
}: GridControlsProps) {
  // No renderizamos nada, este es un componente fantasma
  // sólo para mantener la compatibilidad con el código existente
  return null;
}
