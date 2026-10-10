/**
 * Test helpers
 *
 * Shared builders for the unit tests.
 *
 */

import type { Transaction } from "../../src/types";

// Build a transaction with sensible defaults
export const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: "tx1",
  type: "EXPENSE",
  amount: 1000,
  description: "Rent",
  account: "TEB",
  date: "2026-09-02",
  ...over,
});
