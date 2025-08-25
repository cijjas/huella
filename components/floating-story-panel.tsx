"use client"

import { X, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import MediaEmbed from "./media-embed"

interface StoryPoint {
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
}

interface FloatingStoryPanelProps {
  point: StoryPoint | null
  allPoints: StoryPoint[]
  onClose: () => void
  onNavigate: (point: StoryPoint) => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function FloatingStoryPanel({
  point,
  allPoints,
  onClose,
  onNavigate,
  isMinimized,
  onToggleMinimize,
}: FloatingStoryPanelProps) {
  if (!point) return null

  const currentIndex = allPoints.findIndex((p) => p.id === point.id)
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < allPoints.length - 1

  const handlePrevious = () => {
    if (canGoBack) {
      onNavigate(allPoints[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (canGoForward) {
      onNavigate(allPoints[currentIndex + 1])
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 w-96 z-[1000] transition-all duration-300 ${
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
              {currentIndex + 1} / {allPoints.length}
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
            <h3 className="text-sm font-semibold text-foreground truncate font-heading">{point.titulo}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {point.lugar} • {point.año}
            </p>
          </div>
        ) : (
          /* Full content with proper full-height scrolling */
          <div className="flex-1 overflow-y-auto">
            {/* Image area */}
            <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
              {point.archivoDigital && point.archivoDigital !== "-" ? (
                <MediaEmbed url={point.archivoDigital} title={point.titulo} />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-primary/30 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                  <p className="text-sm text-primary font-medium">No hay imagen disponible</p>
                </div>
              )}
            </div>

            {/* Story content */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2 font-heading">{point.titulo}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium border border-secondary/20">
                    {point.categoria}
                  </span>
                  <span>•</span>
                  <span className="font-medium">{point.año}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="h-2 bg-muted rounded-full mb-2 opacity-30"></div>
                  <div className="h-2 bg-muted rounded-full mb-2 w-4/5 opacity-25"></div>
                  <div className="h-2 bg-muted rounded-full mb-2 w-3/4 opacity-20"></div>
                  <div className="h-2 bg-muted rounded-full w-2/3 opacity-15"></div>
                </div>
              </div>

              {/* Actual content */}
              <div className="space-y-4 text-sm text-card-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-heading">Descripción</h3>
                  <p className="leading-relaxed">{point.descripcion}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-heading">Lugar</h3>
                  <p>{point.lugar}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-heading">Autor/a</h3>
                  <p>{point.autor}</p>
                </div>

                {point.archivo && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 font-heading">Archivo</h3>
                    <p className="text-xs leading-relaxed italic text-muted-foreground bg-muted/30 p-3 rounded-lg border-l-4 border-primary/30">
                      {point.archivo}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-foreground mb-1 font-heading">Fuente</h3>
                  <p className="text-xs text-muted-foreground">{point.fuente}</p>
                </div>
              </div>

              {/* Bottom placeholder bar */}
              <div className="pt-4 border-t border-border/30">
                <div className="h-2 bg-muted/50 rounded-full w-3/4"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
