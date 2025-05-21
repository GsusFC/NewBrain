'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * Componente para renderizar contenido exclusivamente en el lado cliente
 * Evita errores de hidratación al no renderizar nada en el servidor
 * 
 * @example
 * ```tsx
 * <ClientOnly>
 *   <ComponenteConCalculosDinamicos />
 * </ClientOnly>
 * ```
 */
export function ClientOnly({ children, fallback = null }: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return <div className="client-only-fallback">{fallback}</div>;
  }
  
  return <div className="client-only-content">{children}</div>;
}

/**
 * HOC (High Order Component) para hacer que cualquier componente sea exclusivamente cliente
 * 
 * @example
 * ```tsx
 * const ClientSideComponent = withClientOnly(ComponenteConCalculosDinamicos);
 * ```
 */
export function withClientOnly<P extends object>(Component: React.ComponentType<P>) {
  return function WithClientOnly(props: P) {
    return (
      <ClientOnly>
        <Component {...props} />
      </ClientOnly>
    );
  };
}
