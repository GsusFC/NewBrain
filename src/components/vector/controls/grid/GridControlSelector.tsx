"use client";

import { FC } from 'react';
import { GridSettings } from './types';

interface GridControlSelectorProps {
  gridSettings?: GridSettings;
  _backgroundColor?: string;
  onPropsChange: (props: {
    gridSettings: GridSettings;
    _backgroundColor?: string;
  }) => void;
}

/**
 * Componente eliminado de la aplicación
 */
const GridControlSelector: FC<GridControlSelectorProps> = () => {
  return null;
};

export default GridControlSelector;
