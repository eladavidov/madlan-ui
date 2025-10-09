/**
 * Progress Reporter
 * Real-time progress reporting for crawler
 */

import { logger } from "./logger.js";

export interface ProgressStats {
  propertiesFound: number;
  propertiesNew: number;
  propertiesUpdated: number;
  propertiesFailed: number;
  imagesDownloaded?: number;
  imagesFailed?: number;
  startTime: number;
  lastUpdate: number;
}

export class ProgressReporter {
  private stats: ProgressStats;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.stats = {
      propertiesFound: 0,
      propertiesNew: 0,
      propertiesUpdated: 0,
      propertiesFailed: 0,
      imagesDownloaded: 0,
      imagesFailed: 0,
      startTime: Date.now(),
      lastUpdate: Date.now(),
    };
  }

  /**
   * Start periodic progress updates
   */
  start(intervalMs: number = 10000): void {
    this.stats.startTime = Date.now();
    this.stats.lastUpdate = Date.now();

    this.updateInterval = setInterval(() => {
      this.logProgress();
    }, intervalMs);

    logger.info("📊 Progress reporting started");
  }

  /**
   * Stop progress updates
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.logProgress(true); // Final update
    logger.info("📊 Progress reporting stopped");
  }

  /**
   * Update stats
   */
  updateStats(updates: Partial<ProgressStats>): void {
    Object.assign(this.stats, updates);
    this.stats.lastUpdate = Date.now();
  }

  /**
   * Increment counter
   */
  increment(field: keyof ProgressStats, amount: number = 1): void {
    if (typeof this.stats[field] === "number") {
      (this.stats[field] as number) += amount;
      this.stats.lastUpdate = Date.now();
    }
  }

  /**
   * Log current progress
   */
  logProgress(isFinal: boolean = false): void {
    const now = Date.now();
    const elapsed = now - this.stats.startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Calculate rates
    const propertiesPerMinute = this.stats.propertiesFound > 0
      ? (this.stats.propertiesFound / (elapsed / 60000)).toFixed(1)
      : "0.0";

    const imagesPerMinute = (this.stats.imagesDownloaded || 0) > 0
      ? ((this.stats.imagesDownloaded || 0) / (elapsed / 60000)).toFixed(1)
      : "0.0";

    const message = isFinal ? "🎯 Final Statistics:" : "📊 Progress Update:";

    logger.info("=".repeat(60));
    logger.info(message);
    logger.info(`⏱️  Elapsed: ${elapsedMinutes}m ${elapsedSeconds % 60}s`);
    logger.info(`🏠 Properties: ${this.stats.propertiesFound} found | ${this.stats.propertiesNew} new | ${this.stats.propertiesUpdated} updated | ${this.stats.propertiesFailed} failed`);

    if (this.stats.imagesDownloaded !== undefined) {
      logger.info(`📸 Images: ${this.stats.imagesDownloaded} downloaded | ${this.stats.imagesFailed} failed`);
    }

    logger.info(`📈 Rate: ${propertiesPerMinute} properties/min | ${imagesPerMinute} images/min`);
    logger.info("=".repeat(60));
  }

  /**
   * Get current stats
   */
  getStats(): ProgressStats {
    return { ...this.stats };
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.stats.startTime;
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(totalProperties: number): number {
    if (this.stats.propertiesFound === 0) return 0;

    const elapsed = this.getElapsedTime();
    const avgTimePerProperty = elapsed / this.stats.propertiesFound;
    const remaining = totalProperties - this.stats.propertiesFound;

    return Math.max(0, avgTimePerProperty * remaining);
  }

  /**
   * Format time in human-readable format
   */
  static formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
