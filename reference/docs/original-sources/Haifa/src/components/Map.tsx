"use client"

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Import Leaflet types and functions
import type { LatLngExpression } from 'leaflet'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Property locations in Haifa
const propertyLocations = [
  { id: 1, position: [32.8156, 34.9892] as LatLngExpression, price: "₪2,400,000", rooms: 4.5, address: "רחוב בן גוריון 65" },
  { id: 2, position: [32.8056, 35.0092] as LatLngExpression, price: "₪3,950,000", rooms: 7, address: "רחוב הרצל 45" },
  { id: 3, position: [32.7956, 34.9792] as LatLngExpression, price: "₪2,600,000", rooms: 5, address: "רחוב המגינים" },
  { id: 4, position: [32.8256, 34.9992] as LatLngExpression, price: "₪1,320,000", rooms: 3.5, address: "רחוב הגיבורים" },
  { id: 5, position: [32.8106, 35.0042] as LatLngExpression, price: "₪1,700,000", rooms: 3, address: "רחוב הרופא 10" },
  { id: 6, position: [32.8206, 34.9842] as LatLngExpression, price: "₪810,000", rooms: 3, address: "רחוב העלייה 19" },
  { id: 7, position: [32.8006, 35.0142] as LatLngExpression, price: "₪1,850,000", rooms: 3, address: "רחוב הנביאים" },
  { id: 8, position: [32.7906, 34.9942] as LatLngExpression, price: "₪2,640,000", rooms: 4, address: "רחוב מוריה" },
  { id: 9, position: [32.8306, 34.9692] as LatLngExpression, price: "₪1,600,000", rooms: 4, address: "רחוב ארלוזורוב 109" },
  { id: 10, position: [32.7856, 35.0192] as LatLngExpression, price: "₪2,600,000", rooms: 5, address: "רחוב החרמון 19" },
  { id: 11, position: [32.8156, 34.9742] as LatLngExpression, price: "₪2,550,000", rooms: 4, address: "רחוב הפרחים 10" },
  { id: 12, position: [32.7756, 35.0092] as LatLngExpression, price: "₪4,500,000", rooms: 7, address: "רחוב יפה נוף 18" },
]

// Haifa center coordinates
const haifaCenter: LatLngExpression = [32.8056, 34.9992]

export const Map = () => {
  useEffect(() => {
    // Fix for Leaflet marker icon issue
    if (typeof window !== 'undefined') {
      // Use dynamic import instead of require
      import('leaflet').then((L) => {
        const DefaultIcon = L.Icon.Default as typeof L.Icon.Default & {
          prototype: { _getIconUrl?: unknown }
        }
        delete DefaultIcon.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
      })
    }
  }, [])

  return (
    <div className="map-container relative h-full w-full">
      <MapContainer
        center={haifaCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {propertyLocations.map((property) => (
          <Marker key={property.id} position={property.position}>
            <Popup>
              <div className="text-right" dir="rtl">
                <div className="font-bold text-lg madlan-green">{property.price}</div>
                <div className="text-sm text-gray-600">{property.address}</div>
                <div className="text-sm">{property.rooms} חדרים</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
          <MapPin className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">חיפוש באזור זה</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 z-10">
        <span className="text-sm font-medium text-gray-700">
          {propertyLocations.length} נכסים באזור
        </span>
      </div>
    </div>
  )
}
