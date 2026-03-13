'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MapPin, Search, Navigation, CheckCircle, X, Building2,
  Phone, Mail, Clock, Loader2, RefreshCw, Filter
} from 'lucide-react'
import { useWorkspace } from '@/lib/context/workspace-context'
import { getGeocodedCompanies, geocodeAllCompanies } from '@/lib/actions/geocoding'
import { checkIn, getActiveVisit } from '@/lib/actions/visits'

// Dynamic import to avoid SSR issues with Leaflet
const CompaniesMap = dynamic(
  () => import('@/components/map/companies-map'),
  {
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
    ssr: false,
  }
)

interface Company {
  id: string
  name: string
  latitude: number
  longitude: number
  industry?: string
  account_type?: string
  account_status?: string
  billing_address?: Record<string, string>
  phone?: string
  email?: string
}

export default function MapPage() {
  const { workspaceId } = useWorkspace()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [activeVisit, setActiveVisit] = useState<any>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInCompany, setCheckInCompany] = useState<Company | null>(null)
  const [checkInPurpose, setCheckInPurpose] = useState('')

  // Load companies
  useEffect(() => {
    if (!workspaceId) return

    const loadData = async () => {
      setLoading(true)
      const [companiesRes, activeVisitRes] = await Promise.all([
        getGeocodedCompanies(workspaceId),
        getActiveVisit(workspaceId),
      ])

      if (companiesRes.data) {
        setCompanies(companiesRes.data as Company[])
      }
      if (activeVisitRes.data) {
        setActiveVisit(activeVisitRes.data)
      }
      setLoading(false)
    }

    loadData()
  }, [workspaceId])

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationError(null)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permiso de ubicación denegado')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Ubicación no disponible')
            break
          case error.TIMEOUT:
            setLocationError('Tiempo de espera agotado')
            break
          default:
            setLocationError('Error obteniendo ubicación')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  // Geocode companies without coordinates
  const handleGeocodeAll = async () => {
    if (!workspaceId) return
    setGeocoding(true)
    const result = await geocodeAllCompanies(workspaceId)
    // Reload companies
    const companiesRes = await getGeocodedCompanies(workspaceId)
    if (companiesRes.data) {
      setCompanies(companiesRes.data as Company[])
    }
    setGeocoding(false)
    alert(`Geocodificadas ${result.processed} empresas. Errores: ${result.errors}`)
  }

  // Handle check-in
  const handleCheckIn = async (company: Company) => {
    setCheckInCompany(company)
    setShowCheckInModal(true)
  }

  const confirmCheckIn = async () => {
    if (!workspaceId || !checkInCompany) return

    setCheckingIn(true)
    const result = await checkIn(workspaceId, {
      company_id: checkInCompany.id,
      purpose: checkInPurpose || undefined,
      check_in_latitude: userLocation?.lat,
      check_in_longitude: userLocation?.lng,
    })

    if (result.error) {
      alert(result.error)
    } else {
      setActiveVisit(result.data)
      setShowCheckInModal(false)
      setCheckInCompany(null)
      setCheckInPurpose('')
    }
    setCheckingIn(false)
  }

  // Filter companies
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === 'all' || company.account_type === filterType

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mapa de Empresas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {companies.length} empresas geolocalizadas
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="pl-10 w-64 rounded-xl dark:bg-gray-800/50 dark:border-gray-700"
            />
          </div>

          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl px-3 py-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los tipos</option>
            <option value="customer">Clientes</option>
            <option value="prospect">Prospectos</option>
            <option value="lead">Leads</option>
            <option value="partner">Partners</option>
          </select>

          {/* Get location button */}
          <Button
            variant="outline"
            onClick={getUserLocation}
            className="rounded-xl gap-2"
          >
            <Navigation className="h-4 w-4" />
            Mi ubicación
          </Button>

          {/* Geocode all button */}
          <Button
            variant="outline"
            onClick={handleGeocodeAll}
            disabled={geocoding}
            className="rounded-xl gap-2"
          >
            {geocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Geocodificar
          </Button>
        </div>
      </div>

      {/* Active visit banner */}
      {activeVisit && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Visita activa en {activeVisit.companies?.name}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Check-in: {new Date(activeVisit.check_in_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-green-500 text-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                onClick={() => {
                  // Navigate to check-out (could open modal or redirect)
                  window.location.href = `/visits?checkout=${activeVisit.id}`
                }}
              >
                Hacer Check-out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location error */}
      {locationError && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{locationError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={getUserLocation}
                className="ml-auto text-yellow-700 hover:text-yellow-800"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <CompaniesMap
                companies={filteredCompanies}
                userLocation={userLocation}
                onCompanyClick={setSelectedCompany}
                onCheckIn={handleCheckIn}
                selectedCompanyId={selectedCompany?.id}
                className="h-[600px] rounded-xl"
              />
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Clientes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Prospectos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Leads</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected company */}
          {selectedCompany && (
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Empresa seleccionada</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompany(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {selectedCompany.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedCompany.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedCompany.industry || 'Sin industria'}
                    </p>
                  </div>
                </div>

                {selectedCompany.phone && (
                  <a
                    href={`tel:${selectedCompany.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedCompany.phone}
                  </a>
                )}

                {selectedCompany.email && (
                  <a
                    href={`mailto:${selectedCompany.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedCompany.email}
                  </a>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => handleCheckIn(selectedCompany)}
                    className="w-full rounded-xl gap-2"
                    disabled={!!activeVisit}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {activeVisit ? 'Ya tienes visita activa' : 'Hacer Check-in'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl gap-2"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedCompany.latitude},${selectedCompany.longitude}`,
                        '_blank'
                      )
                    }
                  >
                    <Navigation className="h-4 w-4" />
                    Cómo llegar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company list */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Empresas cercanas ({filteredCompanies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 max-h-[300px] overflow-y-auto space-y-2">
              {filteredCompanies.slice(0, 10).map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    selectedCompany?.id === company.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                      : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {company.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {company.billing_address?.city || company.industry || '-'}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check-in modal */}
      {showCheckInModal && checkInCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Check-in</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCheckInModal(false)
                  setCheckInCompany(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {checkInCompany.name}
                  </p>
                  {checkInCompany.billing_address?.city && (
                    <p className="text-sm text-gray-500">
                      {checkInCompany.billing_address.city}
                    </p>
                  )}
                </div>
              </div>

              {userLocation && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <MapPin className="h-4 w-4" />
                  Ubicación capturada
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                  Propósito de la visita (opcional)
                </label>
                <Input
                  value={checkInPurpose}
                  onChange={(e) => setCheckInPurpose(e.target.value)}
                  placeholder="Ej: Presentación de producto, seguimiento..."
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmCheckIn}
                  disabled={checkingIn}
                  className="flex-1 rounded-xl gap-2"
                >
                  {checkingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Confirmar Check-in
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCheckInModal(false)
                    setCheckInCompany(null)
                  }}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
