"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { type StoryPoint } from "@/lib/csv-parser"

interface StorySelectorProps {
  stories: StoryPoint[]
  selectedStory: StoryPoint
  onStorySelect: (story: StoryPoint) => void
}

export function StorySelector({ stories, selectedStory, onStorySelect }: StorySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (stories.length <= 1) {
    return null
  }

  return (
    <div className="border-b border-border/20 mb-4">
      <Button
        variant="ghost" 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between p-4 h-auto text-left"
      >
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {stories.length} historias
          </Badge>
          <span className="text-sm text-muted-foreground">
            en esta ubicación
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {stories.map((story, index) => (
            <Button
              key={story.id}
              variant={story.id === selectedStory.id ? "default" : "outline"}
              onClick={() => onStorySelect(story)}
              className="w-full justify-start h-auto p-3 text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {story.categoria}
                  </span>
                </div>
                <div className="font-medium text-sm line-clamp-1">
                  {story.titulo}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {story.autor} • {story.año}
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
