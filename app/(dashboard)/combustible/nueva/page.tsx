import { auth } from '@/auth'
import { getVehicles, getDepartments } from '@/app/actions/db'
import { getProfile } from '@/app/actions/profile'
import { FuelRequestForm } from '@/components/fuel/fuel-request-form'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NuevaSolicitudCombustiblePage() {
  const session = await auth()
  const [vehicles, departments, profile] = await Promise.all([
    getVehicles(),
    getDepartments(),
    session?.user?.email ? getProfile(session.user.email) : Promise.resolve(null),
  ])

  const defaultDepartamentoId = profile?.employee?.departamentoId || ''

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/combustible">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <PageHeader
          title="Nueva Solicitud de Viáticos"
          description="Calculadora inteligente de combustible y peajes."
        />
      </div>

      <FuelRequestForm vehicles={vehicles} departments={departments} defaultDepartamentoId={defaultDepartamentoId} />
    </div>
  )
}
