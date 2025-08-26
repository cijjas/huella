import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Drive sharing URL to a direct image URL
 * @param url - Google Drive sharing URL
 * @returns Direct image URL or original URL if not a Google Drive URL
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url
  
  // Pattern to match Google Drive file URLs
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//
  const match = url.match(driveRegex)
  
  if (match && match[1]) {
    const fileId = match[1]
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  }
  
  return url
}

/**
 * Extracts the file ID from a Google Drive URL
 * @param url - Google Drive URL
 * @returns File ID or null if not found
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null
  
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//
  const match = url.match(driveRegex)
  
  return match ? match[1] : null
}
