"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react"
import type { StoryPoint } from "@/lib/csv-parser"

interface TimelineControlProps {
  points: StoryPoint[]
  yearRange: [number, number]
  currentYear: number[]
  onYearChange: (year: number[]) => void
  includeUnknownYears: boolean
  onIncludeUnknownChange: (include: boolean) => void
  filteredCount: number
  totalCount: number
}

interface HistoricalPeriod {
  name: string
  startYear: number
  endYear: number
  color: string
  description: string
}

const HISTORICAL_PERIODS: HistoricalPeriod[] = [
  {
    name: "Época Dorada",
    startYear: 1891,
    endYear: 1930,
    color: "bg-amber-500",
    description: "Construcción y apogeo inicial del ferrocarril",
  },
  {
    name: "Modernización",
    startYear: 1930,
    endYear: 1960,
    color: "bg-blue-500",
    description: "Mejoras técnicas y expansión del servicio",
  },
  {
    name: "Declive",
    startYear: 1960,
    endYear: 1990,
    color: "bg-red-500",
    description: "Reducción del servicio y abandono",
  },
  {
    name: "Renovación",
    startYear: 1990,
    endYear: 2024,
    color: "bg-green-500",
    description: "Restauración como tren turístico",
  },
]

export default function TimelineControl({
  points,
  yearRange,
  currentYear,
  onYearChange,
  includeUnknownYears,
  onIncludeUnknownChange,
  filteredCount,
  totalCount,
}: TimelineControlProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // milliseconds per year

  // Calculate data density for each decade
  const dataDensity = useMemo(() => {
    const density: Record<number, number> = {}
    const decadeSize = 10

    for (let year = yearRange[0]; year <= yearRange[1]; year += decadeSize) {
      const decadeStart = year
      const decadeEnd = year + decadeSize - 1
      const count = points.filter(
        (p) => p.parsedYear && p.parsedYear >= decadeStart && p.parsedYear <= decadeEnd,
      ).length

      density[decadeStart] = count
    }

    return density
  }, [points, yearRange])

  const maxDensity = Math.max(...Object.values(dataDensity))

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      onYearChange([Math.min(currentYear[0] + 1, yearRange[1])])

      if (currentYear[0] >= yearRange[1]) {
        setIsPlaying(false)
      }
    }, playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, currentYear, yearRange, onYearChange, playbackSpeed])

  const jumpToPeriod = (period: HistoricalPeriod) => {
    onYearChange([period.endYear])
    setIsPlaying(false)
  }

  const jumpToDecade = (decade: number) => {
    onYearChange([Math.min(decade + 9, yearRange[1])])
    setIsPlaying(false)
  }

  const getCurrentPeriod = () => {
    return HISTORICAL_PERIODS.find((period) => currentYear[0] >= period.startYear && currentYear[0] <= period.endYear)
  }

  const currentPeriod = getCurrentPeriod()

  return (
    <Card className="bg-card/95 backdrop-blur-sm border shadow-lg">
      <div className="p-4 space-y-4">
        {/* Header with current period */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-medium text-foreground">Año: {currentYear[0]}</div>
              {currentPeriod && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${currentPeriod.color}`} />
                  {currentPeriod.name} • {currentPeriod.description}
                </div>
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onYearChange([yearRange[0]])}
              disabled={currentYear[0] <= yearRange[0]}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentYear[0] >= yearRange[1]}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onYearChange([yearRange[1]])}
              disabled={currentYear[0] >= yearRange[1]}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main timeline slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{yearRange[0]}</span>
            <span>{yearRange[1]}</span>
          </div>

          {/* Data density visualization */}
          <div className="relative h-6 bg-muted rounded-sm overflow-hidden">
            {Object.entries(dataDensity).map(([decade, count]) => {
              const decadeStart = Number.parseInt(decade)
              const position = ((decadeStart - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100
              const width = (10 / (yearRange[1] - yearRange[0])) * 100
              const intensity = count / maxDensity

              return (
                <div
                  key={decade}
                  className="absolute top-0 bottom-0 bg-accent/30 hover:bg-accent/50 cursor-pointer transition-colors"
                  style={{
                    left: `${position}%`,
                    width: `${width}%`,
                    opacity: 0.3 + intensity * 0.7,
                  }}
                  onClick={() => jumpToDecade(decadeStart)}
                  title={`${decadeStart}s: ${count} historias`}
                />
              )
            })}

            {/* Current year indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg"
              style={{
                left: `${((currentYear[0] - yearRange[0]) / (yearRange[1] - yearRange[0])) * 100}%`,
              }}
            />
          </div>

          <Slider
            value={currentYear}
            onValueChange={onYearChange}
            max={yearRange[1]}
            min={yearRange[0]}
            step={1}
            className="w-full"
          />
        </div>

        {/* Historical periods quick access */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Períodos Históricos</div>
          <div className="flex flex-wrap gap-2">
            {HISTORICAL_PERIODS.map((period) => (
              <Button
                key={period.name}
                variant={currentPeriod?.name === period.name ? "default" : "outline"}
                size="sm"
                onClick={() => jumpToPeriod(period)}
                className="text-xs h-7"
              >
                <div className={`w-2 h-2 rounded-full ${period.color} mr-2`} />
                {period.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Controls and stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="unknown-years" checked={includeUnknownYears} onCheckedChange={onIncludeUnknownChange} />
              <label htmlFor="unknown-years" className="text-muted-foreground">
                Incluir años desconocidos
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number.parseInt(e.target.value))}
                className="text-xs bg-transparent border rounded px-2 py-1"
              >
                <option value={2000}>Lento</option>
                <option value={1000}>Normal</option>
                <option value={500}>Rápido</option>
              </select>
            </div>
          </div>

          <div className="text-muted-foreground">
            Mostrando <Badge variant="outline">{filteredCount}</Badge> de <Badge variant="outline">{totalCount}</Badge>{" "}
            historias
          </div>
        </div>
      </div>
    </Card>
  )
}
