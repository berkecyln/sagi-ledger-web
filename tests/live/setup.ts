/**
 * Live test server
 *
 * Starts a fresh local PocketBase before the live tests and removes it after.
 *
 */

import { execFileSync } from "node:child_process";

// Run a pb.sh command, showing its output
function pb(command: string): void {
  execFileSync("sh", ["pocketbase/pb.sh", command], { stdio: "inherit" });
}

export function setup(): () => void {
  pb("test-up");
  return () => pb("test-down");
}
