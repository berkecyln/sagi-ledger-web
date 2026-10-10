/**
 * Aggregation tests
 *
 * Derived values every page reads: label rows, account splits and balances.
 *
 */

import { describe, expect, it } from "vitest";
import {
  aggregateByAccount,
  aggregateByDescription,
  aggregateByDescriptionAndAccount,
  aggregateByDescriptionWithAccounts,
  getTotalBalances,
  getUniqueDescriptions,
} from "../../src/utils/aggregations";
import { tx } from "./helpers";

describe("labels", () => {
  it("sums one row per label, case sensitive", () => {
    const rows = aggregateByDescription([
      tx({ description: "Rent", amount: 100 }),
      tx({ description: "Rent", amount: 50 }),
      tx({ description: "rent", amount: 7 }),
    ]);
    expect(rows).toEqual([
      { description: "Rent", total: 150 },
      { description: "rent", total: 7 },
    ]);
  });

  it("splits income rows by label and account", () => {
    const rows = aggregateByDescriptionAndAccount([
      tx({ description: "Salary", account: "TEB", amount: 100 }),
      tx({ description: "Salary", account: "Sparkasse", amount: 50 }),
      tx({ description: "Salary", account: "TEB", amount: 25 }),
    ]);
    expect(rows).toEqual([
      { description: "Salary", account: "TEB", total: 125 },
      { description: "Salary", account: "Sparkasse", total: 50 },
    ]);
  });

  it("groups expense rows by label, listing each account once", () => {
    const rows = aggregateByDescriptionWithAccounts([
      tx({ description: "Groceries", account: "TEB", amount: 100 }),
      tx({ description: "Groceries", account: "TEB", amount: 100 }),
      tx({ description: "Groceries", account: "Sparkasse", amount: 50 }),
    ]);
    expect(rows).toEqual([{ description: "Groceries", total: 250, accounts: ["TEB", "Sparkasse"] }]);
  });

  it("lists filter labels sorted, without blanks or repeats", () => {
    const months = {
      "2026-09": [tx({ description: "Rent" }), tx({ description: "" }), tx({ description: "Coffee" })],
      "2026-08": [tx({ description: "Rent" })],
    };
    expect(getUniqueDescriptions(months)).toEqual(["Coffee", "Rent"]);
  });
});

describe("accounts", () => {
  it("keeps income and expense apart per account", () => {
    const rows = aggregateByAccount([
      tx({ type: "INCOME", amount: 1000, account: "TEB" }),
      tx({ amount: 300, account: "TEB" }),
      tx({ amount: 200, account: "Sparkasse" }),
    ]);
    expect(rows).toEqual([
      { account: "TEB", income: 1000, expense: 300 },
      { account: "Sparkasse", income: 0, expense: 200 },
    ]);
  });
});

describe("total balances", () => {
  it("adds every month to the base balance, highest first", () => {
    const months = {
      "2026-08": [tx({ type: "INCOME", amount: 1000, account: "TEB" }), tx({ amount: 300, account: "TEB" })],
      "2026-09": [tx({ amount: 500, account: "Sparkasse" })],
    };
    const colors = { TEB: "#495867", Sparkasse: "#3f7bc4" };
    expect(getTotalBalances(months, colors, { TEB: -100, Sparkasse: 200 })).toEqual([
      { account: "TEB", total: 600 },
      { account: "Sparkasse", total: -300 },
    ]);
  });

  it("shows a known account with no transactions at its base balance", () => {
    expect(getTotalBalances({}, { New: "#495867", Empty: "#3f7bc4" }, { New: 5000 })).toEqual([
      { account: "New", total: 5000 },
      { account: "Empty", total: 0 },
    ]);
  });
});
