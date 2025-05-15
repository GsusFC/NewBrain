import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomAspectRatio } from '../types';

interface CustomRatioPanelProps {
  customRatio: CustomAspectRatio;
  onChange: (ratio: CustomAspectRatio) => void;
}

export const CustomRatioPanel: React.FC<CustomRatioPanelProps> = ({
  customRatio,
  onChange
}) => {
  const [width, setWidth] = useState<number>(customRatio.width);
  const [height, setHeight] = useState<number>(customRatio.height);
  
  // Actualizar estado local cuando cambia el ratio customizado
  useEffect(() => {
    setWidth(customRatio.width);
    setHeight(customRatio.height);
  }, [customRatio]);
  
  // Validar y actualizar el ancho
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(1, parseInt(e.target.value) || 1);
    setWidth(newWidth);
    
    // Actualizar el ratio solo si el valor es válido
    if (newWidth > 0) {
      onChange({
        width: newWidth,
        height
      });
    }
  };
  
  // Validar y actualizar la altura
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(1, parseInt(e.target.value) || 1);
    setHeight(newHeight);
    
    // Actualizar el ratio solo si el valor es válido
    if (newHeight > 0) {
      onChange({
        width,
        height: newHeight
      });
    }
  };
  
  return (
    <div className="border border-slate-700 p-3 rounded-md bg-slate-800/30">
      <div className="text-sm font-medium mb-2">Ratio personalizado</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customRatioWidth" className="text-xs">
            Ancho
          </Label>
          <Input
            id="customRatioWidth"
            type="number"
            min="1"
            value={width}
            onChange={handleWidthChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="customRatioHeight" className="text-xs">
            Altura
          </Label>
          <Input
            id="customRatioHeight"
            type="number"
            min="1"
            value={height}
            onChange={handleHeightChange}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
