'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Users, DollarSign, Bell, Check } from 'lucide-react'

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('OFIMATIC BAIX')
  const [industry, setIndustry] = useState('SaaS')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [dealUpdates, setDealUpdates] = useState(true)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('crm-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCompanyName(settings.companyName || 'OFIMATIC BAIX')
      setIndustry(settings.industry || 'SaaS')
      setEmailNotifications(settings.emailNotifications ?? true)
      setDealUpdates(settings.dealUpdates ?? true)
    }
  }, [])

  const handleSaveWorkspace = () => {
    // Save to localStorage
    const settings = {
      companyName,
      industry,
      emailNotifications,
      dealUpdates
    }
    localStorage.setItem('crm-settings', JSON.stringify(settings))

    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleEditUser = () => {
    alert('Funcionalidad de edición de usuario - Próximamente con backend')
  }

  const handleInviteUser = () => {
    alert('Funcionalidad de invitación - Próximamente con backend')
  }

  const handleManageSubscription = () => {
    alert('Redirigiendo a gestión de suscripción - Próximamente con Stripe/PayPal')
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Configuración</h1>
        <p className="text-xs md:text-sm text-white mt-1">Gestiona tu workspace y preferencias</p>
      </div>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Espacio de Trabajo
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Información básica de tu espacio de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Nombre de la Empresa
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Industria
            </label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
          </div>
          <Button
            onClick={handleSaveWorkspace}
            className="rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {showSaveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                ¡Guardado!
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Equipo
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Gestiona usuarios y permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Alex Saumell</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">alex@empresa.com • Owner</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditUser}
                className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
              >
                Editar
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
              onClick={handleInviteUser}
            >
              + Invitar Usuario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Suscripción
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Gestiona tu plan y facturación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Professional Plan</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">€39/usuario/mes</div>
              </div>
              <div className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full font-medium">
                Activo
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
            >
              Gestionar Suscripción
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Notificaciones
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Configura cómo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Email notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recibe updates por email</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => {
                  const newValue = e.target.checked
                  setEmailNotifications(newValue)
                  // Auto-save notification preferences
                  const settings = {
                    companyName,
                    industry,
                    emailNotifications: newValue,
                    dealUpdates
                  }
                  localStorage.setItem('crm-settings', JSON.stringify(settings))
                }}
                className="h-5 w-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Deal updates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Notificaciones de cambios en deals</div>
              </div>
              <input
                type="checkbox"
                checked={dealUpdates}
                onChange={(e) => {
                  const newValue = e.target.checked
                  setDealUpdates(newValue)
                  // Auto-save notification preferences
                  const settings = {
                    companyName,
                    industry,
                    emailNotifications,
                    dealUpdates: newValue
                  }
                  localStorage.setItem('crm-settings', JSON.stringify(settings))
                }}
                className="h-5 w-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
