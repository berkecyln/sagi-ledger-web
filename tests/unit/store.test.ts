/**
 * Store tests
 *
 * Store actions with the api layer replaced by mocks, no network.
 *
 * Rules:
 *    a write lands in the month of its date
 *    a failed write leaves the screen equal to the server
 *    applying a template changes the active month only
 *
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../src/api";
import { templateDateToFull, useStore } from "../../src/store";
import type { Transaction } from "../../src/types";
import { tx } from "./helpers";

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
  loadAll: vi.fn(),
  newId: vi.fn(() => Math.random().toString(36).slice(2, 17)),
  describeError: vi.fn((e: unknown) => (e instanceof Error ? e.message : String(e))),
}));

const s = () => useStore.getState();

// Strip the generated id
const fields = (t: Transaction): Omit<Transaction, "id"> => {
  const { id, ...rest } = t;
  void id;
  return rest;
};

// Let rejected writes reach their rollback
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const offline = () => Promise.reject(new Error("offline"));

beforeEach(() => {
  vi.clearAllMocks();
  s().reset();
  useStore.setState({ status: "ready", activeMonthKey: "2026-09" });
});

describe("money", () => {
  it("keeps the exact cents on add and edit", () => {
    s().addTransaction(fields(tx({ amount: 250075 })));
    const [added] = s().months["2026-09"];
    expect(added.amount).toBe(250075);

    s().updateTransaction(added.id, fields(tx({ amount: 29 })));
    expect(s().months["2026-09"][0].amount).toBe(29);
  });

  it("deletes only the chosen row", () => {
    useStore.setState({ months: { "2026-09": [tx({ id: "a" }), tx({ id: "b" })] } });
    s().deleteTransaction("a");
    expect(s().months["2026-09"].map((t) => t.id)).toEqual(["b"]);
  });
});

describe("dates", () => {
  it.each([
    ["5", "2026-09", "2026-09-05"],
    ["31", "2026-09", "2026-09-30"],
    ["31", "2026-02", "2026-02-28"],
    ["31", "2028-02", "2028-02-29"],
    ["", "2026-09", "2026-09-01"],
  ])("template day %s in %s becomes %s", (day, month, expected) => {
    expect(templateDateToFull(day, month)).toBe(expected);
  });

  it("adds a transaction to the month of its date", () => {
    s().addTransaction(fields(tx({ date: "2026-10-10" })));
    expect(s().months["2026-09"] ?? []).toHaveLength(0);
    expect(s().months["2026-10"]).toHaveLength(1);
  });

  it("moves an edited transaction to the month of its new date", () => {
    useStore.setState({ months: { "2026-09": [tx()] } });
    s().updateTransaction("tx1", fields(tx({ date: "2026-10-03" })));
    expect(s().months["2026-09"]).toHaveLength(0);
    expect(s().months["2026-10"]).toEqual([tx({ date: "2026-10-03" })]);
  });
});

describe("labels", () => {
  it("adds trimmed labels once per type, case sensitive", () => {
    s().addDescription("EXPENSE", "  Rent ");
    s().addDescription("EXPENSE", "Rent");
    s().addDescription("EXPENSE", "rent");
    s().addDescription("INCOME", "Rent");
    expect(s().descriptions).toEqual({ INCOME: ["Rent"], EXPENSE: ["Rent", "rent"] });
  });

  it("does not save a label typed only into a transaction", () => {
    s().addTransaction(fields(tx({ description: "Coffee" })));
    expect(s().descriptions.EXPENSE).toEqual([]);
  });

  it("removes a label without touching transactions", () => {
    useStore.setState({ months: { "2026-09": [tx()] }, descriptions: { INCOME: [], EXPENSE: ["Rent"] } });
    s().deleteDescription("EXPENSE", "Rent");
    expect(s().descriptions.EXPENSE).toEqual([]);
    expect(s().months["2026-09"]).toEqual([tx()]);
  });
});

describe("accounts", () => {
  it("creates a new account when a transaction names one, keeping the old", () => {
    useStore.setState({ months: { "2026-09": [tx()] }, accountColors: { TEB: "#495867" } });
    s().updateTransaction("tx1", fields(tx({ account: "Sparkasse" })));
    expect(Object.keys(s().accountColors).sort()).toEqual(["Sparkasse", "TEB"]);

    s().deleteAccount("TEB");
    expect(s().accountColors.TEB).toBeUndefined();
  });

  it("blocks deleting an account used by a transaction or the template", () => {
    useStore.setState({
      months: { "2026-09": [tx({ account: "TEB" })] },
      template: [tx({ id: "t1", account: "Cash", date: "1" })],
      accountColors: { TEB: "#495867", Cash: "#64733a" },
      baseAccountBalances: { TEB: 500 },
    });
    s().deleteAccount("TEB");
    s().deleteAccount("Cash");
    expect(Object.keys(s().accountColors).sort()).toEqual(["Cash", "TEB"]);
    expect(s().baseAccountBalances.TEB).toBe(500);
  });

  it("sets a base balance in cents", () => {
    s().setBaseAccountBalance("TEB", -5025);
    expect(s().baseAccountBalances.TEB).toBe(-5025);
    expect(s().accountColors.TEB).toMatch(/^#/);
  });
});

describe("template", () => {
  it("adds, edits and deletes recurring items", () => {
    s().addTemplateItem(fields(tx({ description: "Savings", date: "31" })));
    const [item] = s().template;
    s().updateTemplateItem(item.id, { amount: 5000, date: "15" });
    expect(s().template).toEqual([{ ...item, amount: 5000, date: "15" }]);

    s().deleteTemplateItem(item.id);
    expect(s().template).toEqual([]);
  });

  it("replaces only the active month, clamped to its length", async () => {
    const august = [tx({ id: "aug", date: "2026-08-10" })];
    useStore.setState({
      activeMonthKey: "2026-02",
      months: { "2026-02": [tx({ id: "old", date: "2026-02-10" })], "2026-08": august },
      template: [tx({ id: "t1", description: "Savings", date: "31" })],
    });
    s().applyTemplateToMonth();
    await vi.waitFor(() => expect(s().applying).toBeNull());

    expect(s().months["2026-02"].map(fields)).toEqual([fields(tx({ description: "Savings", date: "2026-02-28" }))]);
    expect(s().months["2026-08"]).toEqual(august);
    expect(s().template).toHaveLength(1);
  });

  it("shows the server state after a failure halfway", async () => {
    const server = {
      months: { "2026-09": [tx({ id: "b" })] },
      template: [tx({ id: "t1", date: "5" })],
      accountColors: { TEB: "#495867" },
      baseAccountBalances: {},
      descriptions: { INCOME: [], EXPENSE: [] },
    };
    vi.mocked(api.loadAll).mockResolvedValueOnce(server);
    // First delete reaches the server, the second fails
    vi.mocked(api.deleteTransaction).mockResolvedValueOnce().mockImplementationOnce(offline);
    useStore.setState({
      months: { "2026-09": [tx({ id: "a" }), tx({ id: "b" })] },
      template: server.template,
    });
    s().applyTemplateToMonth();
    await vi.waitFor(() => expect(s().applying).toBeNull());

    expect(s().months).toEqual(server.months);
    expect(s().writeError).toBe("offline");
  });
});

describe("failed writes roll back", () => {
  it.each([
    ["add", () => s().addTransaction(fields(tx({ id: "new" })))],
    ["edit", () => s().updateTransaction("tx1", fields(tx({ amount: 1 })))],
    ["delete", () => s().deleteTransaction("tx1")],
  ])("transaction %s", async (_, write) => {
    vi.mocked(api.createTransaction).mockImplementationOnce(offline);
    vi.mocked(api.updateTransaction).mockImplementationOnce(offline);
    vi.mocked(api.deleteTransaction).mockImplementationOnce(offline);
    useStore.setState({ months: { "2026-09": [tx()] } });
    write();

    await settle();
    expect(s().months["2026-09"]).toEqual([tx()]);
    expect(s().writeError).toBe("offline");
  });

  it.each([
    ["add", () => s().addTemplateItem(fields(tx({ date: "3" })))],
    ["edit", () => s().updateTemplateItem("t1", { amount: 1 })],
    ["delete", () => s().deleteTemplateItem("t1")],
  ])("template item %s", async (_, write) => {
    vi.mocked(api.createTemplateItem).mockImplementationOnce(offline);
    vi.mocked(api.updateTemplateItem).mockImplementationOnce(offline);
    vi.mocked(api.deleteTemplateItem).mockImplementationOnce(offline);
    const template = [tx({ id: "t1", date: "1" })];
    useStore.setState({ template });
    write();

    await settle();
    expect(s().template).toEqual(template);
    expect(s().writeError).toBe("offline");
  });

  it("label add and delete", async () => {
    vi.mocked(api.createDescription).mockImplementationOnce(offline);
    vi.mocked(api.deleteDescription).mockImplementationOnce(offline);
    useStore.setState({ descriptions: { INCOME: [], EXPENSE: ["Rent"] } });
    s().addDescription("EXPENSE", "Coffee");
    await settle();
    s().deleteDescription("EXPENSE", "Rent");

    await settle();
    expect(s().descriptions.EXPENSE).toEqual(["Rent"]);
  });

  it("account delete and base balance", async () => {
    vi.mocked(api.deleteAccount).mockImplementationOnce(offline);
    vi.mocked(api.ensureAccount).mockImplementationOnce(offline);
    useStore.setState({ accountColors: { Old: "#495867" }, baseAccountBalances: { Old: 500 } });
    s().deleteAccount("Old");
    await settle();
    s().setBaseAccountBalance("New", 100);

    await settle();
    expect(s().accountColors).toEqual({ Old: "#495867" });
    expect(s().baseAccountBalances).toEqual({ Old: 500 });
  });
});

describe("sign out", () => {
  it("leaves nothing of the previous user", () => {
    useStore.setState({
      months: { "2026-09": [tx()] },
      template: [tx({ id: "t1", date: "1" })],
      accountColors: { TEB: "#495867" },
      baseAccountBalances: { TEB: 500 },
      descriptions: { INCOME: ["Salary"], EXPENSE: ["Rent"] },
      writeError: "offline",
    });
    s().reset();
    expect(s()).toMatchObject({
      months: {},
      template: [],
      accountColors: {},
      baseAccountBalances: {},
      descriptions: { INCOME: [], EXPENSE: [] },
      writeError: null,
    });
  });
});
