import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Users, DollarSign, Bell, Lock } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestiona tu workspace y preferencias</p>
      </div>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace
          </CardTitle>
          <CardDescription>
            Información básica de tu workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Nombre del Workspace
            </label>
            <Input defaultValue="Mi Empresa" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Industria
            </label>
            <Input defaultValue="SaaS" />
          </div>
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipo
          </CardTitle>
          <CardDescription>
            Gestiona usuarios y permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Alex García</div>
                <div className="text-sm text-gray-500">alex@empresa.com • Owner</div>
              </div>
              <Button variant="outline" size="sm">Editar</Button>
            </div>
            <Button variant="outline" className="w-full">+ Invitar Usuario</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Suscripción
          </CardTitle>
          <CardDescription>
            Gestiona tu plan y facturación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">Professional Plan</div>
                <div className="text-sm text-gray-500">€39/usuario/mes</div>
              </div>
              <div className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                Activo
              </div>
            </div>
            <Button variant="outline">Gestionar Suscripción</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email notifications</div>
                <div className="text-sm text-gray-500">Recibe updates por email</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Deal updates</div>
                <div className="text-sm text-gray-500">Notificaciones de cambios en deals</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
