export interface StoryPoint {
  // Direct CSV fields
  id: string
  title: string
  description: string
  author: string
  year: string
  location: string
  lat: string
  lng: string
  metadata: string
  driveUrl: string
  imageUrl: string
  
  // Future columns for enhanced content
  testimonial?: string
  articleUrl?: string
  
  // Computed properties
  parsedYear?: number
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
    
    return text
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/""/g, '"') // Unescape double quotes
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

  private static parseYear(yearString: string): number | undefined {
    const cleanedYear = this.cleanValue(yearString)
    
    if (!cleanedYear || cleanedYear.toLowerCase() === "unknown") {
      return undefined
    }

    // Handle various year formats
    const cleanYear = cleanedYear.replace(/[^\d-]/g, "")
    
    // Try to extract year from different formats
    const yearMatch = cleanYear.match(/(\d{4})/)
    
    if (yearMatch) {
      const year = Number.parseInt(yearMatch[1])
      return year >= 1800 && year <= new Date().getFullYear() ? year : undefined
    }

    // Handle "Circa" dates
    const circaMatch = cleanedYear.match(/Circa\s+(\d{4})/i)
    if (circaMatch) {
      const year = Number.parseInt(circaMatch[1])
      return year >= 1800 && year <= new Date().getFullYear() ? year : undefined
    }

    return undefined
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

        const coordinates = this.parseCoordinates(values[6] || "", values[7] || "") // lat, lng
        const parsedYear = this.parseYear(values[4] || "") // year
        const metadata = values[8] || ""
        
        // Create the point object
        const point: StoryPoint = {
          // Direct CSV fields
          id: values[0] || `point-${i}`,
          title: values[1] || "Sin título",
          description: values[2] || "",
          author: values[3] || "Autor desconocido",
          year: values[4] || "",
          location: values[5] || "",
          lat: values[6] || "",
          lng: values[7] || "",
          metadata,
          driveUrl: values[9] || "",
          imageUrl: values[10] || "",
          
          // Future columns for enhanced content
          testimonial: values[11] || undefined,
          articleUrl: values[12] || undefined,
          
          // Computed properties
          parsedYear,
          hasValidCoordinates: coordinates.isValid,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        }

        // Only include points with valid coordinates
        if (coordinates.isValid) {
          points.push(point)

          // Collect stats
          if (parsedYear) {
            years.push(parsedYear)
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
   */
  static groupPointsByLocation(points: StoryPoint[]): Map<string, StoryPoint[]> {
    const groups = new Map<string, StoryPoint[]>()
    
    points.forEach(point => {
      if (point.hasValidCoordinates && point.lat && point.lng) {
        const coordKey = `${point.lat}, ${point.lng}`
        
        if (!groups.has(coordKey)) {
          groups.set(coordKey, [])
        }
        groups.get(coordKey)!.push(point)
      }
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
        point.author.toLowerCase().includes(searchTerm) ||
        point.location.toLowerCase().includes(searchTerm) ||
        point.metadata.toLowerCase().includes(searchTerm),
    )
  }
}
