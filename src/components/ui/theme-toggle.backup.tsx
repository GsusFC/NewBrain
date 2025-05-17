'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';

/**
 * Componente simplificado para cambiar de tema
 * Reemplazamos DropdownMenu con botones directos para evitar problemas de renderizado
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Ciclo de tema: light -> dark -> system -> light
  const cycleThroughThemes = React.useCallback(() => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }, [theme, setTheme]);
  
  // Efecto para evitar problemas de hidratación
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // No renderizamos nada hasta que el componente esté montado en el cliente
  if (!mounted) return null;

  // Determinamos qué ícono mostrar basándonos en el tema actual
  let ThemeIcon = Sun;
  if (theme === 'dark') ThemeIcon = Moon;
  else if (theme === 'system') ThemeIcon = Monitor;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full" 
      onClick={cycleThroughThemes}
      title={`Tema actual: ${theme || 'sistema'}. Haz clic para cambiar.`}
    >
      <ThemeIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
