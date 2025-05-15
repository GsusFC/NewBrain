import { Button } from '@/components/ui/button';
import { AspectRatioOption } from '../types';

interface AspectRatioButtonsProps {
  selectedRatio: AspectRatioOption;
  onRatioChange: (ratio: AspectRatioOption) => void;
}

export const AspectRatioButtons: React.FC<AspectRatioButtonsProps> = ({
  selectedRatio,
  onRatioChange
}) => {
  // Función para manejar el clic en botones de ratio de aspecto
  // Previene procesamiento si ya está seleccionado ese ratio
  const handleRatioChange = (ratio: AspectRatioOption) => {
    // Prevenir llamada redundante si ya está seleccionado ese ratio
    if (ratio === selectedRatio) return;
    onRatioChange(ratio);
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={selectedRatio === '1:1' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleRatioChange('1:1')}
        // Desactivar el botón si ya está seleccionado para prevenir doble clic
        disabled={selectedRatio === '1:1'}
        className="flex-1"
      >
        1:1
      </Button>
      <Button
        variant={selectedRatio === '2:1' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleRatioChange('2:1')}
        disabled={selectedRatio === '2:1'}
        className="flex-1"
      >
        2:1
      </Button>
      <Button
        variant={selectedRatio === '16:9' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleRatioChange('16:9')}
        disabled={selectedRatio === '16:9'}
        className="flex-1"
      >
        16:9
      </Button>
      <Button
        variant={selectedRatio === 'custom' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleRatioChange('custom')}
        disabled={selectedRatio === 'custom'}
        className="flex-1"
      >
        Custom
      </Button>
    </div>
  );
};
