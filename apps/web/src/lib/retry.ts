/**
 * Retry utility for Inkloom AI API calls.
 * Retries a failing async function with exponential backoff.
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 300,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const doRetry = shouldRetry ? shouldRetry(err) : true;
      if (!doRetry || attempt === maxAttempts) break;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Wraps a fetch-based API call with retry logic.
 * Retries on network errors and 5xx / 400 "tool not found" errors.
 */
export function isRetryableApiResponse(res: any): boolean {
  if (!res || typeof res !== 'object') return false;
  if (!res.success && typeof res.error === 'string') {
    const err = res.error.toLowerCase();
    // Retry on 400 tool-not-found, 500, and transient network errors
    if (
      err.includes('tool not found') ||
      err.includes('network error') ||
      err.includes('internal server') ||
      err.includes('econnrefused') ||
      err.includes('fetch failed') ||
      err.includes('timeout')
    ) {
      return true;
    }
  }
  return false;
}
