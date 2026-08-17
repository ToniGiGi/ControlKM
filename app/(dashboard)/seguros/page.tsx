import { InsuranceList } from '@/components/insurances/insurance-list'
import { getInsurances, getVehicles, getInsuranceCompanies } from '@/app/actions/db'

export const dynamic = 'force-dynamic'

export default async function SegurosPage() {
  const insurances = await getInsurances()
  const vehicles = await getVehicles()
  const insuranceCompanies = await getInsuranceCompanies()
  
  return <InsuranceList initialInsurances={insurances} vehicles={vehicles} insuranceCompanies={insuranceCompanies} />
}
