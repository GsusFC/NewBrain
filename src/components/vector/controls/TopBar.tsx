'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function TopBar() {
  return (
    <div className="flex items-center justify-between w-full p-2 border-b border-border bg-card">
      <div className="text-sm font-medium">VectorGrid</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
