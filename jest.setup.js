// Importamos las utilidades de testing de DOM
import '@testing-library/jest-dom';

// Definir jest para evitar errores de lint
/* global jest */

// Mock para ResizeObserver que no existe en el entorno de jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  });

  // Simulaciones para canvas si usas canvas en tus componentes
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Array(4),
      }),
      putImageData: jest.fn(),
      createImageData: jest.fn().mockReturnValue([]),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 0 }),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    })),
  });

  // Mock para performance.now()
  if (!window.performance) {
    window.performance = {};
  }
  window.performance.now = jest.fn(() => Date.now());
}

// Silenciar advertencias de consola durante los tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};
