'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter()
  const [error, setError] = useState(initialError)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Cargar email guardado si existe
  useEffect(() => {
    const savedEmail = localStorage.getItem('fleetcore_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const submittedEmail = formData.get('email') as string
    const password = formData.get('password') as string

    // Lógica de Recordarme
    if (rememberMe) {
      localStorage.setItem('fleetcore_remembered_email', submittedEmail)
    } else {
      localStorage.removeItem('fleetcore_remembered_email')
    }

    try {
      const res = await signIn('credentials', {
        email: submittedEmail,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Credenciales inválidas. Por favor intenta de nuevo.')
        setLoading(false)
      } else if (res?.ok) {
        router.refresh()
        router.push('/')
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        
        {/* Email Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500 h-11 rounded-lg"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            required
            className="pl-10 pr-10 bg-white border-slate-200 focus-visible:ring-blue-500 h-11 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer"
            >
              Recordarme
            </label>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              ¿Olvidaste tu contraseña?
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
                <AlertDialogDescription>
                  Por razones de seguridad, para recuperar o cambiar tu contraseña debes comunicarte con el administrador principal del sistema.
                  <br /><br />
                  Por favor, envía un correo a: <strong className="text-foreground">tonygarcia692@gmail.com</strong> solicitando tu nueva contraseña temporal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Entendido</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-500 text-center">{error}</p>
      )}

      <div className="space-y-4 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg font-medium shadow-sm transition-colors"
        >
          <User className="mr-2 h-4 w-4" />
          {loading ? 'Iniciando...' : 'Iniciar sesión'}
        </Button>
      </div>
    </form>
  )
}
