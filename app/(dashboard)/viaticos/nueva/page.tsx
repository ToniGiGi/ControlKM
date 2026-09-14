import { auth } from '@/auth'
import { TravelRequestForm } from '@/components/travel/travel-request-form'
import { getFuelRequests } from '@/app/actions/db'
import { getProfile } from '@/app/actions/profile'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NuevaSolicitudViaticosPage() {
  const session = await auth()
  const [fuelRequests, profile] = await Promise.all([
    getFuelRequests(),
    session?.user?.email ? getProfile(session.user.email) : Promise.resolve(null),
  ])

  const employee = profile?.employee
  const employeeArea = employee?.puesto || employee?.departamentoRef?.name || employee?.area || ''

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/viaticos">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <PageHeader
          title="Nueva Solicitud de Viáticos"
          description="Calculadora de comida, hospedaje y transporte."
        />
      </div>

      <TravelRequestForm fuelRequests={fuelRequests} defaultPuesto={employeeArea} />
    </div>
  )
}
