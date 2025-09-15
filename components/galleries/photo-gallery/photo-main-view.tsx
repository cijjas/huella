"use client"

import { ChevronLeft, ChevronRight, Play, Pause, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface PhotoMainViewProps {
  currentStory: StoryPoint
  isVisible: boolean
  isPlaying: boolean
  isFullscreen: boolean
  onPrevious: () => void
  onNext: () => void
  onPlayPause: () => void
  onFullscreen: () => void
}

export function PhotoMainView({ 
  currentStory, 
  isVisible, 
  isPlaying, 
  isFullscreen,
  onPrevious, 
  onNext, 
  onPlayPause, 
  onFullscreen 
}: PhotoMainViewProps) {
  const isMobile = useIsMobile()
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
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
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
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 bg-black/60 backdrop-blur-sm relative flex flex-col overflow-hidden transition-opacity duration-1000 ease-in-out ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Main Image */}
      <div className={`flex-1 flex items-center justify-center overflow-hidden ${
        isMobile ? "p-4" : "p-8"
      }`}>
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
        onClick={onPrevious}
        className={`absolute top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
          isMobile ? "left-2 h-10 w-10" : "left-4 h-12 w-12"
        }`}
      >
        <ChevronLeft className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
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
          onClick={onPlayPause}
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
          onClick={onFullscreen}
          className={`bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg cursor-pointer ${
            isMobile ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          <Maximize2 className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
        </Button>
      </div>
    </div>
  )
}
