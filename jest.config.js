// Configuración de Jest para Next.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextJest = require('next/jest');

// Proveedor de Next.js para Jest
const createJestConfig = nextJest({
  // La ruta al directorio de Next.js
  dir: './',
});

// Configuración personalizada de Jest
const customJestConfig = {
  // Añadir más configuraciones de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // si estás usando TypeScript
  moduleNameMapper: {
    // Manejo de imports con @ que Next.js configura
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  transform: {
    // Transformar archivos .ts y .tsx con ts-jest
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};

// createJestConfig se exporta automáticamente
module.exports = createJestConfig(customJestConfig);
