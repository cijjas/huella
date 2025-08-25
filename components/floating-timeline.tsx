"use client"

import { Slider } from "@/components/ui/slider"

interface FloatingTimelineProps {
  yearRange: [number, number]
  currentYear: number
  onYearChange: (year: number) => void
  includeUnknown: boolean
  onIncludeUnknownChange: (include: boolean) => void
}

export function FloatingTimeline({
  yearRange,
  currentYear,
  onYearChange,
  includeUnknown,
  onIncludeUnknownChange,
}: FloatingTimelineProps) {
  return (
    <div className="fixed bottom-6 left-6 paper-card shadow-lg p-4 z-[1000] min-w-[300px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground font-heading">Years and period</h3>
          <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-full">{currentYear}</span>
        </div>

        <div className="px-2">
          <Slider
            value={[currentYear]}
            onValueChange={(value) => onYearChange(value[0])}
            min={yearRange[0]}
            max={yearRange[1]}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>{yearRange[0]}</span>
          <span>{yearRange[1]}</span>
        </div>

        <label className="flex items-center gap-2 text-xs text-card-foreground font-medium cursor-pointer hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={includeUnknown}
            onChange={(e) => onIncludeUnknownChange(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          Include unknown years
        </label>
      </div>
    </div>
  )
}
