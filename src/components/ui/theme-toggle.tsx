'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

/**
 * Indicador de modo oscuro
 * Componente simplificado que reemplaza el selector de tema, ya que ahora
 * la aplicación usa exclusivamente un tema oscuro optimizado.
 */
export function ThemeToggle() {
  return (
    <div className="inline-flex">
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Modo oscuro</span>
      </Button>
    </div>
  );
}
