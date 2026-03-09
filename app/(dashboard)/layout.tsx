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
      <aside className="w-20 hover:w-64 transition-all duration-300 glass-sidebar flex flex-col group">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center group-hover:justify-start group-hover:px-6 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <span className="ml-3 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ofimàtic Baix
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-8 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-indigo-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all group/item relative"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.name}
                </span>
                <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10 dark:border-gray-700/20">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
              AG
            </div>
            <div className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
              <div className="text-xs font-medium text-gray-900 dark:text-white">Alex García</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">alex@empresa.com</div>
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
