/**
 * Image Downloader
 * Downloads images to memory (Buffer) with retry logic and metadata extraction
 * Updated to support BLOB storage in database
 */

import { sleep } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";

export interface ImageDownloadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface ImageDownloadResult {
  success: boolean;
  imageData?: Buffer;
  fileSize?: number;
  error?: string;
  contentType?: string;
  width?: number;
  height?: number;
}

/**
 * Download an image from URL and return as Buffer
 */
export async function downloadImage(
  imageUrl: string,
  options: ImageDownloadOptions = {}
): Promise<ImageDownloadResult> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Downloading image to memory (attempt ${attempt}/${maxRetries}): ${imageUrl}`);

      // Fetch image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Download to memory
      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Read response as array buffer
      const arrayBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(arrayBuffer);
      const fileSize = imageData.length;

      // Validate file size
      if (fileSize === 0) {
        throw new Error("Downloaded image is empty");
      }

      logger.debug(`Image downloaded successfully: ${fileSize} bytes`);

      return {
        success: true,
        imageData,
        fileSize,
        contentType,
      };
    } catch (error: any) {
      lastError = error;
      logger.warn(`Image download attempt ${attempt} failed: ${error.message}`);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.debug(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || "Unknown error";
  logger.error(`Image download failed after ${maxRetries} attempts: ${imageUrl} - ${errorMessage}`);

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Download multiple images concurrently with limit
 */
export async function downloadImages(
  imageUrls: string[],
  options: ImageDownloadOptions & { concurrency?: number } = {}
): Promise<ImageDownloadResult[]> {
  const { concurrency = 3, ...downloadOptions } = options;
  const results: ImageDownloadResult[] = [];

  // Process in batches
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchPromises = batch.map((url) => downloadImage(url, downloadOptions));

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get file extension from URL or content type
 */
export function getImageExtension(url: string, contentType?: string): string {
  // Try to get from content type first
  if (contentType) {
    const match = contentType.match(/image\/(\w+)/);
    if (match) {
      const type = match[1].toLowerCase();
      if (type === "jpeg") return "jpg";
      return type;
    }
  }

  // Try to get from URL
  const urlMatch = url.match(/\.(\w+)(?:\?|$)/);
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }

  // Default
  return "jpg";
}
