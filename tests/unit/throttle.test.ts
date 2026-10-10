/**
 * Throttle tests
 *
 * Writes queue under the server rate limit, in order, without getting stuck.
 *
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottle, pendingWrites } from "../../src/api/throttle";

const rateLimited = { status: 429 };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createThrottle", () => {
  it("holds a write over the limit until the window frees", async () => {
    const run = createThrottle({ limit: 2, windowMs: 1000 });
    let started = 0;
    const write = () => {
      started++;
      return Promise.resolve();
    };
    const all = Promise.all([run(write), run(write), run(write)]);

    await vi.advanceTimersByTimeAsync(999);
    expect(started).toBe(2);

    await vi.advanceTimersByTimeAsync(100);
    await all;
    expect(started).toBe(3);
  });

  it("runs writes in the order they were queued", async () => {
    const run = createThrottle({ limit: 10, windowMs: 1000 });
    const order: string[] = [];
    // The first write is the slowest
    const slow = () =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          order.push("a");
          resolve();
        }, 50),
      );
    const fast = async () => {
      order.push("b");
    };
    const all = Promise.all([run(slow), run(fast)]);

    await vi.advanceTimersByTimeAsync(50);
    await all;
    expect(order).toEqual(["a", "b"]);
  });

  it("keeps going after a failed write", async () => {
    const run = createThrottle({ limit: 10, windowMs: 1000 });
    const failed = run(() => Promise.reject(new Error("offline")));
    const next = run(() => Promise.resolve("saved"));

    await expect(failed).rejects.toThrow("offline");
    await expect(next).resolves.toBe("saved");
  });

  it("retries a rate limited write", async () => {
    const run = createThrottle({ limit: 10, windowMs: 1000 });
    const write = vi.fn().mockRejectedValueOnce(rateLimited).mockResolvedValueOnce("saved");
    const result = run(write);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe("saved");
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("gives up after the last retry", async () => {
    const run = createThrottle({ limit: 10, windowMs: 1000, retries: 1 });
    const result = run(() => Promise.reject(rateLimited));
    const check = expect(result).rejects.toBe(rateLimited);

    await vi.advanceTimersByTimeAsync(5000);
    await check;
  });

  it("counts pending writes until each settles", async () => {
    const run = createThrottle({ limit: 10, windowMs: 1000 });
    const ok = run(() => Promise.resolve());
    const failed = run(() => Promise.reject(new Error("offline")));
    expect(pendingWrites()).toBe(2);

    await ok;
    await failed.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(0);
    expect(pendingWrites()).toBe(0);
  });
});
