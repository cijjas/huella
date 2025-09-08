"use client"

import { type StoryPoint } from "@/lib/csv-parser"
import Image from "next/image"
import { getImageUrl } from "@/lib/utils"
import { useRef, useEffect, useState } from 'react'

interface PhotoPreviewTimelineProps {
  fotografiasGrouped: {
    grouped: { [key: string]: StoryPoint[] }
    sortedDecades: string[]
    noDateItems: StoryPoint[]
  }
  sortedFotografias: StoryPoint[]
  currentIndex: number
  isVisible: boolean
  onThumbnailClick: (index: number) => void
}

export function PhotoPreviewTimeline({ 
  fotografiasGrouped, 
  sortedFotografias, 
  currentIndex, 
  isVisible, 
  onThumbnailClick 
}: PhotoPreviewTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Store refs to thumbnail elements in a Map, keyed by their sorted index
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [transform, setTransform] = useState(0);

  // This effect recalculates the required translation whenever the selected photo changes
  useEffect(() => {
    const container = containerRef.current;
    const selectedThumb = thumbnailRefs.current.get(currentIndex);

    if (container && selectedThumb) {
      // Calculate the horizontal center of the container (the viewport)
      const containerCenter = container.offsetWidth / 2;
      
      // Calculate the horizontal center of the selected thumbnail relative to the start of the track
      const thumbCenter = selectedThumb.offsetLeft + selectedThumb.offsetWidth / 2;
      
      // The new transform value is the difference, which will shift the track
      // to align the thumbnail's center with the container's center.
      const newTransform = containerCenter - thumbCenter;
      
      setTransform(newTransform);
    }
  // Rerun when currentIndex or the photo list changes
  }, [currentIndex, sortedFotografias]);

  return (
    <div className={`h-40 bg-black/95 backdrop-blur-md flex flex-col transition-opacity duration-1000 ease-in-out ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Viewport: This div defines the visible area of the carousel. `overflow-hidden` is key. */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {/* Track: This div contains all items and moves horizontally.
          The calculated transform is applied here, with a smooth CSS transition.
        */}
        <div 
          className="flex h-full items-center gap-4 px-4" // Layout and spacing for all items
          style={{
            transform: `translateX(${transform}px)`,
            transition: 'transform 0.5s ease-in-out'
          }}
        >
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
                  const sortedIndex = sortedFotografias.findIndex(s => s.id === story.id);
                  const thumbUrl = getImageUrl(story);
                  return (
                    <div
                      key={story.id}
                      ref={(el) => {
                        if (el) thumbnailRefs.current.set(sortedIndex, el);
                        else thumbnailRefs.current.delete(sortedIndex);
                      }}
                      onClick={() => onThumbnailClick(sortedIndex)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        sortedIndex === currentIndex 
                          ? 'border-blue-500 shadow-lg scale-110' // Centered item is larger with a blue outline
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
                  );
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
                  const sortedIndex = sortedFotografias.findIndex(s => s.id === story.id);
                  const thumbUrl = getImageUrl(story);
                  return (
                    <div
                      key={story.id}
                      ref={(el) => {
                        if (el) thumbnailRefs.current.set(sortedIndex, el);
                        else thumbnailRefs.current.delete(sortedIndex);
                      }}
                      onClick={() => onThumbnailClick(sortedIndex)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        sortedIndex === currentIndex 
                          ? 'border-blue-500 shadow-lg scale-110' // Centered item is larger with a blue outline
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}