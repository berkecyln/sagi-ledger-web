/**
 * Search tests
 *
 * Ledger search on description, account and amount.
 *
 */

import { describe, expect, it } from "vitest";
import { matchesSearch } from "../../src/utils/aggregations";
import type { Transaction } from "../../src/types";

const tx: Transaction = {
  id: "tx",
  type: "EXPENSE",
  amount: 1250,
  description: "Groceries",
  account: "Sparkasse",
  date: "2026-09-04",
};

describe("matchesSearch", () => {
  it("matches everything for an empty query", () => {
    expect(matchesSearch(tx, "")).toBe(true);
    expect(matchesSearch(tx, "   ")).toBe(true);
  });

  it("matches description and account, ignoring case", () => {
    expect(matchesSearch(tx, "groc")).toBe(true);
    expect(matchesSearch(tx, "SPARK")).toBe(true);
  });

  it("matches the amount with a comma or a dot", () => {
    expect(matchesSearch(tx, "12,50")).toBe(true);
    expect(matchesSearch(tx, "12.5")).toBe(true);
  });

  it("rejects a query found nowhere", () => {
    expect(matchesSearch(tx, "rent")).toBe(false);
    expect(matchesSearch(tx, "99")).toBe(false);
  });
});
