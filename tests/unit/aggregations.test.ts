/**
 * Aggregation tests
 *
 * Money formatting and the derived values every page reads.
 *
 */

import { describe, expect, it } from "vitest";
import {
  aggregateByDescriptionAndAccount,
  aggregateByDescriptionWithAccounts,
  formatEuro,
  getAllTimeBalanceByAccount,
  getUniqueDescriptions,
  isAccountInUse,
  parseEuro,
  toEuroInput,
} from "../../src/utils/aggregations";
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

describe("formatEuro", () => {
  // Intl puts a non breaking space before the sign
  const euro = (cents: number) => formatEuro(cents).replace(/\s/g, " ");

  it("formats integer cents as euros", () => {
    expect(euro(123456)).toBe("1.234,56 €");
    expect(euro(1)).toBe("0,01 €");
    expect(euro(0)).toBe("0,00 €");
    expect(euro(-5050)).toBe("-50,50 €");
  });
});

describe("parseEuro", () => {
  it("accepts a comma or a dot as the decimal separator", () => {
    expect(parseEuro("12,50")).toBe(1250);
    expect(parseEuro("12.50")).toBe(1250);
    expect(parseEuro("12,5")).toBe(1250);
    expect(parseEuro(" 12 ")).toBe(1200);
    expect(parseEuro("0")).toBe(0);
  });

  it("keeps cents exact where floats drift", () => {
    expect(parseEuro("0,29")).toBe(29);
    expect(parseEuro("1,15")).toBe(115);
  });

  it("allows a sign for base balances", () => {
    expect(parseEuro("-50,25")).toBe(-5025);
  });

  it("rejects anything that is not a plain amount", () => {
    for (const bad of ["", "abc", "12,505", "1.234,56", "12,", ",5", "12 50", "12€"]) {
      expect(parseEuro(bad), bad).toBeNull();
    }
  });
});

describe("toEuroInput", () => {
  it("formats cents for editing and parses back unchanged", () => {
    expect(toEuroInput(1250)).toBe("12,50");
    expect(toEuroInput(0)).toBe("0,00");
    for (const cents of [1, 29, 1250, 250075]) {
      expect(parseEuro(toEuroInput(cents))).toBe(cents);
    }
  });
});

describe("getAllTimeBalanceByAccount", () => {
  it("nets income against expense per account across months", () => {
    const months = {
      "2026-08": [
        tx({ type: "INCOME", amount: 1000, account: "TEB" }),
        tx({ amount: 300, account: "TEB" }),
      ],
      "2026-09": [tx({ amount: 200, account: "Sparkasse" })],
    };
    const byAccount = Object.fromEntries(
      getAllTimeBalanceByAccount(months).map((a) => [a.account, a.balance]),
    );
    expect(byAccount).toEqual({ TEB: 700, Sparkasse: -200 });
  });
});

describe("dashboard aggregations", () => {
  it("splits income rows by description and account", () => {
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

  it("groups expense rows by description with each account once", () => {
    const rows = aggregateByDescriptionWithAccounts([
      tx({ description: "Groceries", account: "TEB", amount: 100 }),
      tx({ description: "Groceries", account: "TEB", amount: 100 }),
      tx({ description: "Groceries", account: "Sparkasse", amount: 50 }),
    ]);
    expect(rows).toEqual([
      { description: "Groceries", total: 250, accounts: ["TEB", "Sparkasse"] },
    ]);
  });
});

describe("lookups", () => {
  it("counts an account used only by the template as in use", () => {
    expect(isAccountInUse("TEB", {}, [tx({ account: "TEB" })])).toBe(true);
    expect(isAccountInUse("Old", { "2026-09": [tx()] }, [])).toBe(false);
  });

  it("lists descriptions sorted, without blanks or repeats", () => {
    const months = {
      "2026-09": [tx({ description: "Rent" }), tx({ description: "" }), tx({ description: "Coffee" })],
      "2026-08": [tx({ description: "Rent" })],
    };
    expect(getUniqueDescriptions(months)).toEqual(["Coffee", "Rent"]);
  });
});
