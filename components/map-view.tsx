"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface StoryPoint {
  id: string
  titulo: string
  descripcion: string
  autor: string
  año: string
  lugar: string
  coordenadas: string
  fuente: string
  archivo: string
  archivoDigital: string
  categoria: string
  observaciones?: string
}

interface MapViewProps {
  points: StoryPoint[]
  selectedPoint: StoryPoint | null
  onPointSelect: (point: StoryPoint) => void
}

const createCustomIcon = (categoria: string, isSelected: boolean) => {
  const getColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "fotografía de estacion":
      case "fotografía":
        return isSelected ? "#d97706" : "#374151"
      case "testimonio":
        return isSelected ? "#d97706" : "#84cc16"
      case "literatura":
        return isSelected ? "#d97706" : "#eab308"
      default:
        return isSelected ? "#d97706" : "#6b7280"
    }
  }

  const color = getColor(categoria)

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${isSelected ? "16px" : "12px"};
        height: ${isSelected ? "16px" : "12px"};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      "></div>
    `,
    className: "custom-marker",
    iconSize: [isSelected ? 20 : 16, isSelected ? 20 : 16],
    iconAnchor: [isSelected ? 10 : 8, isSelected ? 10 : 8],
  })
}

function MapController({ selectedPoint }: { selectedPoint: StoryPoint | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedPoint && selectedPoint.coordenadas) {
      const [lat, lng] = selectedPoint.coordenadas.split(",").map((coord) => Number.parseFloat(coord.trim()))
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 15, { animate: true })
      }
    }
  }, [selectedPoint, map])

  return null
}

export default function MapView({ points, selectedPoint, onPointSelect }: MapViewProps) {
  const mapRef = useRef<L.Map>(null)

  const defaultCenter: [number, number] = [-34.5, -58.48]
  const defaultZoom = 13

  return (
    <div className="w-full h-full">
      <MapContainer center={defaultCenter} zoom={defaultZoom} className="w-full h-full" ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController selectedPoint={selectedPoint} />

        {points.map((point) => {
          if (!point.coordenadas) return null

          const [lat, lng] = point.coordenadas.split(",").map((coord) => Number.parseFloat(coord.trim()))
          if (isNaN(lat) || isNaN(lng)) return null

          const isSelected = selectedPoint?.id === point.id

          return (
            <Marker
              key={point.id}
              position={[lat, lng]}
              icon={createCustomIcon(point.categoria, isSelected)}
              eventHandlers={{
                click: () => onPointSelect(point),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-1 font-heading">{point.titulo}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {point.lugar} • {point.año}
                  </p>
                  <p className="text-xs leading-relaxed text-card-foreground">
                    {point.descripcion.substring(0, 100)}...
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
