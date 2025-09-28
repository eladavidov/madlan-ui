"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import { FilterBar } from '@/components/FilterBar'
import PropertyCard from '@/components/PropertyCardHaifa'
import { Map } from '@/components/Map'
import Footer from '@/components/Footer'
import propertyService from '@/data/dal/propertyService'
import { Property, Project } from '@/data/dal/types'
import { ChevronLeft, ChevronRight, Grid3X3, List, MapPin, X, Loader2 } from 'lucide-react'

export default function SearchResults() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileMap, setShowMobileMap] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const propertiesPerPage = 20

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load search results for Haifa (maintaining existing behavior)
      const searchResult = await propertyService.getPropertiesByCity('חיפה', currentPage, propertiesPerPage)

      setProperties(searchResult.properties)
      setProjects(searchResult.projects)
      setTotal(searchResult.total)
    } catch (err) {
      setError('שגיאה בטעינת הנתונים. אנא נסה שוב.')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  // Load data on component mount and when page changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="bg-gray-300 h-4 rounded w-3/4"></div>
              <div className="bg-gray-300 h-4 rounded w-1/2"></div>
              <div className="bg-gray-300 h-6 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Error component
  const ErrorMessage = () => (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">
        <X className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">שגיאה בטעינת הנתונים</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={loadData}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        נסה שוב
      </button>
    </div>
  )

  const totalPages = Math.ceil(total / propertiesPerPage)

  return (
    <>
      <Header />
      <FilterBar />

      {/* Map Toggle Button for Mobile - appears only on small screens */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={() => setShowMobileMap(true)}
            className="flex items-center gap-2 px-4 py-2 madlan-green-bg text-white rounded-lg hover:opacity-90 transition w-full justify-center"
          >
            <MapPin className="h-5 w-5" />
            <span>הצג מפה</span>
          </button>
        </div>
      </div>

      {/* Mobile Map Overlay */}
      {showMobileMap && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-white">
            {/* Close button */}
            <button
              onClick={() => setShowMobileMap(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>

            {/* Fullscreen map */}
            <div className="w-full h-full">
              <Map />
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-192px)] lg:h-[calc(100vh-128px)]">
        {/* Properties Section - Left Side (60%) */}
        <div className="w-full lg:w-3/5 h-full overflow-y-auto bg-gray-50">
          {/* Results Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  תוצאות חיפוש נכסים
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      טוען...
                    </span>
                  ) : (
                    `${total.toLocaleString()} נכסים נמצאו`
                  )}
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

          {/* Content */}
          <div className="p-4">
            {error ? (
              <ErrorMessage />
            ) : (
              <>
                {/* Featured Projects */}
                {!loading && projects.length > 0 && (
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
                )}

                {/* Properties List */}
                {loading ? (
                  <LoadingSkeleton />
                ) : properties.length > 0 ? (
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-4'
                  }>
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <MapPin className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו נכסים</h3>
                    <p className="text-gray-600">נסה לשנות את קריטריוני החיפוש</p>
                  </div>
                )}

                {/* Pagination */}
                {!loading && properties.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className={`px-3 py-1 rounded ${
                            currentPage === page
                              ? 'bg-green-500 text-white'
                              : 'hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    {totalPages > 5 && (
                      <>
                        <span className="px-2">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={loading}
                          className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Additional Info */}
                {!loading && (
                  <div className="mt-8 p-4 bg-white rounded-lg">
                    <h3 className="font-semibold mb-2">תוצאות חיפוש נכסים</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      מערכת החיפוש שלנו מציגה לכם מגוון רחב של נכסים למכירה ולהשכרה.
                      ניתן לסנן לפי מחיר, מיקום, גודל ועוד כדי למצוא בדיוק את הנכס שאתם מחפשים.
                      כל הנכסים מוצגים עם תמונות, פרטים מלאים ומיקום במפה.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Map Section - Right Side (40%) */}
        <div className="hidden lg:block w-2/5 h-full">
          <Map />
        </div>
      </div>

      <Footer />
    </>
  )
}