export interface Property {
  id: string
  price: number
  rooms: number
  size: number
  floor?: number
  address: string
  neighborhood: string
  city: string
  image: string
  type: string
  parking?: boolean
  elevator?: boolean
  balcony?: boolean
  description?: string
  isNew?: boolean
  projectName?: string
}

export interface Project {
  id: string
  name: string
  location: string
  developer: string
  minPrice: number
  maxPrice: number
  roomsRange: string
  image: string
  isNew?: boolean
}

export interface SearchFilters {
  city?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number[]
  neighborhoods?: string[]
  propertyTypes?: string[]
  hasParking?: boolean
  hasElevator?: boolean
  hasBalcony?: boolean
}

export interface SearchResult {
  properties: Property[]
  projects: Project[]
  total: number
  page: number
  limit: number
}