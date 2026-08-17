import { RoleProvider } from '@/components/role-provider'
import { AppShell } from '@/components/app-shell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  )
}
