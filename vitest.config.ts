/**
 * Vitest configuration
 *
 * Projects:
 *    unit (tests/unit, offline)
 *    live (tests/live, against a local PocketBase started by tests/live/setup.ts)
 *
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "live",
          include: ["tests/live/**/*.test.ts"],
          globalSetup: ["tests/live/setup.ts"],
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
