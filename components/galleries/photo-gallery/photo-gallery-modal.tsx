"use client"

import { X, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type StoryPoint } from "@/lib/csv-parser"
import { convertDriveUrlToThumbnail } from "@/lib/utils"
import { imageCache } from "@/lib/image-cache"
import { useState, useRef, useEffect, useCallback } from "react"
import { PhotoDescriptionPanel } from "./photo-description-panel"
import { PhotoMainView } from "./photo-main-view"
import { PhotoPreviewTimeline } from "./photo-preview-timeline"

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

  if (isFullscreen) {
    return (
      <PhotoMainView
        currentStory={currentStory}
        isVisible={isVisible}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPlayPause={handlePlayPause}
        onFullscreen={handleFullscreen}
      />
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
        <PhotoDescriptionPanel 
          currentStory={currentStory}
          isVisible={isVisible}
        />

        {/* Central Image Area */}
        <PhotoMainView
          currentStory={currentStory}
          isVisible={isVisible}
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPlayPause={handlePlayPause}
          onFullscreen={handleFullscreen}
        />
      </div>

      {/* Bottom Thumbnails with Year Separation */}
      <PhotoPreviewTimeline
        fotografiasGrouped={fotografiasGrouped}
        sortedFotografias={sortedFotografias}
        currentIndex={currentIndex}
        isVisible={isVisible}
        onThumbnailClick={handleThumbnailClick}
      />
    </div>
  )
}
