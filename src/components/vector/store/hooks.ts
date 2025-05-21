// Mock de hooks para mantener compatibilidad
import { useVectorGridStore } from './improved/hooks';

export const useAnimationSettings: any = useVectorGridStore;
export const useGridSettings: any = useVectorGridStore;
export const useVectorSettings: any = useVectorGridStore;
export const useRenderSettings: any = useVectorGridStore;
export const useExportableState: any = useVectorGridStore;
export const useUpdateProps: any = useVectorGridStore;
export const useMouseInteraction: any = useVectorGridStore;

console.warn(
  'DEPRECATED: Los hooks individuales desde vectorGridStore/hooks han sido reemplazados por ' +
  'los hooks desde improved/hooks.ts. Este es un mock para mantener compatibilidad.'
);