'use client'

import { useEffect, useState } from 'react'

export type ListView = 'grid' | 'table'

// Vista inicial de los módulos: lista (tabla con columnas) en computadora.
// En celular se queda en tarjetas porque la tabla no cabe a lo ancho.
export function useListView() {
  const [view, setView] = useState<ListView>('table')

  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setView('grid')
  }, [])

  return [view, setView] as const
}
