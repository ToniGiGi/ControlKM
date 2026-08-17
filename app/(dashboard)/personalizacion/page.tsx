'use client'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { Paintbrush, LayoutTemplate, Type, Settings2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

export default function PersonalizacionPage() {
  const { sidebarColor, setSidebarColor, primaryColor, setPrimaryColor } = useTheme()

  const colors = [
    { name: 'Azul Original', value: '#00173A' },
    { name: 'Azul Claro', value: '#1E3A8A' },
    { name: 'Verde QRQ', value: '#009142' },
    { name: 'Verde Esmeralda', value: '#064E3B' },
    { name: 'Verde Bosque', value: '#14532D' },
    { name: 'Rojo Carmesí', value: '#7F1D1D' },
    { name: 'Rojo Ladrillo', value: '#991B1B' },
    { name: 'Morado Noche', value: '#4C1D95' },
    { name: 'Púrpura Oscuro', value: '#581C87' },
    { name: 'Negro Pizarra', value: '#0F172A' },
    { name: 'Gris Carbón', value: '#1C1917' },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title="Personalización"
        description="Ajusta la apariencia y la experiencia de FleetControl a tu gusto."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Módulo de Color del Panel */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-primary" />
              <h3 className="font-semibold leading-none tracking-tight">Color del Panel Lateral</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Elige el color principal de la barra de navegación que mejor vaya con tu empresa.
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSidebarColor(color.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all"
                  )}
                  title={color.name}
                >
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full border-2 transition-transform group-hover:scale-110 shadow-sm",
                      sidebarColor === color.value ? "border-primary ring-4 ring-primary/20 scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    sidebarColor === color.value ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Módulo de Color de Botones */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-primary" />
              <h3 className="font-semibold leading-none tracking-tight">Color de Botones y Detalles</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Elige el color que tendrán los botones principales y los detalles de la aplicación.
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all"
                  )}
                  title={color.name}
                >
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full border-2 transition-transform group-hover:scale-110 shadow-sm",
                      primaryColor === color.value ? "border-primary ring-4 ring-primary/20 scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    primaryColor === color.value ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Próximos módulos (Placeholders) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden opacity-70">
          <div className="flex flex-col space-y-1.5 p-6 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold leading-none tracking-tight">Diseño de Dashboard (Próximamente)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Reorganiza las tarjetas y gráficas principales.
            </p>
          </div>
          <div className="p-6 flex items-center justify-center h-24 bg-muted/10">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> En desarrollo
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
