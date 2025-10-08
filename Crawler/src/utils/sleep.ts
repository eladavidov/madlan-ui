/**
 * Sleep/Delay Utilities
 * Random delays for anti-blocking
 */

/**
 * Sleep for a fixed duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleep for a random duration between min and max
 */
export function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return sleep(delay);
}

/**
 * Sleep for a random duration based on config
 */
export function randomDelay(config?: {
  min?: number;
  max?: number;
}): Promise<void> {
  const min = config?.min ?? 2000; // Default 2 seconds
  const max = config?.max ?? 5000; // Default 5 seconds
  return randomSleep(min, max);
}
