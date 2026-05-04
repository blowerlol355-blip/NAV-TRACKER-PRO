/**
 * Global API client with retry logic and server availability checking.
 * Designed to handle unstable dev server environments gracefully.
 */

/**
 * Fetch with automatic retry and exponential backoff.
 * Returns null on final failure instead of throwing.
 */
export async function fetchWithRetry<T = unknown>(
  url: string,
  options?: RequestInit,
  retries: number = 2,
  delay: number = 1500
): Promise<T | null> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry on abort (user cancelled)
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null
      }

      // If we have more retries, wait with exponential backoff
      if (attempt < retries) {
        const backoffDelay = delay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      }
    }
  }

  console.warn(`fetchWithRetry: All ${retries + 1} attempts failed for ${url}`, lastError?.message)
  return null
}

// Track last known server state to avoid excessive pinging
let _lastServerCheck = 0
let _serverAvailable = true

/**
 * Check if the server is available.
 * Uses caching to avoid excessive pinging (checks at most once every 10 seconds).
 */
export async function isServerAvailable(): Promise<boolean> {
  const now = Date.now()
  // Cache result for 10 seconds
  if (now - _lastServerCheck < 10000) {
    return _serverAvailable
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

    const response = await fetch('/api/dashboard', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)
    _lastServerCheck = now
    _serverAvailable = response.ok
    return _serverAvailable
  } catch {
    _lastServerCheck = now
    _serverAvailable = false
    return false
  }
}

/**
 * Update server availability state from external fetch results.
 * Call this whenever a fetch succeeds or fails to keep the state fresh
 * without making additional health check requests.
 */
export function updateServerState(available: boolean): void {
  _serverAvailable = available
  _lastServerCheck = Date.now()
}
