// Mock de vectorGridStore para mantener compatibilidad
import { create } from 'zustand';
import { useVectorGridStore as useActualVectorGridStore } from './improved/vectorGridStore';

/**
 * @deprecated Este store ha sido reemplazado por la versiu00f3n en ./improved/vectorGridStore.ts
 * Se mantiene como referencia para compatibilidad de imports antiguos
 */
export const useVectorGridStore: any = useActualVectorGridStore;

/**
 * @deprecated Use vectorGridStore.ts de la carpeta improved
 */
export const useVectorGridSelector: any = <T>(selector: any) => useVectorGridStore(selector);