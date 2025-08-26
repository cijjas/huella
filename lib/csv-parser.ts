export interface StoryPoint {
  id: string
  titulo: string
  descripcion: string
  autor: string
  año: string
  lugar: string
  coordenadas: string
  fuente: string
  archivo: string
  archivoDigital: string
  categoria: string
  observaciones?: string
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

  private static parseYear(yearString: string): number | undefined {
    if (!yearString || yearString === "-" || yearString.toLowerCase() === "unknown") {
      return undefined
    }

    // Handle formats like "1.980", "1980", "1980-1985", etc.
    const cleanYear = yearString.replace(/[^\d-]/g, "")
    const yearMatch = cleanYear.match(/(\d{4})/)

    if (yearMatch) {
      const year = Number.parseInt(yearMatch[1])
      return year >= 1800 && year <= new Date().getFullYear() ? year : undefined
    }

    return undefined
  }

  private static parseCoordinates(coordString: string): { lat?: number; lng?: number; isValid: boolean } {
    if (!coordString || coordString === "-") {
      return { isValid: false }
    }

    try {
      // Clean the coordinate string and remove any quotes
      const cleanCoords = coordString.replace(/['"]/g, '').trim()
      console.log('Parsing coordinates:', cleanCoords)
      
      const coords = cleanCoords.split(",").map((coord) => Number.parseFloat(coord.trim()))
      console.log('Parsed coords array:', coords)

      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const [lat, lng] = coords
        console.log('Final lat/lng:', lat, lng)

        // Validate coordinate ranges (Buenos Aires area)
        if (lat >= -35 && lat <= -34 && lng >= -59 && lng <= -58) {
          return { lat, lng, isValid: true }
        } else {
          console.warn('Coordinates out of expected range:', lat, lng)
        }
      }
    } catch (error) {
      console.warn("Error parsing coordinates:", coordString, error)
    }

    return { isValid: false }
  }

  private static cleanText(text: string): string {
    return text
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/""/g, '"') // Unescape double quotes
      .trim()
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
        const values = this.parseCSVLine(lines[i]).map((v) => this.cleanText(v))

        if (values.length < headers.length) {
          console.warn(`Row ${i + 1} has fewer columns than expected, skipping`)
          continue
        }

        const coordinates = this.parseCoordinates(values[6] || "")
        const parsedYear = this.parseYear(values[4] || "")
        const categoria = values[11] || "Sin categoría"

        const point: StoryPoint = {
          id: values[0] || `point-${i}`,
          titulo: values[1] || "Sin título",
          descripcion: values[2] || "",
          autor: values[3] || "Autor desconocido",
          año: values[4] || "",
          lugar: values[5] || "",
          coordenadas: values[6] || "",
          fuente: values[7] || "",
          archivo: values[8] || "",
          archivoDigital: values[10] || "",
          categoria,
          observaciones: values[12] || undefined,
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
          categories[categoria] = (categories[categoria] || 0) + 1
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
      if (point.hasValidCoordinates && point.coordenadas) {
        const coordKey = point.coordenadas.trim()
        
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
    return points.filter((point) => point.categoria.toLowerCase() === category.toLowerCase())
  }

  static searchPoints(points: StoryPoint[], query: string): StoryPoint[] {
    const searchTerm = query.toLowerCase()
    return points.filter(
      (point) =>
        point.titulo.toLowerCase().includes(searchTerm) ||
        point.descripcion.toLowerCase().includes(searchTerm) ||
        point.autor.toLowerCase().includes(searchTerm) ||
        point.lugar.toLowerCase().includes(searchTerm) ||
        point.archivo.toLowerCase().includes(searchTerm),
    )
  }
}
