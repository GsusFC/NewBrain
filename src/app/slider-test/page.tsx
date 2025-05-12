'use client';

import React, { useState } from 'react';
import { SliderControl } from '@/components/vector/controls/VectorControlComponents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function SliderTestPage() {
  const [valueInt, setValueInt] = useState(50);
  const [valueDecimal, setValueDecimal] = useState(0.5);
  const [valueSmall, setValueSmall] = useState(0.0025);
  const [valueLarge, setValueLarge] = useState(250);
  
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Test de SliderControl con Input</h1>
          <p className="text-muted-foreground">
            Esta página muestra el componente SliderControl con inputs numéricos para facilitar el ingreso de valores exactos.
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Slider con valores enteros</CardTitle>
              <CardDescription>Control de valores enteros entre 0 y 100</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm rounded-md bg-muted p-3">
                Valor actual: <span className="font-mono font-medium">{valueInt}</span>
              </div>
              <SliderControl
                label="Valor entero"
                min={0}
                max={100}
                step={1}
                value={valueInt}
                onChange={setValueInt}
                className="mb-2"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Slider con decimales</CardTitle>
              <CardDescription>Control de valores decimales entre 0 y 1</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm rounded-md bg-muted p-3">
                Valor actual: <span className="font-mono font-medium">{valueDecimal.toFixed(2)}</span>
              </div>
              <SliderControl
                label="Valor decimal"
                min={0}
                max={1}
                step={0.01}
                value={valueDecimal}
                onChange={setValueDecimal}
                className="mb-2"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Slider con valores muy pequeños</CardTitle>
              <CardDescription>Control de valores de frecuencia (0.0001 - 0.01)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm rounded-md bg-muted p-3">
                Valor actual: <span className="font-mono font-medium">{valueSmall.toFixed(4)}</span>
              </div>
              <SliderControl
                label="Frecuencia"
                min={0.0001}
                max={0.01}
                step={0.0001}
                value={valueSmall}
                onChange={setValueSmall}
                className="mb-2"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Slider con rango amplio</CardTitle>
              <CardDescription>Control de valores grandes (0 - 1000)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm rounded-md bg-muted p-3">
                Valor actual: <span className="font-mono font-medium">{valueLarge}</span>
              </div>
              <SliderControl
                label="Valor grande"
                min={0}
                max={1000}
                step={5}
                value={valueLarge}
                onChange={setValueLarge}
                className="mb-2"
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-center mt-8">
            <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
              Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
