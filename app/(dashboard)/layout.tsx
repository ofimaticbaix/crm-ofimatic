import { WorkspaceProvider } from '@/lib/context/workspace-context'
import { getWorkspaceWithProfile } from '@/lib/actions/workspace'
import { DashboardShell } from './_components/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Prefetch en el server para que la primera renderización ya tenga el
  // workspace correcto (logo, fondo, nombre). Evita el flash de OFIMATIC BAIX
  // → Metalher CRM al cargar.
  const result = await getWorkspaceWithProfile()
  return (
    <WorkspaceProvider initialData={result.data || null}>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  )
}
