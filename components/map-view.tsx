'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type StoryPoint } from '@/lib/csv-parser';
import { MapPopup, createCustomIcon } from './map-popup';

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
                <MapPopup mapPoint={mapPoint} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
