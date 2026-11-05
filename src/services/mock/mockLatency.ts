/**
 * Mock Network Latency Simulation (Jitter & Delay)
 */

export const MOCK_DELAY_DEFAULT_MIN = 200;
export const MOCK_DELAY_DEFAULT_MAX = 400;

export interface LatencyOptions {
  enabled?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  slowNetworkMode?: boolean;
}

/**
 * Simulates network delay with jitter.
 * Default 200–400ms, Slow-network 1200–2000ms, or fixed duration if ms number passed.
 */
export async function simulateDelay(msOrOptions?: number | LatencyOptions): Promise<void> {
  if (typeof msOrOptions === 'number') {
    if (msOrOptions <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, msOrOrZero(msOrOptions)));
  }

  const options = msOrOptions || {};
  if (options.enabled === false) return;

  let min = options.minDelayMs ?? MOCK_DELAY_DEFAULT_MIN;
  let max = options.maxDelayMs ?? MOCK_DELAY_DEFAULT_MAX;

  if (options.slowNetworkMode) {
    min = 1200;
    max = 2000;
  }

  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  if (duration <= 0) return;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function msOrOrZero(ms: number): number {
  return Math.max(0, ms);
}
