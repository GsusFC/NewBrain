import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AspectRatioOption, CustomAspectRatio } from '../types';

interface DensityRatioSelectorProps {
  aspectRatio: AspectRatioOption;
  customRatio: CustomAspectRatio;
  showCustomPanel: boolean;
  onAspectRatioChange: (ratio: AspectRatioOption, customRatio?: CustomAspectRatio) => void;
  onCustomRatioChange: (customRatio: CustomAspectRatio) => void;
}

export const DensityRatioSelector: React.FC<DensityRatioSelectorProps> = ({
  aspectRatio,
  customRatio,
  showCustomPanel,
  onAspectRatioChange,
  onCustomRatioChange
}) => {
  // Función para manejar cambios en el ratio personalizado
  const handleCustomRatioChange = (key: 'width' | 'height', value: number) => {
    const newValue = Math.max(1, value); // Asegurar que el valor sea al menos 1
    
    const newCustomRatio = {
      ...customRatio,
      [key]: newValue
    };
    
    onCustomRatioChange(newCustomRatio);
  };
  
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">
        Proporción
      </Label>
      
      {/* Botones de ratios predefinidos */}
      <div className="flex space-x-2 mb-3">
        <Button
          variant={aspectRatio === '1:1' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onAspectRatioChange('1:1')}
          className="flex-1"
        >
          1:1
        </Button>
        <Button
          variant={aspectRatio === '2:1' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onAspectRatioChange('2:1')}
          className="flex-1"
        >
          2:1
        </Button>
        <Button
          variant={aspectRatio === '16:9' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onAspectRatioChange('16:9')}
          className="flex-1"
        >
          16:9
        </Button>
        <Button
          variant={aspectRatio === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onAspectRatioChange('custom')}
          className="flex-1"
        >
          Custom
        </Button>
      </div>
      
      {/* Panel de ratio personalizado */}
      {showCustomPanel && (
        <div className="border border-slate-700 p-3 rounded-md bg-slate-800/30 mb-4">
          <div className="text-sm font-medium mb-2">Ratio personalizado</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="densityCustomWidth" className="text-xs">
                Ancho
              </Label>
              <Input
                id="densityCustomWidth"
                type="number"
                min="1"
                value={customRatio.width}
                onChange={(e) => handleCustomRatioChange('width', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="densityCustomHeight" className="text-xs">
                Altura
              </Label>
              <Input
                id="densityCustomHeight"
                type="number"
                min="1"
                value={customRatio.height}
                onChange={(e) => handleCustomRatioChange('height', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
