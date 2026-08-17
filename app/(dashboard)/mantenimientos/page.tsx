import { getMaintenances, getVehicles } from '@/app/actions/db'
import { MaintenanceList } from '@/components/maintenances/maintenance-list'

export default async function MaintenancesPage() {
  const maintenances = await getMaintenances()
  const vehicles = await getVehicles()

  return <MaintenanceList initialMaintenances={maintenances} vehicles={vehicles} />
}
