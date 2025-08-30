"use client"

import { ChevronLeft, ChevronRight, Minimize2, Maximize2, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { useState } from "react"
import { ImageGalleryModal } from "@/components/image-gallery-modal"

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
  const [fotografiasShown, setFotografiasShown] = useState(6)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  if (!mapPoint || !selectedStory) return null

  const currentIndex = allMapPoints.findIndex((p) => p.id === mapPoint.id)
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < allMapPoints.length - 1

  const handlePrevious = () => {
    if (canGoBack) {
      setFotografiasShown(6)
      setShowImageGallery(false)
      setSelectedImageIndex(0)
      onNavigate(allMapPoints[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (canGoForward) {
      setFotografiasShown(6)
      setShowImageGallery(false)
      setSelectedImageIndex(0)
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

  // Image gallery handlers
  const openImageGallery = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageGallery(true)
  }

  const closeImageGallery = () => {
    setShowImageGallery(false)
  }

  return (
    <div
      className={`fixed top-4 right-4 w-[640px] z-[1000] transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[calc(100vh-2rem)]"
      }`}
    >
      <div className="bg-card shadow-2xl h-full overflow-hidden  border-primary rounded-2xl">
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
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Main Image with Title Overlay */}
            <div className="relative h-48 bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center overflow-hidden">
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
              
              {/* Title Card Overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 drop-shadow-2xl">
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 px-6 py-3 rounded-xl">
                  <h1 className="text-xl font-bold text-foreground leading-tight font-heading tracking-wide whitespace-nowrap">
                    {mapPoint.primaryStory.location}
                  </h1>
                </Card>
              </div>
            </div>

            {/* Tabs Only */}
            <div className="p-6">
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

                <TabsContent value="fotografias" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  <div className="space-y-3">
                    {/* Grid of images */}
                    <div className="grid grid-cols-3 gap-2">
                      {fotografias.slice(0, fotografiasShown).map((story, index) => (
                        <Card 
                          key={story.id} 
                          className="cursor-pointer hover:bg-accent/90  transition-colors p-0  border-none"
                          onClick={() => openImageGallery(index)}
                        >
                          <CardContent className="p-2">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center  overflow-hidden">
                              {(() => {
                                const imageUrl = getImageUrl(story)
                                return imageUrl ? (
                                  <Image 
                                    src={imageUrl}
                                    alt={story.title}
                                    width={180}
                                    height={180}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">
                                    img{index + 1}
                                  </span>
                                )
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Show more/less button */}
                    {fotografias.length > 6 && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (fotografiasShown >= fotografias.length) {
                              setFotografiasShown(6)
                            } else {
                              setFotografiasShown(Math.min(fotografiasShown + 6, fotografias.length))
                            }
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {fotografiasShown >= fotografias.length ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Mostrar menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Mostrar {Math.min(6, fotografias.length - fotografiasShown)} más
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="testimonios" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
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

                <TabsContent value="articulos" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
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

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={showImageGallery}
        onClose={closeImageGallery}
        fotografias={fotografias}
        startIndex={selectedImageIndex}
      />
    </div>
  )
}
