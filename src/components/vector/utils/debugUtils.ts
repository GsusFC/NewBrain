/**
 * Utilidades para depuración controlada en VectorGrid
 * 
 * Este módulo proporciona funciones para gestionar logs de depuración
 * de manera eficiente, evitando inundación de consola pero manteniendo
 * información diagnóstica cuando sea necesaria.
 */

// Configuración global para logs
type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  throttleInterval: number;  // Intervalo mínimo entre logs (ms)
  groupLogging: boolean;     // Agrupar logs relacionados
}

// Valores por defecto
const DEFAULT_CONFIG: DebugConfig = {
  enabled: false,
  level: 'info',
  throttleInterval: 1000,
  groupLogging: true
};

// Configuración actual (modifiable)
let debugConfig: DebugConfig = { ...DEFAULT_CONFIG };

// Registro de timestamp del último log (para throttling)
const lastLogTime: Record<string, number> = {};

/**
 * Configura las opciones de depuración
 */
export function configureDebugger(options: Partial<DebugConfig>): void {
  debugConfig = { ...debugConfig, ...options };
}

/**
 * Determina si el log debe procesarse basado en nivel y throttling
 */
function shouldLog(category: string, level: LogLevel): boolean {
  if (!debugConfig.enabled) return false;
  
  const levelPriority = {
    'none': 0,
    'error': 1,
    'warn': 2,
    'info': 3, 
    'debug': 4,
    'verbose': 5
  };
  
  if (levelPriority[level] > levelPriority[debugConfig.level]) {
    return false;
  }
  
  // Aplicar throttling
  const now = Date.now();
  const lastTime = lastLogTime[category] || 0;
  
  if ((now - lastTime) < debugConfig.throttleInterval) {
    return false;
  }
  
  lastLogTime[category] = now;
  return true;
}

/**
 * Log objeto complejo con soporte para throttling
 */
export function logObject(
  category: string, 
  title: string, 
  data: any, 
  level: LogLevel = 'info'
): void {
  if (!shouldLog(category, level)) return;
  
  if (debugConfig.groupLogging) {
    console.groupCollapsed(`[${category}] ${title}`);
    console.log(data);
    console.groupEnd();
  } else {
    console.log(`[${category}] ${title}:`, data);
  }
}

/**
 * Log simple con soporte para throttling
 */
export function logMessage(
  category: string, 
  message: string, 
  level: LogLevel = 'info'
): void {
  if (!shouldLog(category, level)) return;
  console.log(`[${category}] ${message}`);
}

/**
 * Log de rendimiento con medición de tiempo
 */
export function logPerformance(
  category: string, 
  operation: string, 
  startTime: number
): void {
  if (!shouldLog(category, 'debug')) return;
  
  const duration = Date.now() - startTime;
  console.log(`[${category}] ${operation} completado en ${duration}ms`);
}

/**
 * Log de error con soporte para throttling
 */
export function logError(
  category: string, 
  message: string, 
  error?: any
): void {
  if (!shouldLog(category, 'error')) return;
  
  if (error) {
    console.error(`[${category}] ${message}`, error);
  } else {
    console.error(`[${category}] ${message}`);
  }
}

/**
 * Inicializa componente de debug con configuración específica
 */
export function createComponentLogger(componentName: string, config?: Partial<DebugConfig>) {
  const componentConfig = { ...debugConfig, ...config };
  
  return {
    info: (message: string, data?: any) => {
      if (!shouldLog(componentName, 'info')) return;
      if (data) {
        logObject(componentName, message, data, 'info');
      } else {
        logMessage(componentName, message, 'info');
      }
    },
    debug: (message: string, data?: any) => {
      if (!shouldLog(componentName, 'debug')) return;
      if (data) {
        logObject(componentName, message, data, 'debug');
      } else {
        logMessage(componentName, message, 'debug');
      }
    },
    warn: (message: string, data?: any) => {
      if (!shouldLog(componentName, 'warn')) return;
      if (data) {
        logObject(componentName, message, data, 'warn');
      } else {
        logMessage(componentName, message, 'warn');
      }
    },
    error: (message: string, error?: any) => {
      logError(componentName, message, error);
    },
    performance: (operation: string, startTime: number) => {
      logPerformance(componentName, operation, startTime);
    },
    group: (title: string, fn: () => void) => {
      if (!shouldLog(componentName, 'info')) return;
      console.groupCollapsed(`[${componentName}] ${title}`);
      fn();
      console.groupEnd();
    }
  };
}

/**
 * Activa el modo de depuración de forma condicional
 */
export function enableDebugMode(condition: boolean, config?: Partial<DebugConfig>): void {
  if (condition) {
    configureDebugger({ 
      enabled: true,
      ...config
    });
  }
}

/**
 * Muestra estadísticas de renderizado
 */
export function logRenderStats(
  componentName: string,
  totalItems: number,
  renderedItems: number,
  dimensions: { width: number, height: number },
  options?: { [key: string]: any }
): void {
  if (!shouldLog(componentName, 'info')) return;
  
  console.groupCollapsed(`[${componentName}] Estadísticas de Renderizado`);
  console.log(`Total: ${totalItems} | Renderizados: ${renderedItems}`);
  console.log(`Dimensiones: ${dimensions.width}×${dimensions.height}px`);
  
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  }
  
  console.groupEnd();
}
