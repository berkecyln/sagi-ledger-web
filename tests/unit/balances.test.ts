/**
 * Balance tests
 *
 * Total balance per account shown in the footer and the Dashboard card.
 *
 */

import { describe, expect, it } from "vitest";
import { getTotalBalances } from "../../src/utils/aggregations";
import type { Transaction } from "../../src/types";

// Build a transaction with sensible defaults
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: "tx",
  type: "EXPENSE",
  amount: 1000,
  description: "Rent",
  account: "TEB",
  date: "2026-09-02",
  ...over,
});

describe("getTotalBalances", () => {
  it("adds every month to the base balance, highest first", () => {
    const months = {
      "2026-08": [
        tx({ type: "INCOME", amount: 1000, account: "TEB" }),
        tx({ amount: 300, account: "TEB" }),
      ],
      "2026-09": [tx({ amount: 500, account: "Sparkasse" })],
    };
    const colors = { TEB: "#495867", Sparkasse: "#3f7bc4" };
    expect(getTotalBalances(months, colors, { Sparkasse: 200 })).toEqual([
      { account: "TEB", total: 700 },
      { account: "Sparkasse", total: -300 },
    ]);
  });

  it("lists a known account with no transactions at its base balance", () => {
    expect(getTotalBalances({}, { New: "#495867" }, { New: 5000 })).toEqual([{ account: "New", total: 5000 }]);
    expect(getTotalBalances({}, { Empty: "#495867" }, {})).toEqual([{ account: "Empty", total: 0 }]);
  });
});
