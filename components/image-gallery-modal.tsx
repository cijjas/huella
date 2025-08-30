"use client"

import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { useState, useRef, useEffect, useCallback } from "react"

interface ImageGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  fotografias: StoryPoint[]
  startIndex?: number
}

export function ImageGalleryModal({ isOpen, onClose, fotografias, startIndex = 0 }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Define all callback functions first
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : fotografias.length - 1)
  }, [fotografias.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < fotografias.length - 1 ? prev + 1 : 0)
  }, [fotografias.length])

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
    setCurrentIndex(startIndex)
  }, [startIndex])

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

  const currentStory = fotografias[currentIndex]
  const imageUrl = getImageUrl(currentStory)

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center">
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
      <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex flex-col">
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-30">
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
        <div className="w-80 bg-black/90 backdrop-blur-sm p-6 flex flex-col justify-center">
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2 drop-shadow-lg">Location</h3>
              <p className="text-gray-200 drop-shadow-md">{currentStory.location}</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2 drop-shadow-lg">Title</h3>
              <p className="text-gray-200 drop-shadow-md">{currentStory.title}</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2 drop-shadow-lg">Description</h3>
              <p className="text-gray-200 text-sm leading-relaxed drop-shadow-md">{currentStory.description}</p>
            </div>
            <div>
              <h3 className="text-green-300 font-semibold text-lg mb-2 drop-shadow-lg">Year</h3>
              <p className="text-green-300 drop-shadow-md">{currentStory.year}</p>
            </div>
          </div>
        </div>

        {/* Central Image Area */}
        <div className="flex-1 bg-black/40 backdrop-blur-sm relative flex flex-col overflow-hidden">
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

              {/* Bottom Thumbnails */}
        <div className="h-32 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="flex gap-3 overflow-x-auto max-w-full">
          {fotografias.map((story, index) => {
            const thumbUrl = getImageUrl(story)
            return (
              <div
                key={story.id}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={story.title}
                    width={80}
                    height={80}
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
    </div>
  )
}
