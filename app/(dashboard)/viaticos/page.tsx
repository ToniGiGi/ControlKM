import { getTravelRequests } from '@/app/actions/db'
import { TravelRequestList } from '@/components/travel/travel-request-list'

export default async function ViaticosPage() {
  const requests = await getTravelRequests()

  return <TravelRequestList initialRequests={requests} />
}
