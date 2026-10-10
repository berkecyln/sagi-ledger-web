/**
 * Live api tests
 *
 * Runs the api layer against the local test server with a throwaway user.
 *
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  createDescription,
  createTemplateItem,
  createTransaction,
  deleteTransaction,
  ensureAccount,
  isEmpty,
  loadAll,
  newId,
  pb,
  signup,
  updateAccount,
  updateTransaction,
} from "../../src/api";
import { INVITE_CODE, TEST_API_URL, password, username } from "./server";

const txId = newId();

// Throwaway user on the test server
beforeAll(async () => {
  pb.baseURL = TEST_API_URL;
  await signup(username("probe_api"), password(), INVITE_CODE);
});

describe("api layer against the server", () => {
  it("starts empty", async () => {
    expect(isEmpty(await loadAll())).toBe(true);
  });

  it("creates an account once, also for concurrent calls", async () => {
    const first = await ensureAccount("TEB", "#495867", 12345);
    expect(await ensureAccount("TEB", "#495867")).toBe(first);

    const [a, b] = await Promise.all([ensureAccount("Race", "#64733a"), ensureAccount("Race", "#64733a")]);
    expect(a).toBe(b);
  });

  it("reads back exactly what was written", async () => {
    await createTransaction(
      { id: txId, type: "INCOME", amount: 250075, description: "Salary", account: "TEB", date: "2026-09-01" },
      "#495867",
    );
    await createDescription("INCOME", "Salary");
    await createDescription("EXPENSE", "Rent");
    await createTemplateItem(
      { id: newId(), type: "EXPENSE", amount: 0, description: "Rent", account: "TEB", date: "31" },
      "#495867",
    );

    const state = await loadAll();
    expect(state.months).toEqual({
      "2026-09": [
        { id: txId, type: "INCOME", amount: 250075, description: "Salary", account: "TEB", date: "2026-09-01" },
      ],
    });
    expect(state.template).toMatchObject([{ type: "EXPENSE", amount: 0, description: "Rent", account: "TEB", date: "31" }]);
    expect(state.descriptions).toEqual({ INCOME: ["Salary"], EXPENSE: ["Rent"] });
    expect(state.baseAccountBalances).toEqual({ Race: 0, TEB: 12345 });
    expect(state.accountColors).toEqual({ Race: "#64733a", TEB: "#495867" });
  });

  it("repoints a transaction to another own account", async () => {
    await updateTransaction(
      txId,
      { type: "INCOME", amount: 1, description: "Salary", account: "Race", date: "2026-09-01" },
      "#64733a",
    );
    expect((await loadAll()).months["2026-09"][0]).toMatchObject({ account: "Race", amount: 1 });
  });

  it("updates a base balance", async () => {
    await updateAccount("TEB", { baseBalance: -500 });
    expect((await loadAll()).baseAccountBalances.TEB).toBe(-500);
  });

  it("writes a bulk of creates without losing any", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        createTransaction(
          { id: newId(), type: "EXPENSE", amount: 100 + i, description: "Bulk", account: "TEB", date: "2026-08-05" },
          "#495867",
        ),
      ),
    );
    expect((await loadAll()).months["2026-08"]).toHaveLength(25);
  });

  it("deletes a transaction", async () => {
    await deleteTransaction(txId);
    expect((await loadAll()).months["2026-09"]).toBeUndefined();
  });
});
