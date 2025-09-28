"use client"

import React, { useState } from 'react'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'

export const FilterBar = () => {
  const [selectedType, setSelectedType] = useState('דירות')
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const propertyTypes = ['דירות', 'בתים', 'דופלקס', 'פנטהאוז', 'דירות גן', 'קוטג׳', 'יחידות דיור']
  const roomOptions = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6+']

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        {/* Main Filter Row */}
        <div className="flex items-center gap-4 py-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש חופשי - עיר, שכונה, רחוב"
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Property Type */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span>{selectedType}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Rooms */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span>חדרים</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="מחיר מ-"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            />
            <span className="text-gray-500">-</span>
            <input
              type="text"
              placeholder="עד"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>סינון מתקדם</span>
          </button>

          {/* Search Button */}
          <button className="px-6 py-2 madlan-green-bg text-white rounded-lg hover:opacity-90 transition">
            חיפוש
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="py-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קומה</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">הכל</option>
                  <option value="0">קרקע</option>
                  <option value="1-3">1-3</option>
                  <option value="4-6">4-6</option>
                  <option value="7+">7+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שטח (מ״ר)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="מ-"
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="עד"
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מאפיינים</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded text-green-500" />
                    <span>חניה</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded text-green-500" />
                    <span>מעלית</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded text-green-500" />
                    <span>מרפסת</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כניסה</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">הכל</option>
                  <option value="immediate">מיידית</option>
                  <option value="flexible">גמישה</option>
                  <option value="future">עתידית</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
