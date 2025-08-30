"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { CSVParser, type StoryPoint } from "@/lib/csv-parser"
import { FloatingStoryPanel } from "@/components/floating-story-panel"
import { FloatingTimeline } from "@/components/floating-timeline"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-lg" />,
})

export default function TrenCostaApp() {
  const [storyPoints, setStoryPoints] = useState<StoryPoint[]>([])
  const [mapPoints, setMapPoints] = useState<Array<{
    id: string
    stories: StoryPoint[]
    coordinates: string
    latitude: number
    longitude: number
    primaryStory: StoryPoint
  }>>([])
  const [filteredMapPoints, setFilteredMapPoints] = useState<Array<{
    id: string
    stories: StoryPoint[]
    coordinates: string
    latitude: number
    longitude: number
    primaryStory: StoryPoint
  }>>([])
  const [selectedMapPoint, setSelectedMapPoint] = useState<{
    id: string
    stories: StoryPoint[]
    coordinates: string
    latitude: number
    longitude: number
    primaryStory: StoryPoint
  } | null>(null)
  const [selectedStory, setSelectedStory] = useState<StoryPoint | null>(null)
  const [isPanelMinimized, setIsPanelMinimized] = useState(false)
  const [yearRange, setYearRange] = useState<[number, number]>([1900, 2024])
  const [currentYear, setCurrentYear] = useState(2024)
  const [includeUnknownYears, setIncludeUnknownYears] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const csvUrl = "/archivo.csv"

        const { points, stats } = await CSVParser.parseCSV(csvUrl)

        setStoryPoints(points)
        
        // Create map points from story points
        const generatedMapPoints = CSVParser.createMapPoints(points)
        setMapPoints(generatedMapPoints)

        if (stats.yearRange) {
          setYearRange(stats.yearRange)
          setCurrentYear(stats.yearRange[1])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setError(error instanceof Error ? error.message : "Error desconocido al cargar los datos")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    // Filter story points by year
    const filtered = CSVParser.filterPointsByYear(storyPoints, currentYear, includeUnknownYears)
    
    // Create map points from filtered stories
    const filteredMapPointsData = CSVParser.createMapPoints(filtered)
    setFilteredMapPoints(filteredMapPointsData)

    // Set initial selection
    if (filteredMapPointsData.length > 0 && !selectedMapPoint) {
      const firstMapPoint = filteredMapPointsData[0]
      setSelectedMapPoint(firstMapPoint)
      setSelectedStory(firstMapPoint.primaryStory)
      setIsPanelMinimized(false)
    }
  }, [storyPoints, currentYear, includeUnknownYears, selectedMapPoint])

  const handleMapPointSelect = (mapPoint: typeof filteredMapPoints[0]) => {
    setSelectedMapPoint(mapPoint)
    setSelectedStory(mapPoint.primaryStory)
    setIsPanelMinimized(false)
  }

  const handleStorySelect = (story: StoryPoint) => {
    setSelectedStory(story)
  }

  const handleMapPointNavigate = (mapPoint: typeof filteredMapPoints[0]) => {
    setSelectedMapPoint(mapPoint)
    setSelectedStory(mapPoint.primaryStory)
  }

  const handlePanelClose = () => {
    if (filteredMapPoints.length > 0) {
      const currentIndex = filteredMapPoints.findIndex((p) => p.id === selectedMapPoint?.id)
      const nextMapPoint = filteredMapPoints[currentIndex + 1] || filteredMapPoints[0]
      setSelectedMapPoint(nextMapPoint)
      setSelectedStory(nextMapPoint.primaryStory)
      setIsPanelMinimized(true)
    } else {
      setSelectedMapPoint(null)
      setSelectedStory(null)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando historias del Tren de la Costa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md paper-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error al cargar datos</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background paper-texture relative">
      <MapView points={filteredMapPoints} selectedPoint={selectedMapPoint} onPointSelect={handleMapPointSelect} />

      <FloatingTimeline
        yearRange={yearRange}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        includeUnknown={includeUnknownYears}
        onIncludeUnknownChange={setIncludeUnknownYears}
      />

      {selectedMapPoint && (
        <FloatingStoryPanel
          mapPoint={selectedMapPoint}
          selectedStory={selectedStory}
          allMapPoints={filteredMapPoints}
          onStorySelect={handleStorySelect}
          onClose={handlePanelClose}
          onNavigate={handleMapPointNavigate}
          isMinimized={isPanelMinimized}
          onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
        />
      )}
    </div>
  )
}
