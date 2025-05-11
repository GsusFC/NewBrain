/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Habilita el modo oscuro basado en la clase '.dark' en <html>
  content: [
    // Rutas actualizadas para apuntar al directorio src/
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Eliminado ya que parece que usas App Router
  ],
  theme: {
    container: { // Configuración opcional para la clase 'container' de Tailwind
      center: true,
      padding: "2rem", // Padding por defecto para los contenedores
      screens: {
        "2xl": "1400px", // Breakpoint máximo para el contenedor
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Colores de Sidebar (si quieres utilidades de Tailwind como bg-sidebar, text-sidebar-foreground)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: {
            DEFAULT: "hsl(var(--sidebar-primary))",
            foreground: "hsl(var(--sidebar-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--sidebar-accent))",
            foreground: "hsl(var(--sidebar-accent-foreground))",
          },
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        }
      },
      borderRadius: { // Mapeo de la variable --radius
        // Si --radius es "0rem", estas clases no tendrán mucho efecto de redondeo visible
        // a menos que los ajustes (-2px, -4px) resulten en valores negativos (lo cual no es válido).
        // Si --radius fuera, por ejemplo, "0.5rem", entonces esto tendría más sentido.
        // Por ahora, con "0rem", podrías omitir 'md' y 'sm' o definirlos como '0rem' también.
        lg: "var(--radius)",
        md: "var(--radius)", // O calc(var(--radius) - 2px) si --radius es > 0
        sm: "var(--radius)", // O calc(var(--radius) - 4px) si --radius es > 0
      },
      fontFamily: { // Mapeo de las variables de fuente
        // Si usas next/font y defines --font-geist-mono, la referencia sería:
        // sans: ['var(--font-geist-mono)', /* fallbacks */ ],
        // Si no, Tailwind usará directamente lo definido en la variable CSS --font-sans.
        // Para que Tailwind genere clases como font-sans, font-serif, etc., que usen tus variables:
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: { // Mapeo de tus variables de sombra personalizadas
        '2xs': 'var(--shadow-2xs)',
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow)', // Para usar solo `shadow`
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      keyframes: { // Necesario para algunos componentes de shadcn/ui como Accordion
        "accordion-down": {
          from: { height: "0" }, // Usar string para '0'
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }, // Usar string para '0'
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate") // Plugin para animaciones, usado por shadcn/ui
  ],
}
