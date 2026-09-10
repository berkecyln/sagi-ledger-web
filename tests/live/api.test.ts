/**
 * Live api tests
 *
 * Runs the api layer against the production server with a throwaway user.
 *
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDescription,
  createTemplateItem,
  createTransaction,
  deleteTransaction,
  ensureAccount,
  isEmpty,
  loadAll,
  logout,
  newId,
  pb,
  signup,
  updateAccount,
  updateTransaction,
  type SessionUser,
} from "../../src/api";

const INVITE_CODE = process.env.SAGI_INVITE_CODE;
const USER = `probe_live_${Math.floor(Math.random() * 100000)}`;
const PASSWORD = `Probe_${newId()}`;
const LONG = 60_000;

let user: SessionUser | undefined;
const txId = newId();

// Throwaway user for the whole file
beforeAll(async () => {
  if (!INVITE_CODE) {
    throw new Error("SAGI_INVITE_CODE is not set, copy .env.example to .env.local and fill it in.");
  }
  user = await signup(USER, PASSWORD, INVITE_CODE);
}, LONG);

// Remove every row and the user, also after a failure
afterAll(async () => {
  if (!user) return;
  for (const name of ["transactions", "template_items", "descriptions", "accounts"]) {
    const rows = await pb.collection(name).getFullList();
    for (let i = 0; i < rows.length; i += 10) {
      await Promise.all(rows.slice(i, i + 10).map((r) => pb.collection(name).delete(r.id)));
    }
  }
  await pb.collection("users").delete(user.id);
  logout();
}, LONG);

describe("api layer against the server", () => {
  it("starts empty", async () => {
    expect(isEmpty(await loadAll())).toBe(true);
  });

  it("creates an account once, also for concurrent calls", async () => {
    const first = await ensureAccount("TEB", "#495867", 12345);
    expect(await ensureAccount("TEB", "#495867")).toBe(first);

    const [a, b] = await Promise.all([
      ensureAccount("Race", "#64733a"),
      ensureAccount("Race", "#64733a"),
    ]);
    expect(a).toBe(b);
  });

  it("round trips transactions, template items and labels", async () => {
    await createTransaction(
      { id: txId, type: "INCOME", amount: 250075, description: "Salary", account: "TEB", date: "2026-09-01" },
      "#495867",
    );
    await createDescription("EXPENSE", "Rent");
    await createTemplateItem(
      { id: newId(), type: "EXPENSE", amount: 0, description: "Rent", account: "TEB", date: "31" },
      "#495867",
    );

    const state = await loadAll();
    expect(Object.keys(state.months)).toEqual(["2026-09"]);
    expect(state.months["2026-09"][0]).toMatchObject({ id: txId, account: "TEB", amount: 250075 });
    expect(state.baseAccountBalances.TEB).toBe(12345);
    expect(state.accountColors.TEB).toBe("#495867");
    expect(state.descriptions.EXPENSE).toEqual(["Rent"]);
    expect(state.template[0]).toMatchObject({ date: "31", amount: 0 });
  });

  it("repoints a transaction to another own account", async () => {
    await updateTransaction(
      txId,
      { type: "INCOME", amount: 1, description: "Salary", account: "Race", date: "2026-09-01" },
      "#64733a",
    );
    expect((await loadAll()).months["2026-09"][0].account).toBe("Race");
  });

  it("updates a base balance", async () => {
    await updateAccount("TEB", { baseBalance: 500 });
    expect((await loadAll()).baseAccountBalances.TEB).toBe(500);
  });

  it("throttles bulk creates without losing any", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        createTransaction(
          { id: newId(), type: "EXPENSE", amount: 100 + i, description: "Bulk", account: "TEB", date: "2026-08-05" },
          "#495867",
        ),
      ),
    );
    expect((await loadAll()).months["2026-08"]).toHaveLength(25);
  }, LONG);

  it("deletes a transaction", async () => {
    await deleteTransaction(txId);
    expect((await loadAll()).months["2026-09"]).toBeUndefined();
  });
});
