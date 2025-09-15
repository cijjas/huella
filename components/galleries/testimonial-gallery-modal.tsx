"use client"

import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import { useState, useRef, useEffect, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Testimonial {
  id: string
  title: string
  description: string
  author: string
  year: string
  location: string
  testimonial: string
  metadata?: string
}

interface TestimonialGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  testimonials: Testimonial[]
  startIndex?: number
}

export function TestimonialGalleryModal({ isOpen, onClose, testimonials, startIndex = 0 }: TestimonialGalleryModalProps) {
  const isMobile = useIsMobile()
  
  // Ensure startIndex is within bounds
  const validStartIndex = Math.max(0, Math.min(startIndex, testimonials.length - 1))
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

  const testimonialsGrouped = groupByDecade(testimonials)

  // Create chronologically sorted array for navigation
  const sortedTestimonials = [
    ...testimonialsGrouped.sortedDecades.flatMap(decade => testimonialsGrouped.grouped[decade]),
    ...testimonialsGrouped.noDateItems
  ]

  // Define all callback functions first
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : sortedTestimonials.length - 1)
  }, [sortedTestimonials.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < sortedTestimonials.length - 1 ? prev + 1 : 0)
  }, [sortedTestimonials.length])

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
      }, 8000) // 8 seconds for testimonials
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
    const validStartIndex = Math.max(0, Math.min(startIndex, sortedTestimonials.length - 1))
    setCurrentIndex(validStartIndex)
  }, [startIndex, sortedTestimonials.length])

  // Control visibility transition for smooth fade-in
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

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

  const currentTestimonial = sortedTestimonials[currentIndex]
  
  // Check if currentTestimonial exists and currentIndex is valid
  if (!currentTestimonial || currentIndex < 0 || currentIndex >= sortedTestimonials.length) {
    return null
  }

  if (isFullscreen) {
    return (
      <div 
        className={`fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-1000 ease-in-out ${
          isVisible 
            ? 'bg-black/90' 
            : 'bg-black/0'
        }`}
      >
        {/* Fullscreen - Only testimonial and navigation */}
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

          {/* Main Testimonial */}
          <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden">
            <div className="max-w-4xl w-full">
              <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700 shadow-2xl">
                <CardContent className={`${isMobile ? "p-6" : "p-12"}`}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Quote className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2 font-heading">
                        {currentTestimonial.title}
                      </h2>
                      <p className="text-gray-300 text-sm">
                        {currentTestimonial.author} • {currentTestimonial.year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="prose prose-lg prose-invert max-w-none">
                    <blockquote className="text-xl leading-relaxed text-gray-200 italic border-l-4 border-blue-500 pl-6">
                      "{currentTestimonial.testimonial}"
                    </blockquote>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {currentTestimonial.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      <div className={`flex flex-1 overflow-hidden ${
        isMobile ? "flex-col" : ""
      }`}>
        {/* Left Information Panel */}
        <div className={`bg-black/95 backdrop-blur-md flex flex-col justify-center transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isMobile ? "w-full h-64 p-4" : "w-80 p-6"
        }`}>
          <div className={`${isMobile ? "space-y-4" : "space-y-8"}`}>
            {/* Header Info */}
            <div className="flex justify-between items-center text-white text-sm drop-shadow-md">
              <span>{currentTestimonial.location}</span>
              <span>{currentTestimonial.year}</span>
            </div>

            {/* Main Content Group */}
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-xl mb-3 drop-shadow-lg">Título</h3>
                <p className="text-white text-lg leading-tight drop-shadow-md">{currentTestimonial.title}</p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Descripción</h3>
                <p className="text-white text-sm leading-relaxed drop-shadow-md">{currentTestimonial.description}</p>
              </div>
            </div>

            {/* Metadata Group */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Autor</h3>
                <p className="text-white text-sm drop-shadow-md">{currentTestimonial.author}</p>
              </div>
              
              {currentTestimonial.metadata && (
                <div>
                  <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Categoría</h3>
                  <p className="text-white text-sm drop-shadow-md">{currentTestimonial.metadata}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Central Testimonial Area */}
        <div className={`flex-1 bg-black/60 backdrop-blur-sm relative flex flex-col overflow-hidden transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Main Testimonial */}
          <div className={`flex-1 flex items-center justify-center overflow-hidden ${
            isMobile ? "p-4" : "p-8"
          }`}>
            <div className="max-w-4xl w-full">
              <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700 shadow-2xl">
                <CardContent className={`${isMobile ? "p-6" : "p-12"}`}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Quote className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2 font-heading">
                        {currentTestimonial.title}
                      </h2>
                      <p className="text-gray-300 text-sm">
                        {currentTestimonial.author} • {currentTestimonial.year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="prose prose-lg prose-invert max-w-none">
                    <blockquote className="text-xl leading-relaxed text-gray-200 italic border-l-4 border-blue-500 pl-6">
                      "{currentTestimonial.testimonial}"
                    </blockquote>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {currentTestimonial.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
              isMobile ? "left-2 h-10 w-10" : "left-4 h-12 w-12"
            }`}
          >
            <ChevronLeft className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
              isMobile ? "right-2 h-10 w-10" : "right-4 h-12 w-12"
            }`}
          >
            <ChevronRight className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
          </Button>

          {/* Bottom Controls */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 flex items-center ${
            isMobile ? "bottom-4 gap-2" : "bottom-8 gap-4"
          }`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className={`bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
                isMobile ? "h-8 w-8" : "h-10 w-10"
              }`}
            >
              {isPlaying ? (
                <Pause className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
              ) : (
                <Play className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className={`bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
                isMobile ? "h-8 w-8" : "h-10 w-10"
              }`}
            >
              <Maximize2 className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnails with Year Separation */}
      <div className={`bg-black/95 backdrop-blur-md flex flex-col transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${isMobile ? "h-32" : "h-40"}`}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full items-center justify-center">
            {/* Timeline by decades */}
            {testimonialsGrouped.sortedDecades.map((decade) => (
              <div key={decade} className="flex-shrink-0">
                {/* Decade separator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-xs font-medium text-gray-400 px-2 whitespace-nowrap">{decade}</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>
                
                {/* Thumbnails in this decade */}
                <div className="flex gap-2">
                  {testimonialsGrouped.grouped[decade].map((testimonial) => {
                    const sortedIndex = sortedTestimonials.findIndex(t => t.id === testimonial.id)
                    return (
                      <div
                        key={testimonial.id}
                        onClick={() => handleThumbnailClick(sortedIndex)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all bg-gray-800 flex items-center justify-center ${
                          sortedIndex === currentIndex 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center p-1">
                          <Quote className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-300 truncate">{testimonial.author}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {/* Items without date */}
            {testimonialsGrouped.noDateItems.length > 0 && (
              <div className="flex-shrink-0">
                {/* No date separator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-600"></div>
                  <span className="text-xs font-medium text-gray-400 px-2 whitespace-nowrap">Sin fecha</span>
                  <div className="flex-1 h-px bg-gray-600"></div>
                </div>
                
                {/* Thumbnails without date */}
                <div className="flex gap-2">
                  {testimonialsGrouped.noDateItems.map((testimonial) => {
                    const sortedIndex = sortedTestimonials.findIndex(t => t.id === testimonial.id)
                    return (
                      <div
                        key={testimonial.id}
                        onClick={() => handleThumbnailClick(sortedIndex)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all bg-gray-800 flex items-center justify-center ${
                          sortedIndex === currentIndex 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center p-1">
                          <Quote className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-300 truncate">{testimonial.author}</p>
                        </div>
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
