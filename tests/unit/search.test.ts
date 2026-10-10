/**
 * Search tests
 *
 * Ledger search on description, account and amount.
 *
 */

import { describe, expect, it } from "vitest";
import { matchesSearch } from "../../src/utils/aggregations";
import { tx } from "./helpers";

const groceries = tx({ amount: 1250, description: "Groceries", account: "Sparkasse" });

describe("matchesSearch", () => {
  it("matches everything for an empty query", () => {
    expect(matchesSearch(groceries, "   ")).toBe(true);
  });

  it("matches description and account, ignoring case", () => {
    expect(matchesSearch(groceries, "groc")).toBe(true);
    expect(matchesSearch(groceries, "SPARK")).toBe(true);
  });

  it("matches the amount with a comma or a dot", () => {
    expect(matchesSearch(groceries, "12,50")).toBe(true);
    expect(matchesSearch(groceries, "12.5")).toBe(true);
  });

  it("rejects a query found nowhere", () => {
    expect(matchesSearch(groceries, "rent")).toBe(false);
    expect(matchesSearch(groceries, "99")).toBe(false);
  });
});
