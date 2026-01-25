/**
 * Formatting utilities for benchmark display.
 */

/**
 * Format a number to 1 decimal place.
 */
export function formatNumber(value: number): string {
  if (Number.isNaN(value)) return '-'
  return value.toFixed(1)
}

/**
 * Format bytes to megabytes with 1 decimal place.
 */
export function formatBytesToMB(value: number): string {
  if (!Number.isFinite(value)) return '-'
  return (value / (1024 * 1024)).toFixed(1)
}

/**
 * Format seconds to milliseconds with 1 decimal place.
 */
export function formatSecondsToMs(value: number): string {
  if (!Number.isFinite(value)) return '-'
  return (value * 1000).toFixed(1)
}

/**
 * Format a duration value with confidence interval.
 */
export function formatDurationWithCI(mean: number, ci: number): string {
  return `${formatNumber(mean)} +/- ${formatNumber(ci)}`
}

/**
 * Format a score for display (with ms suffix).
 */
export function formatScore(score: number): string {
  if (!Number.isFinite(score)) return '-'
  return `${formatNumber(score)} ms`
}
