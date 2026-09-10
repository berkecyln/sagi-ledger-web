/**
 * Vitest configuration
 *
 * Runs the tests in tests/ against the source in src.
 *
 */

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // reas test valuses from env.local
    env: loadEnv("test", process.cwd(), "SAGI_"),
  },
});
