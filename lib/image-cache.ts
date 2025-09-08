/**
 * Image cache utility to preload and store images in memory
 * This prevents rate limiting issues when fetching Google Drive thumbnails
 */

interface ImageCacheEntry {
  url: string
  blob: Blob
  objectUrl: string
  loaded: boolean
  error?: string
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>()
  private loadingPromises = new Map<string, Promise<void>>()

  /**
   * Preload an image and store it in cache
   */
  async preloadImage(url: string): Promise<void> {
    if (!url || url.trim() === '' || url === '-') {
      return
    }

    // If already cached, return
    if (this.cache.has(url)) {
      return
    }

    // If already loading, wait for that promise
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)
    }

    // Start loading
    const loadingPromise = this.loadImage(url)
    this.loadingPromises.set(url, loadingPromise)

    try {
      await loadingPromise
    } finally {
      this.loadingPromises.delete(url)
    }
  }

  /**
   * Load a single image and store it in cache
   */
  private async loadImage(url: string): Promise<void> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      this.cache.set(url, {
        url,
        blob,
        objectUrl,
        loaded: true
      })
    } catch (error) {
      console.warn(`Failed to preload image: ${url}`, error)
      this.cache.set(url, {
        url,
        blob: new Blob(),
        objectUrl: '',
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Get cached image URL or fallback to original URL
   */
  getCachedImageUrl(originalUrl: string): string {
    if (!originalUrl || originalUrl.trim() === '' || originalUrl === '-') {
      return ''
    }

    const cached = this.cache.get(originalUrl)
    if (cached && cached.loaded && cached.objectUrl) {
      return cached.objectUrl
    }

    // Fallback to original URL if not cached or failed to load
    return originalUrl
  }

  /**
   * Check if an image is cached and loaded
   */
  isImageCached(url: string): boolean {
    const cached = this.cache.get(url)
    return cached ? cached.loaded : false
  }

  /**
   * Preload multiple images with controlled concurrency
   */
  async preloadImages(urls: string[], concurrency: number = 5): Promise<void> {
    const validUrls = urls.filter(url => url && url.trim() !== '' && url !== '-')
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < validUrls.length; i += concurrency) {
      const batch = validUrls.slice(i, i + concurrency)
      await Promise.allSettled(batch.map(url => this.preloadImage(url)))
      
      // Small delay between batches to be respectful to the server
      if (i + concurrency < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * Lazy load an image - loads it if not already cached
   */
  async lazyLoadImage(url: string): Promise<string> {
    if (!url || url.trim() === '' || url === '-') {
      return ''
    }

    // If already cached, return cached URL
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)!
      return cached.loaded ? cached.objectUrl : url
    }

    // If already loading, wait for it
    if (this.loadingPromises.has(url)) {
      await this.loadingPromises.get(url)
      const cached = this.cache.get(url)!
      return cached.loaded ? cached.objectUrl : url
    }

    // Start loading
    await this.preloadImage(url)
    const cached = this.cache.get(url)!
    return cached.loaded ? cached.objectUrl : url
  }

  /**
   * Lazy load multiple images for a gallery
   */
  async lazyLoadGalleryImages(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && url.trim() !== '' && url !== '-')
    
    // Load images in small batches to avoid overwhelming the server
    const batchSize = 3
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize)
      await Promise.allSettled(batch.map(url => this.lazyLoadImage(url)))
      
      // Small delay between batches
      if (i + batchSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }

  /**
   * Clear the cache and revoke object URLs
   */
  clearCache(): void {
    for (const entry of this.cache.values()) {
      if (entry.objectUrl) {
        URL.revokeObjectURL(entry.objectUrl)
      }
    }
    this.cache.clear()
    this.loadingPromises.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; loaded: number; failed: number } {
    let loaded = 0
    let failed = 0

    for (const entry of this.cache.values()) {
      if (entry.loaded) {
        loaded++
      } else {
        failed++
      }
    }

    return {
      total: this.cache.size,
      loaded,
      failed
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache()

/**
 * Extract all unique image URLs from story points
 */
export function extractImageUrls(storyPoints: Array<{
  drivePhotoUrl?: string
  driveArticlePhotoUrl?: string
}>): string[] {
  const urls = new Set<string>()

  for (const story of storyPoints) {
    if (story.drivePhotoUrl && story.drivePhotoUrl.trim() !== '' && story.drivePhotoUrl !== '-') {
      urls.add(story.drivePhotoUrl)
    }
    if (story.driveArticlePhotoUrl && story.driveArticlePhotoUrl.trim() !== '' && story.driveArticlePhotoUrl !== '-') {
      urls.add(story.driveArticlePhotoUrl)
    }
  }

  return Array.from(urls)
}
