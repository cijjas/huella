'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type StoryPoint } from '@/lib/csv-parser';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPoint {
  id: string;
  stories: StoryPoint[];
  coordinates: string;
  latitude: number;
  longitude: number;
  primaryStory: StoryPoint;
}

interface MapViewProps {
  points: MapPoint[];
  selectedPoint: MapPoint | null;
  onPointSelect: (point: MapPoint) => void;
}

const createCustomIcon = (metadata: string, isSelected: boolean) => {
  const getColor = (meta: string) => {
    switch (meta.toLowerCase()) {
      case 'fotografía de estacion':
      case 'fotografía':
        return isSelected ? '#d97706' : '#374151';
      case 'testimonio':
        return isSelected ? '#d97706' : '#84cc16';
      case 'literatura':
        return isSelected ? '#d97706' : '#eab308';
      default:
        return isSelected ? '#d97706' : '#6b7280';
    }
  };

  const color = getColor(metadata);
  const size = isSelected ? 32 : 24;
  const innerSize = isSelected ? 22 : 18;

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: ${color};
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px rgba(217, 119, 6, 0.2);
          transition: all 0.3s ease;
          ${
            isSelected
              ? `
            animation: pulse 2s infinite;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(217, 119, 6, 0.3);
          `
              : ''
          }
        "></div>
        ${
          isSelected
            ? `
          <div style="
            position: absolute;
            width: ${size + 8}px;
            height: ${size + 8}px;
            border: 2px solid rgba(217, 119, 6, 0.4);
            border-radius: 50%;
            animation: ripple 2s infinite;
          "></div>
        `
            : ''
        }
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes ripple {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

function MapController({ selectedPoint }: { selectedPoint: MapPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPoint) {
      map.setView([selectedPoint.latitude, selectedPoint.longitude], 15, {
        animate: true,
      });
    }
  }, [selectedPoint, map]);

  return null;
}

export default function MapView({
  points,
  selectedPoint,
  onPointSelect,
}: MapViewProps) {
  const mapRef = useRef<L.Map>(null);

  const defaultCenter: [number, number] = [-34.481406534405565, -58.45756925758625];
  const defaultZoom = 17;
  
  // Define bounds to restrict map movement (Buenos Aires area)
  const mapBounds: L.LatLngBoundsLiteral = [
    [-34.8, -58.8], // Southwest corner
    [-34.2, -58.2]  // Northeast corner
  ];

  return (
    <div className='w-full h-full'>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={12}
        maxZoom={18}
        className='w-full h-full dark-map'
        ref={mapRef}
        crs={L.CRS.EPSG3857}
        maxBounds={mapBounds}
        maxBoundsViscosity={1.0}
      >
        {/* Dark base map layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`}
          minZoom={0}
          maxZoom={22}
          className="map-dark-layer"
        />

        {/* OpenRailwayMap overlay for railway lines */}
        <TileLayer
          attribution='&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a> contributors'
          url='https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png'
          maxZoom={19}
          subdomains='abc'
        />

        <MapController selectedPoint={selectedPoint} />

        {/* Visual bounds rectangle (optional - for debugging) */}
        {/* <Rectangle
          bounds={mapBounds}
          pathOptions={{
            color: 'red',
            weight: 2,
            fillOpacity: 0.1,
            fillColor: 'red'
          }}
        /> */}

        {points.map((mapPoint, index) => {
          const isSelected = selectedPoint?.id === mapPoint.id;

          return (
            <Marker
              key={`${mapPoint.id}-${index}`}
              position={[mapPoint.latitude, mapPoint.longitude]}
              icon={createCustomIcon(
                mapPoint.primaryStory.metadata,
                isSelected,
              )}
              eventHandlers={{
                click: () => onPointSelect(mapPoint),
              }}
            >
              <Popup>
                <div className='min-w-[200px]'>
                  <h3 className='font-semibold text-sm mb-1 font-heading'>
                    {mapPoint.primaryStory.title}
                  </h3>
                  <p className='text-xs text-muted-foreground mb-2'>
                    {mapPoint.primaryStory.location} • {mapPoint.primaryStory.year}
                  </p>
                  <p className='text-xs leading-relaxed text-card-foreground'>
                    {mapPoint.primaryStory.description.substring(0, 100)}...
                  </p>
                  {mapPoint.stories.length > 1 && (
                    <p className='text-xs text-amber-600 mt-1 font-medium'>
                      +{mapPoint.stories.length - 1} más en esta ubicación
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
