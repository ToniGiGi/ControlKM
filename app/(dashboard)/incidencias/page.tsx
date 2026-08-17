import { getIncidents, getVehicles } from '@/app/actions/db'
import { IncidentList } from '@/components/incidents/incident-list'

export default async function IncidentsPage() {
  const incidents = await getIncidents()
  const vehicles = await getVehicles()

  return <IncidentList initialIncidents={incidents} vehicles={vehicles} />
}
