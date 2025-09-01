"use client"

import { ChevronLeft, ChevronRight, Minimize2, Maximize2, ChevronUp, ChevronDown, MessageSquare, FileText, Camera, Play, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { useState } from "react"
import { PhotoGalleryModal, VideoGalleryModal, TestimonialGalleryModal } from "@/components/galleries"

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

  const [showImageGallery, setShowImageGallery] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showArticleGallery, setShowArticleGallery] = useState(false)
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)
  const [showVideoGallery, setShowVideoGallery] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const [showTestimonialsGallery, setShowTestimonialsGallery] = useState(false)
  const [selectedTestimonialIndex, setSelectedTestimonialIndex] = useState(0)
  
  if (!mapPoint || !selectedStory) return null

  const currentIndex = allMapPoints.findIndex((p) => p.id === mapPoint.id)
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < allMapPoints.length - 1

  const handlePrevious = () => {
    if (canGoBack) {
      setShowImageGallery(false)
      setSelectedImageIndex(0)
      onNavigate(allMapPoints[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (canGoForward) {
      setShowImageGallery(false)
      setSelectedImageIndex(0)
      onNavigate(allMapPoints[currentIndex + 1])
    }
  }

  // Helper function to get decade from date
  const getDecade = (date: string): number | null => {
    if (!date || date.trim() === '') return null
    
    // Try to extract year from various formats
    const yearMatch = date.match(/(\d{4})/)
    if (yearMatch) {
      const year = parseInt(yearMatch[1])
      return Math.floor(year / 10) * 10
    }
    
    return null
  }

  // Helper function to sort by date then by title
  const sortByDateAndTitle = (a: any, b: any) => {
    const dateA = a.date || a.year || ''
    const dateB = b.date || b.year || ''
    
    // If both have dates, compare them
    if (dateA && dateB) {
      const yearA = dateA.match(/(\d{4})/)?.[1] || '0'
      const yearB = dateB.match(/(\d{4})/)?.[1] || '0'
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB)
      }
    }
    
    // If dates are equal or one is missing, sort by title
    return (a.title || '').localeCompare(b.title || '')
  }

  // Helper function to group items by decade
  const groupByDecade = (items: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    const noDateItems: any[] = []
    
    items.forEach(item => {
      const decade = getDecade(item.date || item.year || '')
      if (decade !== null) {
        const decadeKey = `${decade}s`
        if (!grouped[decadeKey]) {
          grouped[decadeKey] = []
        }
        grouped[decadeKey].push(item)
      } else {
        noDateItems.push(item)
      }
    })
    
    // Sort items within each decade
    Object.keys(grouped).forEach(decade => {
      grouped[decade].sort(sortByDateAndTitle)
    })
    
    // Sort decades
    const sortedDecades = Object.keys(grouped).sort((a, b) => {
      const decadeA = parseInt(a.replace('s', ''))
      const decadeB = parseInt(b.replace('s', ''))
      return decadeA - decadeB
    })
    
    return { grouped, sortedDecades, noDateItems }
  }

  // Group stories by type for tabs
  const fotografias = mapPoint.stories.filter(story => 
    (story.metadata.toLowerCase().includes('fotografía') || 
    story.drivePhotoUrl) &&
    !story.metadata.toLowerCase().includes('artículo') &&
    !story.metadata.toLowerCase().includes('articulo') &&
    !story.title.toLowerCase().includes('artículo') &&
    !story.title.toLowerCase().includes('articulo')
  )

  const fotografiasGrouped = groupByDecade(fotografias)

  // Reset selectedImageIndex if it's out of bounds
  if (selectedImageIndex >= fotografias.length && fotografias.length > 0) {
    setSelectedImageIndex(0)
  }
  
  // Filter testimonials from CSV
  const testimonios = mapPoint.stories
    .filter(story => 
      story.metadata.toLowerCase().includes('testimonio') || 
      story.description.toLowerCase().includes('testimonio') ||
      story.testimonial
    )
    .map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      author: story.source || "Autor desconocido",
      year: story.date || "",
      date: story.date || "",
      location: story.location,
      testimonial: story.testimonial || story.description,
      metadata: story.metadata
    }))

  const testimoniosGrouped = groupByDecade(testimonios)
  
  const articulos = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('artículo') || 
    story.metadata.toLowerCase().includes('articulo') ||
    story.title.toLowerCase().includes('artículo') ||
    story.title.toLowerCase().includes('articulo') ||
    story.driveArticlePhotoUrl
  )

  const articulosGrouped = groupByDecade(articulos)

  // Filter videos from CSV
  const videos = mapPoint.stories
    .filter(story => story.videoUrl)
    .map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      author: story.source || "Autor desconocido",
      year: story.date || "",
      date: story.date || "",
      location: story.location,
      videoUrl: story.videoUrl!
    }))

  const videosGrouped = groupByDecade(videos)

  // Image gallery handlers
  const openImageGallery = (index: number) => {
    // Ensure the index is valid
    if (index >= 0 && index < fotografias.length) {
      setSelectedImageIndex(index)
      setShowImageGallery(true)
    }
  }

  const closeImageGallery = () => {
    setShowImageGallery(false)
  }

  // Article gallery handlers
  const openArticleGallery = (index: number) => {
    // Ensure the index is valid
    if (index >= 0 && index < articulos.length) {
      setSelectedArticleIndex(index)
      setShowArticleGallery(true)
    }
  }

  const closeArticleGallery = () => {
    setShowArticleGallery(false)
  }

  // Video gallery handlers
  const openVideoGallery = (index: number) => {
    // Ensure the index is valid
    if (index >= 0 && index < videos.length) {
      setSelectedVideoIndex(index)
      setShowVideoGallery(true)
    }
  }

  const closeVideoGallery = () => {
    setShowVideoGallery(false)
  }

  // Testimonials gallery handlers
  const openTestimonialsGallery = (index: number) => {
    // Ensure the index is valid
    if (index >= 0 && index < testimonios.length) {
      setSelectedTestimonialIndex(index)
      setShowTestimonialsGallery(true)
    }
  }

  const closeTestimonialsGallery = () => {
    setShowTestimonialsGallery(false)
  }

  return (
    <div
      className={`fixed top-4 right-4 w-[640px] z-[1000] transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[calc(100vh-2rem)]"
      }`}
    >
             <div className="bg-stone-50 shadow-2xl h-full overflow-hidden  border-primary rounded-2xl">
         <div className="flex items-center justify-between p-4 border-b border-border/30 bg-stone-50/95 backdrop-blur-sm">
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
            {isMinimized && (
              <span className="text-sm font-semibold text-foreground font-heading ml-4">
                {mapPoint.primaryStory.location}
              </span>
            )}
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

        {!isMinimized && (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Main Image with Title Overlay */}
                         <div className="relative h-48 bg-gradient-to-br from-stone-50/20 to-stone-50/40 flex items-center justify-center overflow-hidden">
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
                      <Image 
                        src="/placeholder.svg"
                        alt="Placeholder"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover "
                      />
                )
              })()}
              
              {/* Title Card Overlay */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 drop-shadow-2xl">
                <Card className="bg-white backdrop-blur-sm shadow-2xl border-0 px-6 py-3 rounded-xl">
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
                  <TabsTrigger value="videos" className="flex-1">
                    Videos ({videos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fotografias" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  <div className="space-y-6">
                    {fotografias.length > 0 ? (
                      <>
                        {/* Timeline by decades */}
                        {fotografiasGrouped.sortedDecades.map((decade) => (
                          <div key={decade} className="space-y-3">
                            {/* Decade separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">{decade}</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items in this decade */}
                            <div className="grid grid-cols-3 gap-2">
                              {fotografiasGrouped.grouped[decade].map((story, index) => {
                                const globalIndex = fotografias.findIndex(s => s.id === story.id)
                                const imageUrl = getImageUrl(story)
                                return (
                                  <div 
                                    key={story.id} 
                                    className="cursor-pointer aspect-square bg-stone-50 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                                    onClick={() => openImageGallery(globalIndex)}
                                  >
                                    {imageUrl ? (
                                      <Image 
                                        src={imageUrl}
                                        alt={story.title}
                                        width={180}
                                        height={180}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-muted-foreground text-sm">
                                          img{globalIndex + 1}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Items without date */}
                        {fotografiasGrouped.noDateItems.length > 0 && (
                          <div className="space-y-3">
                            {/* No date separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">Sin fecha</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items without date */}
                            <div className="grid grid-cols-3 gap-2">
                              {fotografiasGrouped.noDateItems.map((story, index) => {
                                const globalIndex = fotografias.findIndex(s => s.id === story.id)
                                const imageUrl = getImageUrl(story)
                                return (
                                  <div 
                                    key={story.id} 
                                    className="cursor-pointer aspect-square bg-stone-50 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                                    onClick={() => openImageGallery(globalIndex)}
                                  >
                                    {imageUrl ? (
                                      <Image 
                                        src={imageUrl}
                                        alt={story.title}
                                        width={180}
                                        height={180}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-muted-foreground text-sm">
                                          img{globalIndex + 1}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        

                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-2">No hay fotografías disponibles</h3>
                        <p className="text-xs text-muted-foreground">
                          No se encontraron fotografías para esta ubicación.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="testimonios" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  <div className="space-y-6">
                    {testimonios.length > 0 ? (
                      <>
                        {/* Timeline by decades */}
                        {testimoniosGrouped.sortedDecades.map((decade) => (
                          <div key={decade} className="space-y-3">
                            {/* Decade separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">{decade}</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items in this decade */}
                            <div className="space-y-3">
                              {testimoniosGrouped.grouped[decade].map((testimonial, index) => {
                                const globalIndex = testimonios.findIndex(t => t.id === testimonial.id)
                                return (
                                  <Card 
                                    key={testimonial.id} 
                                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => openTestimonialsGallery(globalIndex)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <Quote className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-medium text-sm mb-2">{testimonial.title}</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {testimonial.testimonial.substring(0, 120)}...
                                          </p>
                                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <span className="font-medium">{testimonial.author}</span>
                                            <span>•</span>
                                            <span>{testimonial.year}</span>
                                            {testimonial.metadata && (
                                              <>
                                                <span>•</span>
                                                <span className="text-blue-600">{testimonial.metadata}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Items without date */}
                        {testimoniosGrouped.noDateItems.length > 0 && (
                          <div className="space-y-3">
                            {/* No date separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">Sin fecha</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items without date */}
                            <div className="space-y-3">
                              {testimoniosGrouped.noDateItems.map((testimonial, index) => {
                                const globalIndex = testimonios.findIndex(t => t.id === testimonial.id)
                                return (
                                  <Card 
                                    key={testimonial.id} 
                                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => openTestimonialsGallery(globalIndex)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <Quote className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-medium text-sm mb-2">{testimonial.title}</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {testimonial.testimonial.substring(0, 120)}...
                                          </p>
                                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <span className="font-medium">{testimonial.author}</span>
                                            <span>•</span>
                                            <span>{testimonial.year}</span>
                                            {testimonial.metadata && (
                                              <>
                                                <span>•</span>
                                                <span className="text-blue-600">{testimonial.metadata}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-2">No hay testimonios disponibles</h3>
                        <p className="text-xs text-muted-foreground">
                          No se encontraron testimonios para esta ubicación.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="articulos" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  <div className="space-y-6">
                    {articulos.length > 0 ? (
                      <>
                        {/* Timeline by decades */}
                        {articulosGrouped.sortedDecades.map((decade) => (
                          <div key={decade} className="space-y-3">
                            {/* Decade separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">{decade}</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items in this decade */}
                            <div className="space-y-3">
                              {articulosGrouped.grouped[decade].map((story, index) => {
                                const globalIndex = articulos.findIndex(s => s.id === story.id)
                                const imageUrl = getImageUrl(story)
                                return (
                                  <Card 
                                    key={story.id} 
                                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => openArticleGallery(globalIndex)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex gap-4">
                                        {/* Text Content Section */}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm mb-2 line-clamp-2 overflow-hidden text-ellipsis">{story.title}</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 overflow-hidden text-ellipsis mb-3">
                                            {story.description}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="truncate">{story.source || "Autor desconocido"}</span>
                                            <span>•</span>
                                            <span className="truncate">{story.date || ""}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Image Section */}
                                        <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-stone-50">
                                          {imageUrl ? (
                                            <Image 
                                              src={imageUrl}
                                              alt={story.title}
                                              width={96}
                                              height={96}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <FileText className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Items without date */}
                        {articulosGrouped.noDateItems.length > 0 && (
                          <div className="space-y-3">
                            {/* No date separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">Sin fecha</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items without date */}
                            <div className="space-y-3">
                              {articulosGrouped.noDateItems.map((story, index) => {
                                const globalIndex = articulos.findIndex(s => s.id === story.id)
                                const imageUrl = getImageUrl(story)
                                return (
                                  <Card 
                                    key={story.id} 
                                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => openArticleGallery(globalIndex)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex gap-4">
                                        {/* Text Content Section */}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm mb-2 line-clamp-2 overflow-hidden text-ellipsis">{story.title}</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 overflow-hidden text-ellipsis mb-3">
                                            {story.description}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="truncate">{story.source || "Autor desconocido"}</span>
                                            <span>•</span>
                                            <span className="truncate">{story.date || ""}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Image Section */}
                                        <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-stone-50">
                                          {imageUrl ? (
                                            <Image 
                                              src={imageUrl}
                                              alt={story.title}
                                              width={96}
                                              height={96}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <FileText className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-2">No hay artículos disponibles</h3>
                        <p className="text-xs text-muted-foreground">
                          No se encontraron artículos para esta ubicación.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="mt-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin">
                  <div className="space-y-6">
                    {videos.length > 0 ? (
                      <>
                        {/* Timeline by decades */}
                        {videosGrouped.sortedDecades.map((decade) => (
                          <div key={decade} className="space-y-3">
                            {/* Decade separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">{decade}</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items in this decade */}
                            <div className="grid grid-cols-3 gap-2">
                              {videosGrouped.grouped[decade].map((video, index) => {
                                const globalIndex = videos.findIndex(v => v.id === video.id)
                                // Extract video ID and generate thumbnail for different video types
                                const getYouTubeVideoId = (url: string): string | null => {
                                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                                  const match = url.match(regExp)
                                  return (match && match[2].length === 11) ? match[2] : null
                                }

                                const getGoogleDriveFileId = (url: string): string | null => {
                                  // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
                                  const fileIdMatch1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
                                  if (fileIdMatch1) {
                                    return fileIdMatch1[1]
                                  }
                                  
                                  // Format 2: https://drive.usercontent.google.com/download?id=FILE_ID&authuser=0
                                  const fileIdMatch2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
                                  if (fileIdMatch2) {
                                    return fileIdMatch2[1]
                                  }
                                  
                                  return null
                                }

                                const isGoogleDriveVideo = (url: string): boolean => {
                                  return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')
                                }
                                
                                const getVideoThumbnailUrl = (url: string): string => {
                                  if (isGoogleDriveVideo(url)) {
                                    const fileId = getGoogleDriveFileId(url)
                                    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w320` : '/placeholder.svg'
                                  } else {
                                    // YouTube
                                    const videoId = getYouTubeVideoId(url)
                                    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder.svg'
                                  }
                                }
                                
                                const thumbnailUrl = getVideoThumbnailUrl(video.videoUrl || '')
                                
                                return (
                                  <div 
                                    key={video.id} 
                                    className="cursor-pointer aspect-video bg-stone-50 rounded-md overflow-hidden hover:opacity-80 transition-opacity relative group"
                                    onClick={() => openVideoGallery(globalIndex)}
                                  >
                                    <img 
                                      src={thumbnailUrl}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                        <Play className="h-6 w-6 text-white ml-1" />
                                      </div>
                                    </div>
                                    {/* Video info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                      <h4 className="text-white text-xs font-medium truncate">{video.title}</h4>
                                      <p className="text-white/80 text-xs truncate">{video.author}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {/* Items without date */}
                        {videosGrouped.noDateItems.length > 0 && (
                          <div className="space-y-3">
                            {/* No date separator */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-sm font-medium text-muted-foreground px-2">Sin fecha</span>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>
                            
                            {/* Items without date */}
                            <div className="grid grid-cols-3 gap-2">
                              {videosGrouped.noDateItems.map((video, index) => {
                                const globalIndex = videos.findIndex(v => v.id === video.id)
                                // Extract video ID and generate thumbnail for different video types
                                const getYouTubeVideoId = (url: string): string | null => {
                                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                                  const match = url.match(regExp)
                                  return (match && match[2].length === 11) ? match[2] : null
                                }

                                const getGoogleDriveFileId = (url: string): string | null => {
                                  // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
                                  const fileIdMatch1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
                                  if (fileIdMatch1) {
                                    return fileIdMatch1[1]
                                  }
                                  
                                  // Format 2: https://drive.usercontent.google.com/download?id=FILE_ID&authuser=0
                                  const fileIdMatch2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
                                  if (fileIdMatch2) {
                                    return fileIdMatch2[1]
                                  }
                                  
                                  return null
                                }

                                const isGoogleDriveVideo = (url: string): boolean => {
                                  return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')
                                }
                                
                                const getVideoThumbnailUrl = (url: string): string => {
                                  if (isGoogleDriveVideo(url)) {
                                    const fileId = getGoogleDriveFileId(url)
                                    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w320` : '/placeholder.svg'
                                  } else {
                                    // YouTube
                                    const videoId = getYouTubeVideoId(url)
                                    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder.svg'
                                  }
                                }
                                
                                const thumbnailUrl = getVideoThumbnailUrl(video.videoUrl || '')
                                
                                return (
                                  <div 
                                    key={video.id} 
                                    className="cursor-pointer aspect-video bg-stone-50 rounded-md overflow-hidden hover:opacity-80 transition-opacity relative group"
                                    onClick={() => openVideoGallery(globalIndex)}
                                  >
                                    <img 
                                      src={thumbnailUrl}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                        <Play className="h-6 w-6 text-white ml-1" />
                                      </div>
                                    </div>
                                    {/* Video info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                      <h4 className="text-white text-xs font-medium truncate">{video.title}</h4>
                                      <p className="text-white/80 text-xs truncate">{video.author}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-50 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-2">No hay videos disponibles</h3>
                        <p className="text-xs text-muted-foreground">
                          No se encontraron videos para esta ubicación.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery Modal */}
      {fotografias.length > 0 && (
        <PhotoGalleryModal
          isOpen={showImageGallery}
          onClose={closeImageGallery}
          fotografias={fotografias}
          startIndex={selectedImageIndex}
        />
      )}

      {/* Article Gallery Modal */}
      {articulos.length > 0 && (
        <PhotoGalleryModal
          isOpen={showArticleGallery}
          onClose={closeArticleGallery}
          fotografias={articulos}
          startIndex={selectedArticleIndex}
        />
      )}

      {/* Video Gallery Modal */}
      {videos.length > 0 && (
        <VideoGalleryModal
          isOpen={showVideoGallery}
          onClose={closeVideoGallery}
          videos={videos}
          startIndex={selectedVideoIndex}
        />
      )}

      {/* Testimonial Gallery Modal */}
      {testimonios.length > 0 && (
        <TestimonialGalleryModal
          isOpen={showTestimonialsGallery}
          onClose={closeTestimonialsGallery}
          testimonials={testimonios}
          startIndex={selectedTestimonialIndex}
        />
      )}
    </div>
  )
}
