export interface StoryPoint {
  // Direct CSV fields
  id: string
  title: string
  description: string
  source: string
  bibliographicReference: string
  date: string
  location: string
  lat: string
  lng: string
  metadata: string
  drivePhotoUrl: string
  driveArticlePhotoUrl: string
  testimonial: string
  videoUrl: string
  
  // Computed properties
  parsedYear?: number
  parsedDate?: Date
  hasValidCoordinates: boolean
  latitude?: number
  longitude?: number
}

export class CSVParser {
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
          continue
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
      i++
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  private static cleanText(text: string): string {
    if (!text) return ""
    
    // Only remove surrounding quotes if the entire field is wrapped in quotes
    // This preserves legitimate quotes within the content
    let cleaned = text
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
      cleaned = text.slice(1, -1)
    }
    
    return cleaned
      .replace(/""/g, '"') // Unescape double quotes (CSV escaping)
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim() // Remove leading/trailing whitespace
  }

  private static cleanValue(value: string): string {
    const cleaned = this.cleanText(value)
    
    // Handle common empty value patterns
    if (cleaned === "" || cleaned === "-" || cleaned === "null" || cleaned === "undefined") {
      return ""
    }
    
    return cleaned
  }

  private static parseDate(dateString: string): { year?: number; date?: Date } {
    const cleanedDate = this.cleanValue(dateString)
    
    if (!cleanedDate || cleanedDate.toLowerCase() === "unknown") {
      return {}
    }

    // Handle dd/mm/yyyy format (precise dates)
    const preciseMatch = cleanedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (preciseMatch) {
      const day = Number.parseInt(preciseMatch[1])
      const month = Number.parseInt(preciseMatch[2])
      const year = Number.parseInt(preciseMatch[3])
      
      if (year >= 1800 && year <= new Date().getFullYear() && 
          month >= 1 && month <= 12 && 
          day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day)
        return { year, date }
      }
    }

    // Handle single year (e.g., "1993")
    const yearMatch = cleanedDate.match(/^(\d{4})$/)
    if (yearMatch) {
      const year = Number.parseInt(yearMatch[1])
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return { year }
      }
    }

    // Handle various year formats within text
    const yearInTextMatch = cleanedDate.match(/(\d{4})/)
    if (yearInTextMatch) {
      const year = Number.parseInt(yearInTextMatch[1])
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return { year }
      }
    }

    // Handle "Circa" dates
    const circaMatch = cleanedDate.match(/Circa\s+(\d{4})/i)
    if (circaMatch) {
      const year = Number.parseInt(circaMatch[1])
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return { year }
      }
    }

    return {}
  }

  private static parseCoordinates(latString: string, lngString: string): { lat?: number; lng?: number; isValid: boolean } {
    const cleanedLat = this.cleanValue(latString)
    const cleanedLng = this.cleanValue(lngString)
    
    if (!cleanedLat || !cleanedLng) {
      return { isValid: false }
    }

    try {
      const lat = Number.parseFloat(cleanedLat)
      const lng = Number.parseFloat(cleanedLng)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Validate coordinate ranges (Buenos Aires area)
        if (lat >= -35 && lat <= -34 && lng >= -59 && lng <= -58) {
          return { lat, lng, isValid: true }
        } else {
          console.warn('Coordinates out of expected range:', lat, lng)
        }
      }
    } catch (error) {
      console.warn("Error parsing coordinates:", cleanedLat, cleanedLng, error)
    }

    return { isValid: false }
  }

  static async parseCSV(csvUrl: string): Promise<{
    points: StoryPoint[]
    stats: {
      total: number
      withCoordinates: number
      withYears: number
      categories: Record<string, number>
      yearRange: [number, number] | null
    }
  }> {
    try {
      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const csvText = await response.text()
      const lines = csvText.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("CSV file appears to be empty or invalid")
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]).map((h) => this.cleanText(h))
      console.log("CSV Headers:", headers)

      // Parse data rows
      const points: StoryPoint[] = []
      const categories: Record<string, number> = {}
      const years: number[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]).map((v) => this.cleanValue(v))

        if (values.length < headers.length) {
          console.warn(`Row ${i + 1} has fewer columns than expected, skipping`)
          continue
        }

        const coordinates = this.parseCoordinates(values[7] || "", values[8] || "") // lat, lng
        const parsedDate = this.parseDate(values[5] || "") // date
        const metadata = values[9] || ""
        
        // Create the point object
        const point: StoryPoint = {
          // Direct CSV fields
          id: values[0] || `point-${i}`,
          title: values[1] || "Sin título",
          description: values[2] || "",
          source: values[3] || "Fuente desconocida",
          bibliographicReference: values[4] || "",
          date: values[5] || "",
          location: values[6] || "",
          lat: values[7] || "",
          lng: values[8] || "",
          metadata,
          drivePhotoUrl: values[10] || "",
          driveArticlePhotoUrl: values[11] || "",
          testimonial: values[12] || "",
          videoUrl: values[13] || "",
          
          // Computed properties
          parsedYear: parsedDate.year,
          parsedDate: parsedDate.date,
          hasValidCoordinates: coordinates.isValid,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        }

        // Only include points with valid coordinates
        if (coordinates.isValid) {
          points.push(point)

          // Collect stats
          if (parsedDate.year) {
            years.push(parsedDate.year)
          }
          const category = metadata || "Sin categoría"
          categories[category] = (categories[category] || 0) + 1
        }
      }

      const yearRange: [number, number] | null = years.length > 0 ? [Math.min(...years), Math.max(...years)] : null

      const stats = {
        total: points.length,
        withCoordinates: points.filter((p) => p.hasValidCoordinates).length,
        withYears: points.filter((p) => p.parsedYear).length,
        categories,
        yearRange,
      }

      console.log("CSV parsing complete:", stats)
      return { points, stats }
    } catch (error) {
      console.error("Error parsing CSV:", error)
      throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static filterPointsByYear(points: StoryPoint[], maxYear: number, includeUnknown = true): StoryPoint[] {
    return points.filter((point) => {
      if (!point.parsedYear) {
        return includeUnknown
      }
      return point.parsedYear <= maxYear
    })
  }

  /**
   * Groups story points by their coordinates to handle multiple stories at the same location
   * Includes validation to ensure same lat/lng coordinates are properly grouped
   */
  static groupPointsByLocation(points: StoryPoint[]): Map<string, StoryPoint[]> {
    const groups = new Map<string, StoryPoint[]>()
    const coordinateValidation = new Map<string, { lat: number; lng: number; locations: Set<string> }>()
    
    points.forEach(point => {
      if (point.hasValidCoordinates && point.latitude !== undefined && point.longitude !== undefined) {
        // Use precise coordinates for grouping
        const coordKey = `${point.latitude}, ${point.longitude}`
        
        // Validate coordinate consistency
        if (coordinateValidation.has(coordKey)) {
          const existing = coordinateValidation.get(coordKey)!
          existing.locations.add(point.location)
          
          // Check for coordinate precision issues
          if (Math.abs(existing.lat - point.latitude) > 0.0001 || 
              Math.abs(existing.lng - point.longitude) > 0.0001) {
            console.warn(`Coordinate precision mismatch for key ${coordKey}:`, {
              existing: { lat: existing.lat, lng: existing.lng },
              current: { lat: point.latitude, lng: point.longitude },
              locations: Array.from(existing.locations)
            })
          }
        } else {
          coordinateValidation.set(coordKey, {
            lat: point.latitude,
            lng: point.longitude,
            locations: new Set([point.location])
          })
        }
        
        if (!groups.has(coordKey)) {
          groups.set(coordKey, [])
        }
        groups.get(coordKey)!.push(point)
      }
    })
    
    // Log grouping statistics
    console.log('Location grouping statistics:', {
      totalPoints: points.length,
      uniqueLocations: groups.size,
      groupSizes: Array.from(groups.entries()).map(([key, stories]) => ({
        coordinates: key,
        storyCount: stories.length,
        locations: [...new Set(stories.map(s => s.location))]
      }))
    })
    
    return groups
  }

  /**
   * Creates representative points for map display, combining multiple stories at same location
   */
  static createMapPoints(points: StoryPoint[]): Array<{
    id: string
    stories: StoryPoint[]
    coordinates: string
    latitude: number
    longitude: number
    primaryStory: StoryPoint
  }> {
    const groups = this.groupPointsByLocation(points)
    const mapPoints: Array<{
      id: string
      stories: StoryPoint[]
      coordinates: string
      latitude: number
      longitude: number
      primaryStory: StoryPoint
    }> = []

    groups.forEach((stories, coordinates) => {
      if (stories.length > 0) {
        const primaryStory = stories[0] // Use first story as primary
        mapPoints.push({
          id: `location-${coordinates}`,
          stories,
          coordinates,
          latitude: primaryStory.latitude!,
          longitude: primaryStory.longitude!,
          primaryStory
        })
      }
    })

    return mapPoints
  }

  static getPointsByCategory(points: StoryPoint[], category: string): StoryPoint[] {
    return points.filter((point) => point.metadata.toLowerCase() === category.toLowerCase())
  }

  static searchPoints(points: StoryPoint[], query: string): StoryPoint[] {
    const searchTerm = query.toLowerCase()
    return points.filter(
      (point) =>
        point.title.toLowerCase().includes(searchTerm) ||
        point.description.toLowerCase().includes(searchTerm) ||
        point.source.toLowerCase().includes(searchTerm) ||
        point.location.toLowerCase().includes(searchTerm) ||
        point.metadata.toLowerCase().includes(searchTerm),
    )
  }
}
