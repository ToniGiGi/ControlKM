import { getExpenses, getVehicles, getMaintenances, getFuelRequests, getIncidents } from '@/app/actions/db'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export default async function ReportsPage() {
  // Fetch all necessary data for global reports
  const expenses = await getExpenses()
  const vehicles = await getVehicles()
  const maintenances = await getMaintenances()
  const fuelRequests = await getFuelRequests()
  const incidents = await getIncidents()

  return (
    <ReportsDashboard 
      expenses={expenses} 
      vehicles={vehicles}
      maintenances={maintenances}
      fuelRequests={fuelRequests}
      incidents={incidents}
    />
  )
}
