"use client"

import React from 'react'
import Image from 'next/image'
import { MapPin, Maximize2, Building, Car, ArrowUp, Heart } from 'lucide-react'
import { Property } from '@/data/properties'

interface PropertyCardProps {
  property: Property
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="property-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group">
      {/* Image */}
      <div className="relative h-40 w-full">
        <Image
          src={property.image}
          alt={property.address}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Favorite button */}
        <button className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
        </button>
        {property.isNew && (
          <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            חדש
          </span>
        )}
        {property.projectName && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {property.projectName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Price */}
        <div className="mb-2">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(property.price)}
          </span>
          {property.type && (
            <span className="text-xs text-gray-600 mr-2">{property.type}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 mb-2">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="text-xs truncate">
            {property.address}, {property.neighborhood}
          </span>
        </div>

        {/* Details */}
        <div className="flex items-center gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-gray-400" />
            <span>{property.rooms} חד׳</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3 text-gray-400" />
            <span>{property.size} מ״ר</span>
          </div>
          {property.floor && (
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-gray-400" />
              <span>ק׳ {property.floor}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          {property.parking && (
            <span className="flex items-center gap-0.5 text-xs text-gray-600">
              <Car className="h-3 w-3" />
              <span className="text-[10px]">חניה</span>
            </span>
          )}
          {property.elevator && (
            <span className="text-[10px] text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded">מעלית</span>
          )}
          {property.balcony && (
            <span className="text-[10px] text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded">מרפסת</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCard
