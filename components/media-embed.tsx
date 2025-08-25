"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, ImageIcon, Video, FileText, Globe, AlertCircle, Maximize2 } from "lucide-react"

interface MediaEmbedProps {
  url: string
  title?: string
  className?: string
}

interface MediaInfo {
  type: "image" | "video" | "youtube" | "pdf" | "blog" | "document" | "unknown"
  embedUrl?: string
  thumbnailUrl?: string
  isEmbeddable: boolean
}

const getMediaInfo = (url: string): MediaInfo => {
  if (!url || url === "-") {
    return { type: "unknown", isEmbeddable: false }
  }

  const cleanUrl = url.toLowerCase().trim()

  // Image formats
  if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/)) {
    return {
      type: "image",
      embedUrl: url,
      isEmbeddable: true,
    }
  }

  // YouTube videos
  const youtubeMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      isEmbeddable: true,
    }
  }

  // Video formats
  if (cleanUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/)) {
    return {
      type: "video",
      embedUrl: url,
      isEmbeddable: true,
    }
  }

  // PDF documents
  if (cleanUrl.includes(".pdf")) {
    return {
      type: "pdf",
      embedUrl: url,
      isEmbeddable: true,
    }
  }

  // Blog posts and articles
  if (cleanUrl.includes("blogspot.com") || cleanUrl.includes("blog") || cleanUrl.includes("article")) {
    return {
      type: "blog",
      embedUrl: url,
      isEmbeddable: false, // Most blogs don't allow embedding
    }
  }

  // Generic documents
  if (cleanUrl.match(/\.(doc|docx|txt|rtf)(\?.*)?$/)) {
    return {
      type: "document",
      embedUrl: url,
      isEmbeddable: false,
    }
  }

  return {
    type: "unknown",
    embedUrl: url,
    isEmbeddable: false,
  }
}

const MediaTypeIcon = ({ type }: { type: MediaInfo["type"] }) => {
  switch (type) {
    case "image":
      return <ImageIcon className="w-4 h-4" />
    case "video":
    case "youtube":
      return <Video className="w-4 h-4" />
    case "pdf":
    case "document":
      return <FileText className="w-4 h-4" />
    case "blog":
      return <Globe className="w-4 h-4" />
    default:
      return <ExternalLink className="w-4 h-4" />
  }
}

const MediaTypeLabel = ({ type }: { type: MediaInfo["type"] }) => {
  switch (type) {
    case "image":
      return "Imagen"
    case "video":
      return "Video"
    case "youtube":
      return "Video de YouTube"
    case "pdf":
      return "Documento PDF"
    case "document":
      return "Documento"
    case "blog":
      return "Artículo de Blog"
    default:
      return "Enlace Externo"
  }
}

const MediaEmbed = ({ url, title, className = "" }: MediaEmbedProps) => {
  const [mediaInfo, setMediaInfo] = useState<MediaInfo>({ type: "unknown", isEmbeddable: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const info = getMediaInfo(url)
    setMediaInfo(info)
    setLoading(false)
  }, [url])

  const handleImageError = () => {
    setError("No se pudo cargar la imagen")
  }

  const handleVideoError = () => {
    setError("No se pudo cargar el video")
  }

  const openInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="w-full h-48 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!mediaInfo.isEmbeddable || error) {
    return (
      <Card className={`${className} cursor-pointer hover:bg-accent/5 transition-colors`} onClick={openInNewTab}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {error ? (
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              ) : (
                <MediaTypeIcon type={mediaInfo.type} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  <MediaTypeIcon type={mediaInfo.type} />
                  <span className="ml-1">
                    <MediaTypeLabel type={mediaInfo.type} />
                  </span>
                </Badge>
              </div>
              <h4 className="font-medium text-sm mb-1 truncate">{title || "Ver contenido"}</h4>
              <p className="text-xs text-muted-foreground truncate">{url}</p>
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Media content */}
          {mediaInfo.type === "image" && (
            <div className="relative">
              <img
                src={mediaInfo.embedUrl || "/placeholder.svg"}
                alt={title || "Imagen histórica"}
                className="w-full h-auto max-h-96 object-cover rounded-t-lg"
                onError={handleImageError}
                loading="lazy"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {mediaInfo.type === "youtube" && (
            <div className="relative aspect-video">
              <iframe
                src={mediaInfo.embedUrl}
                title={title || "Video de YouTube"}
                className="w-full h-full rounded-t-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}

          {mediaInfo.type === "video" && (
            <div className="relative">
              <video
                src={mediaInfo.embedUrl}
                controls
                className="w-full h-auto max-h-96 rounded-t-lg"
                onError={handleVideoError}
                preload="metadata"
              >
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          )}

          {mediaInfo.type === "pdf" && (
            <div className="relative aspect-[4/3] bg-muted rounded-t-lg">
              <iframe
                src={`${mediaInfo.embedUrl}#view=FitH`}
                title={title || "Documento PDF"}
                className="w-full h-full rounded-t-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Documento PDF</p>
                </div>
              </div>
            </div>
          )}

          {/* Media info footer */}
          <div className="p-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <MediaTypeIcon type={mediaInfo.type} />
                  <span className="ml-1">
                    <MediaTypeLabel type={mediaInfo.type} />
                  </span>
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={openInNewTab} className="text-xs">
                Abrir original
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            {title && <p className="text-sm font-medium mt-2 text-foreground">{title}</p>}
          </div>
        </div>
      </CardContent>

      {/* Expanded image modal */}
      {isExpanded && mediaInfo.type === "image" && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={mediaInfo.embedUrl || "/placeholder.svg"}
              alt={title || "Imagen histórica"}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default MediaEmbed
