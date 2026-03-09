import Link from 'next/link'
import { LayoutDashboard, Users, Building2, TrendingUp, CheckSquare, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const navigation = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Empresas', href: '/companies', icon: Building2 },
  { name: 'Oportunidades', href: '/deals', icon: TrendingUp },
  { name: 'Tareas', href: '/tasks', icon: CheckSquare },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/images/background.png)' }}>
      {/* Sidebar */}
      <aside className="w-64 glass-sidebar flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/20 dark:border-gray-700/30">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            CRM AI-Native
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white transition-all backdrop-blur-sm"
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/20 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg">
              AG
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Alex García</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">alex@empresa.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="h-16 glass-header flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Espacio: <span className="font-medium text-gray-900 dark:text-white">Ofimàtic Baix</span>
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
