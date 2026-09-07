/**
 * Write pacing
 *
 * Queues writes and spaces them out to stay under the server rate limit.
 *
 * Server limits:
 *    *:create (20 per 5s)
 *    *:auth (2 per 3s)
 *    /api/ (300 per 10s)
 *
 */

import { isRateLimited } from "./errors";

export interface ThrottleOptions {
  limit: number;
  windowMs: number;
  retries?: number;
}

// Pause for a number of milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Writes queued but not yet finished, across every queue
let pending = 0;
const listeners = new Set<() => void>();

function setPending(next: number): void {
  pending = next;
  for (const listener of listeners) listener();
}

// Return how many writes are still in flight
export function pendingWrites(): number {
  return pending;
}

// Subscribe to the in flight count, returns an unsubscribe
export function subscribePendingWrites(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Create a queue that runs calls one at a time
export function createThrottle({ limit, windowMs, retries = 4 }: ThrottleOptions) {
  const recent: number[] = [];
  let chain: Promise<unknown> = Promise.resolve();

  // Wait for a free slot in the current window
  async function takeSlot(): Promise<void> {
    for (;;) {
      const now = Date.now();
      // Drop timestamps older than the window
      while (recent.length > 0 && now - recent[0] >= windowMs) recent.shift();
      if (recent.length < limit) {
        recent.push(now);
        return;
      }
      await sleep(windowMs - (now - recent[0]) + 50);
    }
  }

  // Queue a call and retry it if rate limited
  return function run<T>(call: () => Promise<T>): Promise<T> {
    setPending(pending + 1);
    const result = chain.then(async () => {
      for (let attempt = 0; ; attempt++) {
        await takeSlot();
        try {
          return await call();
        } catch (error) {
          if (!isRateLimited(error) || attempt >= retries) throw error;
          // Back off further on each retry
          await sleep(windowMs * (attempt + 1));
        }
      }
    });
    // A failed call does not stall the queue behind it
    chain = result.catch(() => undefined);
    result.then(
      () => setPending(pending - 1),
      () => setPending(pending - 1),
    );
    return result;
  };
}

// Shared queue for every write, 15 per 5s
export const throttledWrite = createThrottle({ limit: 15, windowMs: 5000 });
