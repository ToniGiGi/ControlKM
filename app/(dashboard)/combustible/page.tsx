import { getFuelRequests, getVehicles } from '@/app/actions/db'
import { FuelRequestList } from '@/components/fuel/fuel-request-list'

export default async function CombustiblePage() {
  const requests = await getFuelRequests()
  const vehicles = await getVehicles()

  return <FuelRequestList initialRequests={requests} vehicles={vehicles} />
}
