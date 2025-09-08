"use client"

import { type StoryPoint } from "@/lib/csv-parser"

interface PhotoDescriptionPanelProps {
  currentStory: StoryPoint
  isVisible: boolean
}

export function PhotoDescriptionPanel({ currentStory, isVisible }: PhotoDescriptionPanelProps) {
  return (
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
  )
}
