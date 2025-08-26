"use client"

import { X, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import MediaEmbed from "./media-embed"
import { StorySelector } from "./story-selector"
import { type StoryPoint } from "@/lib/csv-parser"

interface MapPoint {
  id: string
  stories: StoryPoint[]
  coordinates: string
  latitude: number
  longitude: number
  primaryStory: StoryPoint
}

interface FloatingStoryPanelProps {
  mapPoint: MapPoint | null
  selectedStory: StoryPoint | null
  allMapPoints: MapPoint[]
  onClose: () => void
  onNavigate: (mapPoint: MapPoint) => void
  onStorySelect: (story: StoryPoint) => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function FloatingStoryPanel({
  mapPoint,
  selectedStory,
  allMapPoints,
  onClose,
  onNavigate,
  onStorySelect,
  isMinimized,
  onToggleMinimize,
}: FloatingStoryPanelProps) {
  if (!mapPoint || !selectedStory) return null

  const currentIndex = allMapPoints.findIndex((p) => p.id === mapPoint.id)
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < allMapPoints.length - 1

  const handlePrevious = () => {
    if (canGoBack) {
      onNavigate(allMapPoints[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (canGoForward) {
      onNavigate(allMapPoints[currentIndex + 1])
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 w-[480px] z-[1000] transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[calc(100vh-2rem)]"
      }`}
    >
      <div className="paper-card shadow-2xl h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={!canGoBack}
              className="h-8 w-8 rounded-full hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-medium">
              {currentIndex + 1} / {allMapPoints.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!canGoForward}
              className="h-8 w-8 rounded-full hover:bg-muted/50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMinimize}
              className="h-8 w-8 rounded-full hover:bg-muted/50"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted/50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isMinimized ? (
          <div className="p-4 cursor-pointer" onClick={onToggleMinimize}>
            <h3 className="text-sm font-semibold text-foreground truncate font-heading">{selectedStory.titulo}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {selectedStory.lugar} • {selectedStory.año}
            </p>
          </div>
        ) : (
          /* Full content with proper full-height scrolling */
          <div className="flex-1 overflow-y-auto">
            {/* Image area */}
            <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
              {selectedStory.archivoDigital && selectedStory.archivoDigital !== "-" ? (
                <MediaEmbed url={selectedStory.archivoDigital} title={selectedStory.titulo} />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-primary/30 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <p className="text-sm text-primary font-medium">No hay imagen disponible</p>
                </div>
              )}
            </div>

            {/* Story Selector for multiple stories at same location */}
            <StorySelector 
              stories={mapPoint.stories}
              selectedStory={selectedStory}
              onStorySelect={onStorySelect}
            />

            {/* Story content with new elegant layout */}
            <div className="p-6 space-y-6">
              {/* Main Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground leading-tight font-heading tracking-wide">
                  {selectedStory.titulo}
                </h1>
              </div>

              {/* Description */}
              <div>
                <p className="text-base leading-relaxed text-card-foreground font-body">
                  {selectedStory.descripcion}
                </p>
              </div>

              {/* Elegant Metadata */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/20">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Autor/a
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {selectedStory.autor || "Autor desconocido"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Fecha
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {selectedStory.año || "Fecha desconocida"}
                  </div>
                </div>
              </div>

              {/* Location - Separate Section */}
              <div className="bg-muted/20 p-4 rounded-lg border-l-4 border-primary/40">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Ubicación
                </div>
                <div className="text-sm font-medium text-foreground">
                  {selectedStory.lugar}
                </div>
              </div>

              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                  {selectedStory.categoria}
                </span>
              </div>

              {/* Source - Bottom Metadata */}
              <div className="pt-4 border-t border-border/30">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Fuente
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  {selectedStory.fuente}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
