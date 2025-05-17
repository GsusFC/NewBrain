'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Attribute = 'class' | 'data-theme' | 'data-mode';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: Attribute | Attribute[];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark" 
      forcedTheme="dark" // Forzamos el tema oscuro siempre
      enableSystem={false} // Desactivamos la detección de tema del sistema
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
