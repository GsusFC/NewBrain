'use client';

import React from 'react';
import { GridControlSelector } from './index';
import { AspectRatioOption, CustomAspectRatio, GridSettings } from './types';

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

export function GridControls({
  currentProps,
  onPropsChange,
}: GridControlsProps) {
  const { 
    gridSettings = {}, 
    aspectRatio = '16:9', 
    customAspectRatio,
    backgroundColor 
  } = currentProps;

  return (
    <GridControlSelector
      gridSettings={gridSettings}
      aspectRatio={aspectRatio}
      customAspectRatio={customAspectRatio}
      backgroundColor={backgroundColor}
      onPropsChange={onPropsChange}
    />
  );
}
