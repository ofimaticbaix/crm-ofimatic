'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const customerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const prospectIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const leadIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

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

interface CompaniesMapProps {
  companies: Company[]
  onCompanyClick?: (company: Company) => void
  onCheckIn?: (company: Company) => void
  selectedCompanyId?: string
  userLocation?: { lat: number; lng: number } | null
  className?: string
}

// Component to fit bounds to markers
function FitBounds({ companies }: { companies: Company[] }) {
  const map = useMap()

  useEffect(() => {
    if (companies.length > 0) {
      const bounds = L.latLngBounds(
        companies.map((c) => [c.latitude, c.longitude] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [companies, map])

  return null
}

// Component to show user location
function UserLocationMarker({ position }: { position: { lat: number; lng: number } }) {
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  return (
    <Marker position={[position.lat, position.lng]} icon={userIcon}>
      <Popup>
        <div className="text-center">
          <p className="font-medium">Tu ubicación</p>
        </div>
      </Popup>
    </Marker>
  )
}

function getIconForCompany(company: Company) {
  switch (company.account_type) {
    case 'customer':
      return customerIcon
    case 'prospect':
      return prospectIcon
    case 'lead':
      return leadIcon
    default:
      return defaultIcon
  }
}

export default function CompaniesMap({
  companies,
  onCompanyClick,
  onCheckIn,
  selectedCompanyId,
  userLocation,
  className = '',
}: CompaniesMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Cargando mapa...</p>
      </div>
    )
  }

  // Default center: Spain
  const defaultCenter: [number, number] = [40.4168, -3.7038]
  const center = companies.length > 0
    ? [companies[0].latitude, companies[0].longitude] as [number, number]
    : userLocation
      ? [userLocation.lat, userLocation.lng] as [number, number]
      : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={companies.length > 0 ? 10 : 6}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {companies.length > 0 && <FitBounds companies={companies} />}

      {userLocation && <UserLocationMarker position={userLocation} />}

      {companies.map((company) => (
        <Marker
          key={company.id}
          position={[company.latitude, company.longitude]}
          icon={getIconForCompany(company)}
          eventHandlers={{
            click: () => onCompanyClick?.(company),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
              {company.industry && (
                <p className="text-xs text-gray-500 mb-1">{company.industry}</p>
              )}
              {company.billing_address && (
                <p className="text-xs text-gray-600 mb-2">
                  {[
                    company.billing_address.street,
                    company.billing_address.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Llamar
                  </a>
                )}
                {onCheckIn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCheckIn(company)
                    }}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Check-in
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
