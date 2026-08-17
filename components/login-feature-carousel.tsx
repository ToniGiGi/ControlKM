'use client'

import { useState, useEffect } from 'react'
import { MapPin, BarChart3, Wrench, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: MapPin,
    title: 'Seguimiento en tiempo real',
    desc: 'Ubica y monitorea tus unidades 24/7.',
  },
  {
    icon: BarChart3,
    title: 'Reportes y analíticas',
    desc: 'Toma decisiones basadas en datos.',
  },
  {
    icon: Wrench,
    title: 'Mantenimiento preventivo',
    desc: 'Controla servicios y próximos mantenimientos.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad y confiabilidad',
    desc: 'Protegemos tu información y la de tu empresa.',
  },
]

export function LoginFeatureCarousel() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false)

      // After fade-out finishes, switch item and fade in
      setTimeout(() => {
        setActive((prev) => (prev + 1) % features.length)
        setVisible(true)
      }, 500)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const Feature = features[active]
  const Icon = Feature.icon

  return (
    <div className="relative h-20 w-full">
      <div
        className="absolute inset-0 flex items-center gap-5 transition-all duration-500 ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
        }}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25 backdrop-blur-sm">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold text-white leading-tight drop-shadow">{Feature.title}</h3>
          <p className="text-[14px] text-slate-400 mt-1">{Feature.desc}</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute -bottom-7 left-0 flex gap-2.5">
        {features.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === active ? '28px' : '8px',
              backgroundColor: i === active ? '#3b82f6' : 'rgba(148,163,184,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
