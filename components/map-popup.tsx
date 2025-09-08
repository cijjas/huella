"use client"

import { type StoryPoint } from "@/lib/csv-parser"
import L from 'leaflet'
import { Camera, MessageSquare, FileText, Play } from "lucide-react"

interface MapPoint {
  id: string
  stories: StoryPoint[]
  coordinates: string
  latitude: number
  longitude: number
  primaryStory: StoryPoint
}

interface MapPopupProps {
  mapPoint: MapPoint
}

export function MapPopup({ mapPoint }: MapPopupProps) {
  // Count different types of content
  const fotografias = mapPoint.stories.filter(story => 
    (story.metadata.toLowerCase().includes('fotografía') || 
    story.drivePhotoUrl) &&
    !story.metadata.toLowerCase().includes('artículo') &&
    !story.metadata.toLowerCase().includes('articulo') &&
    !story.title.toLowerCase().includes('artículo') &&
    !story.title.toLowerCase().includes('articulo')
  )

  const testimonios = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('testimonio') || 
    story.description.toLowerCase().includes('testimonio') ||
    story.testimonial
  )

  const articulos = mapPoint.stories.filter(story => 
    story.metadata.toLowerCase().includes('artículo') || 
    story.metadata.toLowerCase().includes('articulo') ||
    story.title.toLowerCase().includes('artículo') ||
    story.title.toLowerCase().includes('articulo') ||
    story.driveArticlePhotoUrl
  )

  const videos = mapPoint.stories.filter(story => story.videoUrl)

  return (
    <div className='min-w-[200px]'>
      <h3 className='font-semibold text-sm mb-2 font-heading '>
        {mapPoint.primaryStory.location}
      </h3>
      
      <div className='space-y-1'>
        {fotografias.length > 0 && (
          <p className='text-xs text-muted-foreground flex items-center gap-1'>
            <Camera className='h-3 w-3' />
            {fotografias.length} fotografía{fotografias.length !== 1 ? 's' : ''}
          </p>
        )}
        {testimonios.length > 0 && (
          <p className='text-xs text-muted-foreground flex items-center gap-1'>
            <MessageSquare className='h-3 w-3' />
            {testimonios.length} testimonio{testimonios.length !== 1 ? 's' : ''}
          </p>
        )}
        {articulos.length > 0 && (
          <p className='text-xs text-muted-foreground flex items-center gap-1'>
            <FileText className='h-3 w-3' />
            {articulos.length} artículo{articulos.length !== 1 ? 's' : ''}
          </p>
        )}
        {videos.length > 0 && (
          <p className='text-xs text-muted-foreground flex items-center gap-1'>
            <Play className='h-3 w-3' />
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export const createCustomIcon = (metadata: string, isSelected: boolean) => {
  const getColor = (meta: string) => {
    return isSelected ? '#10b981' : '#6b7280'; // Green for selected, grey for unselected
  };

  const color = getColor(metadata);
  const size = isSelected ? 40 : 32;
  const innerSize = isSelected ? 28 : 24;

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
          box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px rgba(16, 185, 129, 0.2);
          transition: all 0.3s ease;
          ${
            isSelected
              ? `
            animation: pulse 2s infinite;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(16, 185, 129, 0.3);
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
            border: 2px solid rgba(16, 185, 129, 0.4);
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
