import { getFuelRequests } from '@/app/actions/db'
import { TripList } from '@/components/trips/trip-list'

export default async function TripsPage() {
  // Obtenemos todas las solicitudes de combustible
  const fuelRequests = await getFuelRequests()

  // Filtramos solo las que están aprobadas, ya que son los viajes reales confirmados
  const approvedTrips = fuelRequests.filter(req => req.estado === 'APROBADA')

  return <TripList initialTrips={approvedTrips} />
}
