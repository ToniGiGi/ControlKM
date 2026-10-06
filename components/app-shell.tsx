'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AppSidebar } from '@/components/app-sidebar'
import { Topbar } from '@/components/topbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // En celular el menú se cierra solo al navegar a otra página.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar escritorio */}
      <div className="hidden md:block transition-all duration-300 ease-in-out print:hidden">
        <AppSidebar isCollapsed={isCollapsed} />
      </div>

      {/* Sidebar móvil */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="data-[side=left]:w-[240px] gap-0 border-r-0 p-0 [&_[data-slot=sheet-close]]:text-white [&_[data-slot=sheet-close]]:hover:bg-white/10"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <AppSidebar isCollapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
        <div className="print:hidden">
          <Topbar 
            onMenu={() => setOpen(true)} 
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            isCollapsed={isCollapsed}
          />
        </div>
        <main className="flex-1 overflow-y-scroll print:overflow-visible">{children}</main>
      </div>
    </div>
  )
}
