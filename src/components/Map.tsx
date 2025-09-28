"use client"

import React, { useRef, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Property locations in Haifa
const propertyLocations = [
  { id: 1, longitude: 34.9892, latitude: 32.8156, price: "₪2,400,000", rooms: 4.5, address: "רחוב בן גוריון 65" },
  { id: 2, longitude: 35.0092, latitude: 32.8056, price: "₪3,950,000", rooms: 7, address: "רחוב הרצל 45" },
  { id: 3, longitude: 34.9792, latitude: 32.7956, price: "₪2,600,000", rooms: 5, address: "רחוב המגינים" },
  { id: 4, longitude: 34.9992, latitude: 32.8256, price: "₪1,320,000", rooms: 3.5, address: "רחוב הגיבורים" },
  { id: 5, longitude: 35.0042, latitude: 32.8106, price: "₪1,700,000", rooms: 3, address: "רחוב הרופא 10" },
  { id: 6, longitude: 34.9842, latitude: 32.8206, price: "₪810,000", rooms: 3, address: "רחוב העלייה 19" },
  { id: 7, longitude: 35.0142, latitude: 32.8006, price: "₪1,850,000", rooms: 3, address: "רחוב הנביאים" },
  { id: 8, longitude: 34.9942, latitude: 32.7906, price: "₪2,640,000", rooms: 4, address: "רחוב מוריה" },
  { id: 9, longitude: 34.9692, latitude: 32.8306, price: "₪1,600,000", rooms: 4, address: "רחוב ארלוזורוב 109" },
  { id: 10, longitude: 35.0192, latitude: 32.7856, price: "₪2,600,000", rooms: 5, address: "רחוב החרמון 19" },
  { id: 11, longitude: 34.9742, latitude: 32.8156, price: "₪2,550,000", rooms: 4, address: "רחוב הפרחים 10" },
  { id: 12, longitude: 35.0092, latitude: 32.7756, price: "₪4,500,000", rooms: 7, address: "רחוב יפה נוף 18" },
]

// Haifa center coordinates
const haifaCenter = { longitude: 34.9992, latitude: 32.8056 }

export const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [popupInfo, setPopupInfo] = useState<typeof propertyLocations[0] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Avoid multiple map initializations
    if (map.current) return
    if (!mapContainer.current) return

    // Dynamic import to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      if (!mapContainer.current) return

      // Initialize map
      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [haifaCenter.longitude, haifaCenter.latitude],
        zoom: 13,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      })

      // Wait for map to load
      map.current.on('load', () => {
        setIsLoading(false)

        // Add markers for each property
        propertyLocations.forEach((property) => {
          // Create marker element
          const markerElement = document.createElement('div')
          markerElement.className = 'mapbox-marker'
          markerElement.innerHTML = '₪'

          // Style the marker
          Object.assign(markerElement.style, {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          })

          // Add hover effects
          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.backgroundColor = '#059669'
            markerElement.style.transform = 'scale(1.1)'
          })

          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.backgroundColor = '#10b981'
            markerElement.style.transform = 'scale(1)'
          })

          // Add click handler
          markerElement.addEventListener('click', (e) => {
            e.stopPropagation()
            setPopupInfo(property)
          })

          // Create and add marker to map
          new mapboxgl.default.Marker(markerElement)
            .setLngLat([property.longitude, property.latitude])
            .addTo(map.current)
        })
      })

      // Handle map errors
      map.current.on('error', (e: any) => {
        console.error('Mapbox error:', e)
        setIsLoading(false)
      })
    }).catch((error) => {
      console.error('Failed to load Mapbox:', error)
      setIsLoading(false)
    })

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Close popup when clicking on map
  useEffect(() => {
    if (!map.current) return

    const handleMapClick = () => {
      setPopupInfo(null)
    }

    map.current.on('click', handleMapClick)

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick)
      }
    }
  }, [])

  return (
    <div className="map-container relative h-full w-full">
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <span className="text-sm text-gray-600">טוען מפה...</span>
          </div>
        </div>
      )}

      {/* Property popup */}
      {popupInfo && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20 max-w-xs">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            onClick={() => setPopupInfo(null)}
          >
            ×
          </button>
          <div className="text-right" dir="rtl">
            <div className="font-bold text-lg text-green-600 mb-1">{popupInfo.price}</div>
            <div className="text-sm text-gray-600 mb-1">{popupInfo.address}</div>
            <div className="text-sm text-gray-500">{popupInfo.rooms} חדרים</div>
          </div>
        </div>
      )}

      {/* Search in area button */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
          <MapPin className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">חיפוש באזור זה</span>
        </button>
      </div>

      {/* Properties count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 z-10">
        <span className="text-sm font-medium text-gray-700">
          {propertyLocations.length} נכסים באזור
        </span>
      </div>

      {/* Custom styles for markers */}
      <style jsx>{`
        .mapbox-marker {
          cursor: pointer;
        }
        .mapbox-marker:hover {
          z-index: 1000;
        }
      `}</style>
    </div>
  )
}

// Export with the same name to maintain compatibility
export { MapComponent as Map }