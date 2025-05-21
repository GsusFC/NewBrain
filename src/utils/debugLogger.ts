// src/utils/debugLogger.ts

declare global {
  interface Window {
    toggleDebugModule: (moduleName: string, isActive?: boolean) => void;
  }
}

// Define which modules/contexts have their debug logs active.
// Set to false to silence logs from a specific module.
const activeDebugModules: Record<string, boolean> = {
  useVectorGrid: false, // Desactivado temporalmente para reducir logs
  VectorPlaygroundWithStore: true,
  useGridDimensions: true,
  useGridContainer: false, // Desactivado temporalmente para reducir logs
  // Add other modules here as needed, e.g.:
  // VectorSvgRenderer: false,
  // AnimationSystem: false,
};

/**
 * Custom logger function to control debug messages.
 * Logs messages to the console if the corresponding module is active
 * and the environment is 'development'.
 *
 * @param moduleName - The name of the module or context (e.g., 'useVectorGrid', 'AnimationEngine').
 * @param messages - The messages or objects to log, similar to console.log.
 */
export const debugLog = (moduleName: string, ...messages: unknown[]): void => {
  // Check for development environment (common in Node.js/bundler setups)
  const isDevelopment = typeof process !== 'undefined' && 
                        process.env && 
                        process.env.NODE_ENV === 'development';

  // Fallback for browser environments if process.env.NODE_ENV is not set
  // but we still want to control logging via activeDebugModules.
  // This condition might need refinement based on your specific build setup.
  const isBrowserDebug = typeof window !== 'undefined' && !isDevelopment;

  if ((isDevelopment || isBrowserDebug) && activeDebugModules[moduleName]) {
    // eslint-disable-next-line no-console
    console.log(`[${moduleName}]`, ...messages);
  }
};

// Optional: A way to dynamically toggle modules at runtime for easier debugging
// This is more advanced and might not be needed initially.
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || (typeof process === 'undefined' || !process.env || !process.env.NODE_ENV))) {
  window.toggleDebugModule = (moduleName: string, isActive?: boolean): void => {
    if (typeof activeDebugModules[moduleName] === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(`[DebugLogger] Module '${moduleName}' is not registered for toggling. Add it to activeDebugModules in debugLogger.ts.`);
      // Optionally, allow dynamic registration:
      // activeDebugModules[moduleName] = false; 
      // console.info(`[DebugLogger] Module '${moduleName}' dynamically registered and set to OFF.`);
      return;
    }
    activeDebugModules[moduleName] = typeof isActive === 'boolean' ? isActive : !activeDebugModules[moduleName];
    // eslint-disable-next-line no-console
    console.log(`[DebugLogger] Logging for module '${moduleName}' is now ${activeDebugModules[moduleName] ? 'ENABLED' : 'DISABLED'}.`);
  };
  // eslint-disable-next-line no-console
  console.info("[DebugLogger] You can use window.toggleDebugModule('moduleName', true/false) to control logs at runtime.");
}
