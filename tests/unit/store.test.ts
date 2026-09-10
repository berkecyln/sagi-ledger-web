/**
 * Store tests
 *
 * Store actions with the api layer replaced by mocks, no network.
 *
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../src/api";
import { templateDateToFull, useStore } from "../../src/store";
import type { Transaction } from "../../src/types";

// Api layer mock, every write succeeds unless a test says otherwise
vi.mock("../../src/api", () => ({
  createTransaction: vi.fn(() => Promise.resolve()),
  updateTransaction: vi.fn(() => Promise.resolve()),
  deleteTransaction: vi.fn(() => Promise.resolve()),
  createTemplateItem: vi.fn(() => Promise.resolve()),
  updateTemplateItem: vi.fn(() => Promise.resolve()),
  deleteTemplateItem: vi.fn(() => Promise.resolve()),
  createDescription: vi.fn(() => Promise.resolve()),
  deleteDescription: vi.fn(() => Promise.resolve()),
  ensureAccount: vi.fn(() => Promise.resolve("account")),
  updateAccount: vi.fn(() => Promise.resolve()),
  deleteAccount: vi.fn(() => Promise.resolve()),
  accountIdFor: vi.fn(() => undefined),
  newId: vi.fn(() => Math.random().toString(36).slice(2, 17)),
  describeError: vi.fn((e: unknown) => (e instanceof Error ? e.message : String(e))),
}));

// Build a transaction with sensible defaults
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: "tx1",
  type: "EXPENSE",
  amount: 1000,
  description: "Rent",
  account: "TEB",
  date: "2026-09-02",
  ...over,
});

const s = () => useStore.getState();

// Let rejected writes reach their rollback
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.clearAllMocks();
  s().reset();
  useStore.setState({ status: "ready", activeMonthKey: "2026-09" });
});

describe("templateDateToFull", () => {
  it.each([
    ["5", "2026-09", "2026-09-05"],
    ["30", "2026-09", "2026-09-30"],
    ["31", "2026-09", "2026-09-30"],
    ["31", "2026-02", "2026-02-28"],
    ["31", "2028-02", "2028-02-29"],
    ["", "2026-09", "2026-09-01"],
  ])("day %s in %s becomes %s", (day, month, expected) => {
    expect(templateDateToFull(day, month)).toBe(expected);
  });
});

describe("transactions", () => {
  it("adds to the active month and writes to the server", () => {
    s().addTransaction({ type: "EXPENSE", amount: 1000, description: "Rent", account: "TEB", date: "2026-09-02" });
    expect(s().months["2026-09"]).toHaveLength(1);
    expect(s().accountColors.TEB).toBeTruthy();
    expect(api.createTransaction).toHaveBeenCalledOnce();
  });

  it("rolls back a failed create and reports it", async () => {
    vi.mocked(api.createTransaction).mockRejectedValueOnce(new Error("offline"));
    s().addTransaction({ type: "EXPENSE", amount: 1000, description: "Rent", account: "TEB", date: "2026-09-02" });
    expect(s().months["2026-09"]).toHaveLength(1);

    await settle();
    expect(s().months["2026-09"]).toHaveLength(0);
    expect(s().writeError).toBe("offline");
  });

  it("rolls back a failed delete", async () => {
    vi.mocked(api.deleteTransaction).mockRejectedValueOnce(new Error("offline"));
    useStore.setState({ months: { "2026-09": [tx()] } });
    s().deleteTransaction("tx1");
    expect(s().months["2026-09"]).toHaveLength(0);

    await settle();
    expect(s().months["2026-09"]).toEqual([tx()]);
  });
});

describe("applyTemplateToMonth", () => {
  it("replaces the month with the template, clamped to the month length", async () => {
    useStore.setState({
      activeMonthKey: "2026-02",
      months: { "2026-02": [tx({ id: "old", date: "2026-02-10" })] },
      template: [tx({ id: "t1", description: "Savings", date: "31" })],
    });
    s().applyTemplateToMonth();

    const month = s().months["2026-02"];
    expect(month).toHaveLength(1);
    expect(month[0]).toMatchObject({ description: "Savings", date: "2026-02-28" });

    await vi.waitFor(() => expect(s().applying).toBeNull());
    expect(api.deleteTransaction).toHaveBeenCalledWith("old");
    expect(api.createTransaction).toHaveBeenCalledOnce();
  });
});

describe("accounts", () => {
  it("blocks deleting an account still in use", () => {
    useStore.setState({ months: { "2026-09": [tx()] }, accountColors: { TEB: "#495867" } });
    s().deleteAccount("TEB");
    expect(s().accountColors.TEB).toBe("#495867");
    expect(api.deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes an unused account", () => {
    useStore.setState({ accountColors: { Old: "#495867" }, baseAccountBalances: { Old: 500 } });
    s().deleteAccount("Old");
    expect(s().accountColors).toEqual({});
    expect(s().baseAccountBalances).toEqual({});
    expect(api.deleteAccount).toHaveBeenCalledWith("Old");
  });
});

describe("descriptions", () => {
  it("adds trimmed labels once, sorted, per type", () => {
    s().addDescription("EXPENSE", "  Rent ");
    s().addDescription("EXPENSE", "Coffee");
    s().addDescription("EXPENSE", "Rent");
    s().addDescription("INCOME", "Salary");
    expect(s().descriptions).toEqual({ INCOME: ["Salary"], EXPENSE: ["Coffee", "Rent"] });
    expect(api.createDescription).toHaveBeenCalledTimes(3);
  });

  it("removes a label without touching transactions", () => {
    useStore.setState({
      months: { "2026-09": [tx()] },
      descriptions: { INCOME: [], EXPENSE: ["Rent"] },
    });
    s().deleteDescription("EXPENSE", "Rent");
    expect(s().descriptions.EXPENSE).toEqual([]);
    expect(s().months["2026-09"][0].description).toBe("Rent");
  });
});
