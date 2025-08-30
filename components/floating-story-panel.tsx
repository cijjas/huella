"use client"

import { X, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"

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

  // Group stories by type for tabs
  const fotografias = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('fotografía') || 
    story.imageUrl || 
    story.driveUrl
  )
  
  const testimonios = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('testimonio') || 
    story.description.toLowerCase().includes('testimonio') ||
    story.testimonial
  )
  
  const articulos = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('artículo') || 
    story.metadata.toLowerCase().includes('articulo') ||
    story.title.toLowerCase().includes('artículo') ||
    story.title.toLowerCase().includes('articulo') ||
    story.articleUrl
  )

  return (
    <div
      className={`fixed top-4 right-4 w-[480px] z-[1000] transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[calc(100vh-2rem)]"
      }`}
    >
      <div className="bg-card shadow-2xl h-full overflow-hidden border-4 border-primary rounded-2xl">
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
          </div>
        </div>

        {isMinimized ? (
          <div className="p-4 cursor-pointer" onClick={onToggleMinimize}>
            <h3 className="text-sm font-semibold text-foreground truncate font-heading">{mapPoint.primaryStory.location}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {mapPoint.stories.length} historias • {mapPoint.primaryStory.year}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Main Image */}
            <div className="h-48 bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center overflow-hidden">
              {(() => {
                const imageUrl = getImageUrl(mapPoint.primaryStory)
                return imageUrl ? (
                  <Image 
                    src={imageUrl}
                    alt={mapPoint.primaryStory.title}
                    width={480}
                    height={192}
                    className="w-full h-full object-cover"
                    onError={() => {
                      // Handle error by showing fallback
                    }}
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <span className="text-2xl">📸</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No hay imagen disponible</p>
                  </div>
                )
              })()}
            </div>
            
            

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground leading-tight font-heading tracking-wide">
                  {mapPoint.primaryStory.location}
                </h1>
              </div>

              {/* Description */}
              <div>
                <p className="text-base leading-relaxed text-card-foreground font-body">
                  {mapPoint.primaryStory.description}
                </p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="fotografias" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="fotografias" className="flex-1">
                    Fotografías ({fotografias.length})
                  </TabsTrigger>
                  <TabsTrigger value="testimonios" className="flex-1">
                    Testimonios ({testimonios.length})
                  </TabsTrigger>
                  <TabsTrigger value="articulos" className="flex-1">
                    Artículos ({articulos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fotografias" className="mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {fotografias.slice(0, 5).map((story, index) => (
                      <Card key={story.id} className="cursor-pointer hover:bg-accent/5 transition-colors">
                        <CardContent className="p-2">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                            {(() => {
                              const imageUrl = getImageUrl(story)
                              return imageUrl ? (
                                <Image 
                                  src={imageUrl}
                                  alt={story.title}
                                  width={120}
                                  height={120}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <span className="text-muted-foreground">
                                  img{index + 1}
                                </span>
                              )
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{story.title}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="testimonios" className="mt-4">
                  <div className="space-y-3">
                    {testimonios.map((story) => (
                      <Card key={story.id} className="cursor-pointer hover:bg-accent/5 transition-colors">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-sm mb-2">{story.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {story.testimonial || story.description.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{story.author}</span>
                            <span>•</span>
                            <span>{story.year}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="articulos" className="mt-4">
                  <div className="space-y-3">
                    {articulos.map((story) => (
                      <Card key={story.id} className="cursor-pointer hover:bg-accent/5 transition-colors">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-sm mb-2">{story.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {story.description.substring(0, 150)}...
                          </p>
                          {story.articleUrl && (
                            <div className="mt-2">
                              <a 
                                href={story.articleUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                              >
                                Leer artículo completo →
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{story.author}</span>
                            <span>•</span>
                            <span>{story.year}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
