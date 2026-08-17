'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  sidebarColor: string
  setSidebarColor: (color: string) => void
  primaryColor: string
  setPrimaryColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  sidebarColor: '#00173A',
  setSidebarColor: () => {},
  primaryColor: '#0047AB',
  setPrimaryColor: () => {},
})

export function ThemeProvider({ children, userId }: { children: React.ReactNode, userId?: string }) {
  const [sidebarColor, setSidebarColorState] = useState('#00173A')
  const [primaryColor, setPrimaryColorState] = useState('#0047AB')
  const [isMounted, setIsMounted] = useState(false)
  
  const uid = userId || 'guest'

  useEffect(() => {
    setIsMounted(true)
    const savedSidebar = localStorage.getItem(`sidebar-color-${uid}`)
    if (savedSidebar) setSidebarColorState(savedSidebar)
    
    const savedPrimary = localStorage.getItem(`primary-color-${uid}`)
    if (savedPrimary) setPrimaryColorState(savedPrimary)
  }, [uid])

  const setSidebarColor = (color: string) => {
    setSidebarColorState(color)
    localStorage.setItem(`sidebar-color-${uid}`, color)
  }

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color)
    localStorage.setItem(`primary-color-${uid}`, color)
  }

  return (
    <ThemeContext.Provider value={{ 
      sidebarColor: isMounted ? sidebarColor : '#00173A', 
      setSidebarColor,
      primaryColor: isMounted ? primaryColor : '#0047AB',
      setPrimaryColor
    }}>
      {isMounted && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary: ${primaryColor};
            --ring: ${primaryColor};
          }
          .dark {
            --primary: ${primaryColor};
            --ring: ${primaryColor};
          }
        `}} />
      )}
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
