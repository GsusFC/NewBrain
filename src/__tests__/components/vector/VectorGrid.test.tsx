import React from 'react';
import { render, screen } from '@testing-library/react';
import { VectorGrid } from '@/components/vector/VectorGrid';
// Importar tipos necesarios y extender la interfaz VectorGridRef para los tests
import type { VectorGridRef as BaseVectorGridRef } from '@/components/vector/core/types';

// Extender la interfaz para incluir el método togglePause que se usa en las pruebas
interface VectorGridRef extends BaseVectorGridRef {
  togglePause: () => void;
}

// Mock de los hooks personalizados para evitar dependencias externas
jest.mock('@/hooks/useThrottledCallback', () => ({
  useThrottledCallback: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

jest.mock('@/components/vector/core/useVectorGrid', () => ({
  useVectorGrid: jest.fn().mockReturnValue({
    initialVectors: Array(9).fill(0).map((_, index) => ({
      id: `vector-${index}`,
      r: Math.floor(index / 3),
      c: index % 3,
      baseX: (index % 3) * 30,
      baseY: Math.floor(index / 3) * 30,
      initialAngle: 0,
      currentAngle: 0,
      lengthFactor: 1,
      widthFactor: 1,
    })),
    calculatedRows: 3,
    calculatedCols: 3,
    calculatedGridWidth: 90,
    calculatedGridHeight: 90,
  }),
}));

jest.mock('@/components/vector/core/useVectorAnimation', () => ({
  useVectorAnimation: jest.fn().mockReturnValue({
    animatedVectors: Array(9).fill(0).map((_, index) => ({
      id: `vector-${index}`,
      r: Math.floor(index / 3),
      c: index % 3,
      baseX: (index % 3) * 30,
      baseY: Math.floor(index / 3) * 30,
      initialAngle: 0,
      currentAngle: 0,
      lengthFactor: 1,
      widthFactor: 1,
    })),
    setAnimatedVectors: jest.fn(),
    triggerPulse: jest.fn(),
  }),
}));

jest.mock('@/hooks/vector/useContainerDimensions', () => ({
  useContainerDimensions: jest.fn().mockReturnValue({
    dimensions: { width: 300, height: 300, adjustment: { type: 'none' } },
    observedDimensions: { width: 300, height: 300 },
  }),
}));

// Mock para los componentes de renderizado
jest.mock('@/components/vector/renderers/VectorSvgRenderer', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => <div data-testid="svg-renderer" />),
}));

jest.mock('@/components/vector/renderers/VectorCanvasRenderer', () => ({
  VectorCanvasRenderer: jest.fn().mockImplementation(() => <div data-testid="canvas-renderer" />),
}));

// Importar extensiones de Jest
import '@testing-library/jest-dom';

describe('VectorGrid', () => {
  // Prueba básica de renderizado
  it('renderiza correctamente con propiedades por defecto', () => {
    const { container } = render(<VectorGrid />);
    
    // Verificar que el contenedor principal existe
    expect(container.querySelector('.vector-grid-container')).toBeInTheDocument();
    
    // Verificar que se aplicaron atributos de accesibilidad
    expect(container.firstChild).toHaveAttribute('aria-label', 'Grid de vectores animados');
  });

  // Prueba de renderizado SVG vs Canvas
  it('cambia entre renderizadores SVG y Canvas según la prop renderAsCanvas', () => {
    // Renderizado con SVG (por defecto)
    const { rerender } = render(<VectorGrid />);
    expect(screen.queryByTestId('svg-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-renderer')).not.toBeInTheDocument();
    
    // Cambiar a Canvas
    rerender(<VectorGrid renderAsCanvas={true} />);
    expect(screen.queryByTestId('canvas-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('svg-renderer')).not.toBeInTheDocument();
  });

  // Prueba de funcionalidad con useRef
  it('expone métodos a través de la ref', async () => {
    const ref = React.createRef<VectorGridRef>();
    render(<VectorGrid ref={ref} />);
    
    // Verificar que la ref tiene los métodos esperados
    expect(ref.current).toBeDefined();
    expect(typeof ref.current.triggerPulse).toBe('function');
    expect(typeof ref.current.togglePause).toBe('function');
    expect(typeof ref.current.getVectors).toBe('function');
    
    // Comprobar que getVectors devuelve el array de vectores
    const vectors = ref.current.getVectors();
    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBe(9); // basado en nuestro mock
  });

  // Prueba de manejo de errores
  it('muestra mensaje de error en modo debug cuando no hay vectores', () => {
    // Guardamos la implementación actual del mock
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockUseVectorGrid = require('@/components/vector/core/useVectorGrid').useVectorGrid;
    
    // Sobrescribimos temporalmente el mock para este test específico
    const emptyVectorsReturn = {
      initialVectors: [],
      calculatedRows: 0,
      calculatedCols: 0,
      calculatedGridWidth: 0,
      calculatedGridHeight: 0,
    };
    
    // Sobrescribir temporalmente el mock
    mockUseVectorGrid.mockReturnValueOnce(emptyVectorsReturn);
    
    // Renderizamos con el modo debug activado
    render(<VectorGrid debugMode={true} />);
    
    // Verificamos que aparezca el mensaje de error
    expect(screen.getByText(/no se pudieron generar vectores iniciales/i)).toBeInTheDocument();
  });

  // Probar la prop de backgroundColorr
  it('aplica el color de fondo especificado', () => {
    const backgroundColor = '#ff0000';
    const { container } = render(<VectorGrid backgroundColor={backgroundColor} />);
    
    const gridContainer = container.querySelector('.vector-grid-container');
    expect(gridContainer).toHaveStyle({backgroundColor});
  });
});
