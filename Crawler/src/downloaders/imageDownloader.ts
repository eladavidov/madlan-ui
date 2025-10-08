/**
 * Image Downloader
 * Downloads images with retry logic and metadata extraction
 */

import { createWriteStream, existsSync, mkdirSync, unlinkSync, statSync } from "fs";
import { dirname } from "path";
import { pipeline } from "stream/promises";
import { sleep } from "../utils/sleep.js";
import { logger } from "../utils/logger.js";

export interface ImageDownloadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  fileSize?: number;
  error?: string;
  contentType?: string;
}

/**
 * Download an image from URL and save to local filesystem
 */
export async function downloadImage(
  imageUrl: string,
  localPath: string,
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
      logger.debug(`Downloading image (attempt ${attempt}/${maxRetries}): ${imageUrl}`);

      // Ensure directory exists
      const dir = dirname(localPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

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

      // Download to file
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const fileStream = createWriteStream(localPath);
      await pipeline(response.body as any, fileStream);

      // Get file size
      const stats = statSync(localPath);
      const fileSize = stats.size;

      // Validate file size
      if (fileSize === 0) {
        unlinkSync(localPath);
        throw new Error("Downloaded file is empty");
      }

      logger.debug(`Image downloaded successfully: ${localPath} (${fileSize} bytes)`);

      return {
        success: true,
        localPath,
        fileSize,
        contentType,
      };
    } catch (error: any) {
      lastError = error;
      logger.warn(`Image download attempt ${attempt} failed: ${error.message}`);

      // Clean up partial download
      if (existsSync(localPath)) {
        try {
          unlinkSync(localPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

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
  getLocalPath: (url: string, index: number) => string,
  options: ImageDownloadOptions & { concurrency?: number } = {}
): Promise<ImageDownloadResult[]> {
  const { concurrency = 3, ...downloadOptions } = options;
  const results: ImageDownloadResult[] = [];

  // Process in batches
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchPromises = batch.map((url, batchIndex) => {
      const globalIndex = i + batchIndex;
      const localPath = getLocalPath(url, globalIndex);
      return downloadImage(url, localPath, downloadOptions);
    });

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

/**
 * Build local path for image
 */
export function buildImagePath(
  baseDir: string,
  propertyId: string,
  index: number,
  url: string,
  contentType?: string
): string {
  const ext = getImageExtension(url, contentType);
  return `${baseDir}/${propertyId}/${index}.${ext}`;
}
