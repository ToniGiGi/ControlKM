import { InsuranceList } from '@/components/insurances/insurance-list'
import { getInsurances, getVehicles, getInsuranceCompanies } from '@/app/actions/db'

export default async function SegurosPage() {
  const [insurances, vehicles, insuranceCompanies] = await Promise.all([
    getInsurances(),
    getVehicles(),
    getInsuranceCompanies()
  ])
  
  return <InsuranceList initialInsurances={insurances} vehicles={vehicles} insuranceCompanies={insuranceCompanies} />
}
