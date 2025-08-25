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
  const [filteredPoints, setFilteredPoints] = useState<StoryPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<StoryPoint | null>(null)
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

        const csvUrl =
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nuevo%20Archivo%20Tesis%20%20-%20Hoja%201-xbwDfzMSw7WRLJf2pM7nYQ8S94nd4J.csv"

        const { points, stats } = await CSVParser.parseCSV(csvUrl)

        setStoryPoints(points)

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
    let filtered = storyPoints

    filtered = CSVParser.filterPointsByYear(filtered, currentYear, includeUnknownYears)

    setFilteredPoints(filtered)

    if (filtered.length > 0 && !selectedPoint) {
      setSelectedPoint(filtered[0])
      setIsPanelMinimized(false)
    }
  }, [storyPoints, currentYear, includeUnknownYears, selectedPoint])

  const handlePointSelect = (point: StoryPoint) => {
    setSelectedPoint(point)
    setIsPanelMinimized(false)
  }

  const handleStoryNavigate = (point: StoryPoint) => {
    setSelectedPoint(point)
  }

  const handlePanelClose = () => {
    if (filteredPoints.length > 0) {
      const currentIndex = filteredPoints.findIndex((p) => p.id === selectedPoint?.id)
      const nextPoint = filteredPoints[currentIndex + 1] || filteredPoints[0]
      setSelectedPoint(nextPoint)
      setIsPanelMinimized(true)
    } else {
      setSelectedPoint(null)
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
      <MapView points={filteredPoints} selectedPoint={selectedPoint} onPointSelect={handlePointSelect} />

      <FloatingTimeline
        yearRange={yearRange}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        includeUnknown={includeUnknownYears}
        onIncludeUnknownChange={setIncludeUnknownYears}
      />

      <FloatingStoryPanel
        point={selectedPoint}
        allPoints={filteredPoints}
        onClose={handlePanelClose}
        onNavigate={handleStoryNavigate}
        isMinimized={isPanelMinimized}
        onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
      />
    </div>
  )
}
