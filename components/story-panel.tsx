"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MapPin,
  User,
  BookOpen,
  Camera,
  FileText,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Quote,
  Calendar,
  Archive,
} from "lucide-react"
import type { StoryPoint } from "@/lib/csv-parser"
import MediaEmbed from "./media-embed"

interface StoryPanelProps {
  selectedPoint: StoryPoint | null
  allPoints: StoryPoint[]
  onPointSelect: (point: StoryPoint) => void
  onClose?: () => void
}

export default function StoryPanel({ selectedPoint, allPoints, onPointSelect, onClose }: StoryPanelProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFullArchive, setShowFullArchive] = useState(false)

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case "fotografía de estacion":
      case "fotografía":
        return <Camera className="w-4 h-4" />
      case "testimonio":
        return <User className="w-4 h-4" />
      case "literatura":
        return <BookOpen className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case "fotografía de estacion":
      case "fotografía":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "testimonio":
        return "bg-green-100 text-green-800 border-green-200"
      case "literatura":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Find related stories (same location, similar time period, or same category)
  const relatedStories = useMemo(() => {
    if (!selectedPoint) return []

    const related = allPoints
      .filter((point) => point.id !== selectedPoint.id)
      .map((point) => {
        let score = 0

        // Same location
        if (point.lugar.toLowerCase() === selectedPoint.lugar.toLowerCase()) score += 3

        // Similar time period (within 10 years)
        if (point.parsedYear && selectedPoint.parsedYear) {
          const yearDiff = Math.abs(point.parsedYear - selectedPoint.parsedYear)
          if (yearDiff <= 10) score += 2
          if (yearDiff <= 5) score += 1
        }

        // Same category
        if (point.categoria.toLowerCase() === selectedPoint.categoria.toLowerCase()) score += 2

        // Same author
        if (point.autor.toLowerCase() === selectedPoint.autor.toLowerCase()) score += 1

        return { point, score }
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ point }) => point)

    return related
  }, [selectedPoint, allPoints])

  // Navigation between stories
  const currentIndex = selectedPoint ? allPoints.findIndex((p) => p.id === selectedPoint.id) : -1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < allPoints.length - 1

  const navigateStory = (direction: "prev" | "next") => {
    if (!selectedPoint) return

    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1
    if (newIndex >= 0 && newIndex < allPoints.length) {
      onPointSelect(allPoints[newIndex])
    }
  }

  const shareStory = async () => {
    if (!selectedPoint) return

    const shareData = {
      title: `${selectedPoint.titulo} - El Tren de la Costa`,
      text: selectedPoint.descripcion,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`)
    }
  }

  if (!selectedPoint) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground mb-2">El Tren de la Costa</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Historias interactivas del ferrocarril que conectó Buenos Aires con el Delta del Tigre
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="mx-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="font-medium mb-2">Explora las historias</h3>
                <p className="text-sm">Selecciona un punto en el mapa para descubrir su historia</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} de {allPoints.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateStory("prev")}
              disabled={!canNavigatePrev}
              className="p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateStory("next")}
              disabled={!canNavigateNext}
              className="p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={shareStory} className="p-1">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-1 ${isBookmarked ? "text-accent" : ""}`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        <h1 className="text-xl font-bold text-sidebar-foreground leading-tight">{selectedPoint.titulo}</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Category and metadata */}
          <div className="space-y-3">
            <Badge className={`${getCategoryColor(selectedPoint.categoria)} border`}>
              <div className="flex items-center gap-1">
                {getCategoryIcon(selectedPoint.categoria)}
                <span className="text-xs font-medium">{selectedPoint.categoria}</span>
              </div>
            </Badge>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{selectedPoint.lugar}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{selectedPoint.año}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 flex-shrink-0" />
                <span>{selectedPoint.autor}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Main description */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Historia</h3>
            <p className="text-sm leading-relaxed text-foreground">{selectedPoint.descripcion}</p>
          </div>

          {selectedPoint.archivoDigital && selectedPoint.archivoDigital !== "-" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Archivo Digital</h3>
                </div>
                <MediaEmbed url={selectedPoint.archivoDigital} title={selectedPoint.titulo} />
              </div>
            </>
          )}

          {/* Archive content */}
          {selectedPoint.archivo && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Archivo</h3>
                </div>
                <div className="relative">
                  <blockquote className="border-l-4 border-accent pl-4 italic text-sm text-muted-foreground leading-relaxed">
                    {showFullArchive || selectedPoint.archivo.length <= 200
                      ? selectedPoint.archivo
                      : `${selectedPoint.archivo.substring(0, 200)}...`}
                  </blockquote>
                  {selectedPoint.archivo.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullArchive(!showFullArchive)}
                      className="mt-2 text-xs"
                    >
                      {showFullArchive ? "Ver menos" : "Ver más"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Source */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Fuente</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{selectedPoint.fuente}</p>
          </div>

          {/* Related stories */}
          {relatedStories.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Historias Relacionadas</h3>
                <div className="space-y-2">
                  {relatedStories.map((story) => (
                    <Card
                      key={story.id}
                      className="cursor-pointer hover:bg-accent/5 transition-colors"
                      onClick={() => onPointSelect(story)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{getCategoryIcon(story.categoria)}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight mb-1 truncate">{story.titulo}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <span>{story.lugar}</span>
                              <span>•</span>
                              <span>{story.año}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {story.descripcion.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
