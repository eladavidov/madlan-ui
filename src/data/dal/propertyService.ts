import { Property, Project, SearchFilters, SearchResult } from './types'
import propertiesData from '../properties.json'
import projectsData from '../projects.json'

// Simulate API delay for realistic async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class PropertyService {
  private properties: Property[] = propertiesData as Property[]
  private projects: Project[] = projectsData as Project[]

  // Get all properties with optional pagination
  async getProperties(page: number = 1, limit: number = 20): Promise<Property[]> {
    await delay(300) // Simulate network delay
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return this.properties.slice(startIndex, endIndex)
  }

  // Get all projects
  async getProjects(): Promise<Project[]> {
    await delay(200) // Simulate network delay
    return this.projects
  }

  // Search properties with filters
  async searchProperties(filters: SearchFilters, page: number = 1, limit: number = 20): Promise<SearchResult> {
    await delay(400) // Simulate network delay

    let filteredProperties = [...this.properties]

    // Apply filters
    if (filters.city) {
      filteredProperties = filteredProperties.filter(p =>
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      )
    }

    if (filters.minPrice) {
      filteredProperties = filteredProperties.filter(p => p.price >= filters.minPrice!)
    }

    if (filters.maxPrice) {
      filteredProperties = filteredProperties.filter(p => p.price <= filters.maxPrice!)
    }

    if (filters.rooms && filters.rooms.length > 0) {
      filteredProperties = filteredProperties.filter(p =>
        filters.rooms!.includes(Math.floor(p.rooms))
      )
    }

    if (filters.neighborhoods && filters.neighborhoods.length > 0) {
      filteredProperties = filteredProperties.filter(p =>
        filters.neighborhoods!.includes(p.neighborhood)
      )
    }

    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      filteredProperties = filteredProperties.filter(p =>
        filters.propertyTypes!.includes(p.type)
      )
    }

    if (filters.hasParking !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.parking === filters.hasParking)
    }

    if (filters.hasElevator !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.elevator === filters.hasElevator)
    }

    if (filters.hasBalcony !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.balcony === filters.hasBalcony)
    }

    // Paginate results
    const total = filteredProperties.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex)

    return {
      properties: paginatedProperties,
      projects: this.projects, // Always return all projects for now
      total,
      page,
      limit
    }
  }

  // Get property by ID
  async getPropertyById(id: string): Promise<Property | undefined> {
    await delay(200) // Simulate network delay
    return this.properties.find(p => p.id === id)
  }

  // Get project by ID
  async getProjectById(id: string): Promise<Project | undefined> {
    await delay(200) // Simulate network delay
    return this.projects.find(p => p.id === id)
  }

  // Get unique neighborhoods (for filter dropdowns)
  async getNeighborhoods(city?: string): Promise<string[]> {
    await delay(100)
    let properties = this.properties
    if (city) {
      properties = properties.filter(p => p.city === city)
    }
    const neighborhoods = [...new Set(properties.map(p => p.neighborhood))]
    return neighborhoods.sort()
  }

  // Get unique property types (for filter dropdowns)
  async getPropertyTypes(): Promise<string[]> {
    await delay(100)
    const types = [...new Set(this.properties.map(p => p.type))]
    return types.sort()
  }

  // Get properties by city (convenience method)
  async getPropertiesByCity(city: string, page: number = 1, limit: number = 20): Promise<SearchResult> {
    return this.searchProperties({ city }, page, limit)
  }
}

// Export singleton instance
export const propertyService = new PropertyService()
export default propertyService