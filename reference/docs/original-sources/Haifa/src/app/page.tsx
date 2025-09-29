"use client"

import React, { useState } from 'react'
import { Header } from '@/components/Header'
import { FilterBar } from '@/components/FilterBar'
import { PropertyCard } from '@/components/PropertyCard'
import { Map } from '@/components/Map'
import { Footer } from '@/components/Footer'
import { properties, projects } from '@/data/properties'
import { ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react'

export default function Home() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const propertiesPerPage = 20
  const totalProperties = 4719 // As shown in the original site

  return (
    <>
      <Header />
      <FilterBar />

      <div className="flex h-[calc(100vh-128px)]">
        {/* Map Section - Left Side (40%) */}
        <div className="hidden lg:block w-2/5 h-full">
          <Map />
        </div>

        {/* Properties Section - Right Side (60%) */}
        <div className="w-full lg:w-3/5 h-full overflow-y-auto bg-gray-50">
          {/* Results Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  דירות למכירה בחיפה
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {totalProperties.toLocaleString()} דירות למכירה
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="p-4">
            {/* Featured Projects */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">פרויקטים חדשים באזור</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-gradient-to-l from-green-50 to-white rounded-lg p-4 border border-green-200">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.location}</p>
                          <p className="text-xs text-gray-500 mt-1">{project.developer}</p>
                        </div>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">חדש</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {project.roomsRange} חדרים
                        </span>
                        <span className="text-lg font-bold madlan-green">
                          מ-{(project.minPrice / 1000000).toFixed(1)}M ₪
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Properties */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }>
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {[1, 2, 3, 4, 5].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? 'bg-green-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className="px-2">...</span>

              <button
                onClick={() => setCurrentPage(95)}
                className="px-3 py-1 rounded hover:bg-gray-200"
              >
                95
              </button>

              <button
                className="p-2 rounded hover:bg-gray-200"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-white rounded-lg">
              <h3 className="font-semibold mb-2">דירות למכירה בחיפה</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                חיפה, עיר הנמל והתעשייה של ישראל, מציעה מגוון רחב של דירות למכירה.
                משכונות יוקרה על הכרמל ועד שכונות מתפתחות בחיפה התחתית,
                תמצאו כאן את הבית המושלם עבורכם. חיפה מתאפיינת בנופים מרהיבים,
                חיי תרבות עשירים ונגישות מעולה לכל חלקי הארץ.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
