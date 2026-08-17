import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'
import { getProfile } from '@/app/actions/profile'

export default async function PerfilPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const user = await getProfile(session.user.email!)
  
  if (!user) {
    return <div>Usuario no encontrado</div>
  }

  return <ProfileForm user={user} />
}
