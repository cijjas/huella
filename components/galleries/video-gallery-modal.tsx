"use client"

import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type StoryPoint } from "@/lib/csv-parser"
import { useState, useRef, useEffect, useCallback } from "react"

interface Video {
  id: string
  title: string
  description: string
  author: string
  year: string
  location: string
  videoUrl: string
  thumbnailUrl?: string
}

interface VideoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  videos: Video[]
  startIndex?: number
}

export function VideoGalleryModal({ isOpen, onClose, videos, startIndex = 0 }: VideoGalleryModalProps) {
  // Ensure startIndex is within bounds
  const validStartIndex = Math.max(0, Math.min(startIndex, videos.length - 1))
  const [currentIndex, setCurrentIndex] = useState(validStartIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Extract Google Drive file ID from URL
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

  // Check if URL is a Google Drive video
  const isGoogleDriveVideo = (url: string): boolean => {
    return url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')
  }

  // Get appropriate embed URL based on video type
  const getVideoEmbedUrl = (url: string): string => {
    if (isGoogleDriveVideo(url)) {
      const fileId = getGoogleDriveFileId(url)
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url
    } else {
      // YouTube or other video
      const videoId = getYouTubeVideoId(url)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url
    }
  }

  // Get appropriate thumbnail URL based on video type
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

  // Legacy functions for backward compatibility
  const getYouTubeEmbedUrl = (url: string): string => getVideoEmbedUrl(url)
  const getYouTubeThumbnailUrl = (url: string): string => getVideoThumbnailUrl(url)

  // Define all callback functions first
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : videos.length - 1)
  }, [videos.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev < videos.length - 1 ? prev + 1 : 0)
  }, [videos.length])

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
      }, 10000) // 10 seconds for videos
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
    const validStartIndex = Math.max(0, Math.min(startIndex, videos.length - 1))
    setCurrentIndex(validStartIndex)
  }, [startIndex, videos.length])

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

  const currentVideo = videos[currentIndex]
  
  // Check if currentVideo exists and currentIndex is valid
  if (!currentVideo || currentIndex < 0 || currentIndex >= videos.length) {
    return null
  }
  
  const embedUrl = getYouTubeEmbedUrl(currentVideo.videoUrl)
  const thumbnailUrl = getYouTubeThumbnailUrl(currentVideo.videoUrl)

  if (isFullscreen) {
    return (
      <div 
        className={`fixed inset-0 z-[2000] flex items-center justify-center transition-all duration-1000 ease-in-out ${
          isVisible 
            ? 'bg-black/90' 
            : 'bg-black/0'
        }`}
      >
        {/* Fullscreen - Only video and navigation */}
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

          {/* Main Video */}
          <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <iframe
                src={embedUrl}
                title={currentVideo.title}
                className="w-full h-full rounded-lg shadow-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
      <div className="flex flex-1 overflow-hidden">
        {/* Left Information Panel */}
        <div className={`w-80 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-center transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="space-y-8">
            {/* Header Info */}
            <div className="flex justify-between items-center text-white text-sm drop-shadow-md">
              <span>{currentVideo.location}</span>
              <span>{currentVideo.year}</span>
            </div>

            {/* Main Content Group */}
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-xl mb-3 drop-shadow-lg">Título</h3>
                <p className="text-white text-lg leading-tight drop-shadow-md">{currentVideo.title}</p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Descripción</h3>
                <p className="text-white text-sm leading-relaxed drop-shadow-md">{currentVideo.description}</p>
              </div>
            </div>

            {/* Metadata Group */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div>
                <h3 className="text-white font-semibold text-base mb-2 drop-shadow-lg">Autor</h3>
                <p className="text-white text-sm drop-shadow-md">{currentVideo.author}</p>
              </div>
              
              <div>
                <a
                  href={currentVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white hover:text-gray-300 transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ver en YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Central Video Area */}
        <div className={`flex-1 bg-black/60 backdrop-blur-sm relative flex flex-col overflow-hidden transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Main Video */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <iframe
                src={embedUrl}
                title={currentVideo.title}
                className="w-full h-full rounded-lg shadow-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
      <div className={`h-32 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex gap-3 overflow-x-auto max-w-full">
          {videos.map((video, index) => {
            const thumbUrl = getYouTubeThumbnailUrl(video.videoUrl)
            return (
              <div
                key={video.id}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
