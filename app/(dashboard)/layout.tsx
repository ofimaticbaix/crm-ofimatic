'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, TrendingUp, CheckSquare, Settings, Menu, X, LogOut, Upload, UserCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Empresas', href: '/companies', icon: Building2 },
  { name: 'Oportunidades', href: '/deals', icon: TrendingUp },
  { name: 'Tareas', href: '/tasks', icon: CheckSquare },
  { name: 'Clientes', href: '/clients', icon: UserCheck },
  { name: 'Importar', href: '/import', icon: Upload },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const formatDate = () => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }
    return date.toLocaleDateString('es-ES', options)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/images/background.png)' }}>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 glass-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo & Close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 dark:border-gray-700/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-base">O</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                OFIMATIC BAIX
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">CRM Platform</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800/20 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/30 hover:text-blue-600 dark:hover:text-blue-400"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive && "text-white"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-8 bg-white/50 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10 dark:border-gray-700/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-400/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">Alex Saumell</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate">alex@ofimaticbaix.com</div>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group">
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 glass-header flex items-center justify-between px-4 md:px-8 border-b border-white/10 dark:border-gray-700/20 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/20 dark:hover:bg-gray-800/30 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-400/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {formatDate()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/20">
              <span className="text-xs text-gray-600 dark:text-gray-400">Workspace:</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">OFIMATIC BAIX</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
