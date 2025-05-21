# Agent Guidelines for VectorGrid Brain V2

## Build Commands
- Development: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Test all: `npm run test`
- Test single file: `npm run test -- -t "test name"` or `npm run test path/to/file.test.tsx`
- Test with watch: `npm run test:watch`
- Test coverage: `npm run test:coverage`

## Code Style Guidelines
- Use TypeScript with strict type safety
- Imports: Group imports (React, external libraries, internal components, types, utils)
- Naming: PascalCase for components, camelCase for functions/variables
- Error handling: Use try/catch blocks with specific error messages
- Component memoization: Use React.memo() for optimized components
- Use React hooks idiomatically (useCallback, useMemo, useRef)
- Prefer destructuring for props and objects
- Use JSDoc-style comments for complex functions
- Follow accessibility best practices
- Use the @/ path alias for imports from src directory