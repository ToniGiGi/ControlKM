import { LoginForm } from '@/components/login-form'
import { LoginFeatureCarousel } from '@/components/login-feature-carousel'
import { Truck, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params?.error === 'CredentialsSignin'
    ? 'Credenciales inválidas. Por favor intenta de nuevo.'
    : ''

  return (
    <div className="flex min-h-screen">

      {/* ─── LEFT PANEL: Full background image + overlay + content ─── */}
      <div className="hidden lg:flex w-[52%] relative overflow-hidden">

        {/* Background image — fills entire panel */}
        <Image
          src="/vehiculos-login.png"
          alt="Flotilla de Vehículos"
          fill
          className="object-cover object-center"
          priority
        />

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1A2F]/80 via-[#0A1A2F]/50 to-[#0A1A2F]/70 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1A2F]/50 to-transparent z-[1]" />

        {/* Content on top of image */}
        <div className="relative z-10 flex flex-1 flex-col justify-between px-14 xl:px-20 py-14">

          {/* Top + center content */}
          <div className="flex flex-col justify-center flex-1">



            {/* Headline */}
            <h1 className="text-[2.6rem] xl:text-[3.2rem] font-bold leading-[1.1] tracking-tight text-white drop-shadow-lg">
              Control total.<br />
              Tu flotilla,<br />
              <span className="text-blue-400">siempre en movimiento.</span>
            </h1>

            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-300/90 drop-shadow">
              Plataforma inteligente para el seguimiento y administración de tu flotilla en tiempo real.
            </p>
          </div>

          {/* Animated single feature — bottom-left, bigger */}
          <div className="mt-auto pt-8">
            <LoginFeatureCarousel />
          </div>

          {/* Bottom tagline */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400/80 pt-10">
            <ShieldCheck className="size-3.5" />
            <span>Tu flotilla. Tu negocio. Nuestro compromiso.</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Login form ─── */}
      <div className="flex w-full flex-col items-center justify-center bg-[#F7F8FA] px-6 sm:px-10 lg:w-[48%]">
        <div className="w-full max-w-[400px] rounded-2xl border border-slate-200/80 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

          {/* Logo Qrubyx */}
          <div className="mb-8 flex flex-col items-center">
            {/* Texto de la marca */}
            <div className="flex items-baseline">
              <h1 className="text-[36px] font-black tracking-tighter text-slate-900" style={{ letterSpacing: '-0.06em' }}>
                Qrubyx
              </h1>
              <div className="w-2 h-2 bg-[#10b981] rounded-full ml-0.5"></div>
            </div>
            
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Seguimiento de Flotillas
            </p>
          </div>

          {/* Welcome text */}
          <div className="mb-7 text-center">
            <h2 className="text-xl font-bold text-slate-900">Bienvenido de nuevo</h2>
            <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
          </div>

          <LoginForm initialError={errorMessage} />

          <p className="mt-8 text-center text-[11px] text-slate-400">
            © 2026 Qrubyx. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
