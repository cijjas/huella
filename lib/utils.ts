import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { imageCache } from "./image-cache"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Drive file URL to a thumbnail URL that can be used for displaying images
 * @param driveUrl - The Google Drive file URL (e.g., https://drive.google.com/file/d/FILE_ID/view?usp=drive_link)
 * @param size - The size parameter for the thumbnail (default: 'w1000')
 * @returns The thumbnail URL or the original URL if it's not a Google Drive URL
 */
export function convertDriveUrlToThumbnail(driveUrl: string, size: string = 'w1000'): string {
  if (!driveUrl) return ''
  
  // Extract file ID from various Google Drive URL formats
  let fileId: string | null = null
  
  // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
  const fileIdMatch1 = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (fileIdMatch1) {
    fileId = fileIdMatch1[1]
  }
  
  // Format 2: https://drive.usercontent.google.com/download?id=FILE_ID&authuser=0
  const fileIdMatch2 = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)
  if (fileIdMatch2) {
    fileId = fileIdMatch2[1]
  }
  
  // Format 3: Direct file ID in URL
  const fileIdMatch3 = driveUrl.match(/([a-zA-Z0-9-_]{25,})/)
  if (fileIdMatch3 && !fileId) {
    fileId = fileIdMatch3[1]
  }
  
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
  }
  
  // If it's already a thumbnail URL, return as is
  if (driveUrl.includes('drive.google.com/thumbnail')) {
    return driveUrl
  }
  
  // If it's not a Google Drive URL, return the original URL
  return driveUrl
}

/**
 * Gets the best available image URL from a story point
 * @param story - The story point object
 * @returns The best available image URL (cached if available, otherwise original URL)
 */
export function getImageUrl(story?: { 
  drivePhotoUrl?: string; 
  driveArticlePhotoUrl?: string; 
}): string {
  // Check if story exists
  if (!story) {
    return ''
  }
  
  // Priority 1: drivePhotoUrl (primary image field)
  if (story.drivePhotoUrl && story.drivePhotoUrl !== '-' && story.drivePhotoUrl.trim()) {
    const thumbnailUrl = convertDriveUrlToThumbnail(story.drivePhotoUrl)
    return imageCache.getCachedImageUrl(thumbnailUrl)
  }
  
  // Priority 2: driveArticlePhotoUrl (secondary image field)
  if (story.driveArticlePhotoUrl && story.driveArticlePhotoUrl !== '-' && story.driveArticlePhotoUrl.trim()) {
    const thumbnailUrl = convertDriveUrlToThumbnail(story.driveArticlePhotoUrl)
    return imageCache.getCachedImageUrl(thumbnailUrl)
  }
  
  return ''
}

/**
 * Lazy loads an image URL and returns the cached version when ready
 * @param story - The story point object
 * @returns Promise that resolves to the cached image URL
 */
export async function getLazyImageUrl(story?: { 
  drivePhotoUrl?: string; 
  driveArticlePhotoUrl?: string; 
}): Promise<string> {
  // Check if story exists
  if (!story) {
    return ''
  }
  
  // Priority 1: drivePhotoUrl (primary image field)
  if (story.drivePhotoUrl && story.drivePhotoUrl !== '-' && story.drivePhotoUrl.trim()) {
    const thumbnailUrl = convertDriveUrlToThumbnail(story.drivePhotoUrl)
    return await imageCache.lazyLoadImage(thumbnailUrl)
  }
  
  // Priority 2: driveArticlePhotoUrl (secondary image field)
  if (story.driveArticlePhotoUrl && story.driveArticlePhotoUrl !== '-' && story.driveArticlePhotoUrl.trim()) {
    const thumbnailUrl = convertDriveUrlToThumbnail(story.driveArticlePhotoUrl)
    return await imageCache.lazyLoadImage(thumbnailUrl)
  }
  
  return ''
}

