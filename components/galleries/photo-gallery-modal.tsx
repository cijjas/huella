"use client"

import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl, getLazyImageUrl, convertDriveUrlToThumbnail } from "@/lib/utils"
import { imageCache } from "@/lib/image-cache"
import { useState, useRef, useEffect, useCallback } from "react"

interface PhotoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  fotografias: StoryPoint[]
  startIndex?: number
}

export function PhotoGalleryModal({ isOpen, onClose, fotografias, startIndex = 0 }: PhotoGalleryModalProps) {
  // Ensure startIndex is within bounds
  const validStartIndex = Math.max(0, Math.min(startIndex, fotografias.length - 1))
  const [currentIndex, setCurrentIndex] = useState(validStartIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const fotografiasGrouped = groupByDecade(fotografias)

  // Create chronologically sorted array for navigation
  const sortedFotografias = [
    ...fotografiasGrouped.sortedDecades.flatMap(decade => fotografiasGrouped.grouped[decade]),
    ...fotografiasGrouped.noDateItems
  ]

  // Define all callback functions first
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : sortedFotografias.length - 1)
  }, [sortedFotografias.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < sortedFotografias.length - 1 ? prev + 1 : 0)
  }, [sortedFotografias.length])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    } else {
      setIsPlaying(true)
      playIntervalRef.current = setInterval(() => {
        handleNext()
      }, 3000)
    }
  }, [isPlaying, handleNext])

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
        // Fallback to our custom fullscreen if browser fullscreen fails
        setIsFullscreen(prev => !prev)
      })
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err)
        // Fallback to our custom fullscreen if browser fullscreen fails
        setIsFullscreen(prev => !prev)
      })
    }
  }, [])

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])
  
  // Update currentIndex when startIndex changes
  useEffect(() => {
    const validStartIndex = Math.max(0, Math.min(startIndex, sortedFotografias.length - 1))
    setCurrentIndex(validStartIndex)
  }, [startIndex, sortedFotografias.length])

  // Control visibility transition for smooth fade-in and lazy load images
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 50)

      // Lazy load all images in the gallery
      const lazyLoadImages = async () => {
        const imageUrls = sortedFotografias
          .map(story => {
            // Use the proper utility function for URL conversion
            if (story.drivePhotoUrl && story.drivePhotoUrl !== '-' && story.drivePhotoUrl.trim()) {
              return convertDriveUrlToThumbnail(story.drivePhotoUrl, 'w1000')
            }
            if (story.driveArticlePhotoUrl && story.driveArticlePhotoUrl !== '-' && story.driveArticlePhotoUrl.trim()) {
              return convertDriveUrlToThumbnail(story.driveArticlePhotoUrl, 'w1000')
            }
            return null
          })
          .filter(Boolean) as string[]

        if (imageUrls.length > 0) {
          console.log(`Lazy loading ${imageUrls.length} images for photo gallery...`)
          await imageCache.lazyLoadGalleryImages(imageUrls)
        }
      }

      lazyLoadImages()

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, sortedFotografias])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Listen for keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
        case 'Escape':
          event.preventDefault()
          if (isFullscreen) {
            handleFullscreen()
          } else {
            onClose()
          }
          break
        case ' ':
          event.preventDefault()
          handlePlayPause()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePrevious, handleNext, handleFullscreen, handlePlayPause, isFullscreen, onClose])

  if (!isOpen) return null

  const currentStory = sortedFotografias[currentIndex]
  
  // Check if currentStory exists and currentIndex is valid
  if (!currentStory || currentIndex < 0 || currentIndex >= sortedFotografias.length) {
    return null
  }
  
  const imageUrl = getImageUrl(currentStory)

  if (isFullscreen) {
    return (
      <div 
        className={`fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-1000 ease-in-out ${
          isVisible 
            ? 'bg-black/90' 
            : 'bg-black/0'
        }`}
      >
        {/* Fullscreen - Only image and navigation */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
            {imageUrl ? (
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={currentStory.title}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  priority
                />
              </div>
            ) : (
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📸</div>
                <p>Imagen no disponible</p>
              </div>
            )}
          </div>

          {/* Exit Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="absolute top-4 right-4 z-30 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
          >
            <Minimize2 className="h-6 w-6" />
          </Button>
        </div>
      </div>
    )
  }

        return (
          <div 
        className={`fixed inset-0 z-[2000] flex flex-col transition-all duration-1000 ease-in-out ${
          isVisible 
            ? 'bg-black/50' 
            : 'bg-black/0'
        }`}
      >
      {/* Close Button */}
      <div className={`absolute top-4 right-4 z-30 transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Information Panel */}
        <div className={`w-80 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-center transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="space-y-8">
            {/* Header Info */}
            <div className="flex justify-between items-center text-white text-sm drop-shadow-md">
              <span>{currentStory.location}</span>
              <span>{currentStory.date}</span>
            </div>

            {/* Main Content Group */}
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-xl mb-3 drop-shadow-lg">Título</h3>
                <p className="text-white text-lg leading-tight drop-shadow-md">{currentStory.title}</p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Descripción</h3>
                <p className="text-white text-sm leading-relaxed drop-shadow-md">{currentStory.description}</p>
              </div>
            </div>

            {/* Metadata Group */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Fuente</h3>
                <p className="text-white text-sm drop-shadow-md">{currentStory.source}</p>
              </div>
              
              {currentStory.bibliographicReference && (
                <div>
                  <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Referencia Bibliográfica</h3>
                  <p className="text-white text-xs leading-relaxed drop-shadow-md">{currentStory.bibliographicReference}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Central Image Area */}
        <div className={`flex-1 bg-black/60 backdrop-blur-sm relative flex flex-col overflow-hidden transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={currentStory.title}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  priority
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <p>Imagen no disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

                    {/* Bottom Thumbnails with Year Separation */}
      <div className={`h-40 bg-black/95 backdrop-blur-md flex flex-col transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full items-center justify-center">
            {/* Timeline by decades */}
            {fotografiasGrouped.sortedDecades.map((decade) => (
              <div key={decade} className="flex-shrink-0">
                {/* Decade separator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-xs font-medium text-gray-400 px-2 whitespace-nowrap">{decade}</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>
                
                {/* Thumbnails in this decade */}
                <div className="flex gap-2">
                  {fotografiasGrouped.grouped[decade].map((story) => {
                    const sortedIndex = sortedFotografias.findIndex(s => s.id === story.id)
                    const thumbUrl = getImageUrl(story)
                    return (
                      <div
                        key={story.id}
                        onClick={() => handleThumbnailClick(sortedIndex)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          sortedIndex === currentIndex 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt={story.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📸</span>
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
              <div className="flex-shrink-0">
                {/* No date separator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-xs font-medium text-gray-400 px-2 whitespace-nowrap">Sin fecha</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>
                
                {/* Thumbnails without date */}
                <div className="flex gap-2">
                  {fotografiasGrouped.noDateItems.map((story) => {
                    const sortedIndex = sortedFotografias.findIndex(s => s.id === story.id)
                    const thumbUrl = getImageUrl(story)
                    return (
                      <div
                        key={story.id}
                        onClick={() => handleThumbnailClick(sortedIndex)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          sortedIndex === currentIndex 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt={story.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📸</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
