"use client"

import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"

interface FloatingTimelineProps {
  yearRange: [number, number]
  currentYear: number
  onYearChange: (year: number) => void
  includeUnknown: boolean
  onIncludeUnknownChange: (include: boolean) => void
}

const TIMELINE_YEARS = [1960, 1970, 1980, 1993]

export function FloatingTimeline({
  yearRange,
  currentYear,
  onYearChange,
  includeUnknown,
  onIncludeUnknownChange,
}: FloatingTimelineProps) {
  // Find the closest year from our timeline
  const getClosestYear = (year: number) => {
    return TIMELINE_YEARS.reduce((prev, curr) => 
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    )
  }

  const timelineYear = getClosestYear(currentYear)
  const timelineIndex = TIMELINE_YEARS.indexOf(timelineYear)

  return (
    <div className="fixed bottom-6 left-6 z-[1000]">
      <Card className="shadow-lg min-w-[400px]">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm font-heading">Años</h3>
              <span className="text-xs font-bold bg-muted px-2 py-1 rounded-full">
                {timelineYear}
              </span>
            </div>

            {/* Year markers */}
            <div className="flex justify-between text-xs text-muted-foreground font-medium px-2">
              {TIMELINE_YEARS.map((year) => (
                <span key={year}>{year}</span>
              ))}
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                value={[timelineIndex]}
                onValueChange={(value) => onYearChange(TIMELINE_YEARS[value[0]])}
                min={0}
                max={TIMELINE_YEARS.length - 1}
                step={1}
                className="w-full"
              />
            </div>



            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={includeUnknown}
                onChange={(e) => onIncludeUnknownChange(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              Incluir años desconocidos
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
