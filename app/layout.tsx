import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ControlKM',
  description:
    'Plataforma integral para registrar, controlar y analizar los vehículos, empleados, gastos, mantenimientos, seguros y rastreo de tu flotilla empresarial.',
  generator: 'v0.app',
  icons: {
    icon: '/controlkmlogo.png'
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2f4bd6',
}

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'

import { auth } from '@/auth'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider userId={session?.user?.email || 'guest'}>
          <SessionProvider session={session}>
            {children}
            <Toaster richColors position="top-right" />
          </SessionProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
