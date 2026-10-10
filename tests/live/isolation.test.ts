/**
 * Live isolation tests
 *
 * Two throwaway users attack each other's rows on the local test server.
 * Every attempt must be refused by the access rules, not by the app.
 *
 * Users:
 *    A (owns accountA, accountA2, txA, templateA)
 *    B (owns accountB, txB)
 *
 */

import { beforeAll, describe, expect, it } from "vitest";
import PocketBase, { BaseAuthStore } from "pocketbase";
import { newId } from "../../src/api";
import { TEST_API_URL, newUser, statusOf } from "./server";

// One client per user, each with its own in memory session
let a: PocketBase;
let b: PocketBase;
const anon = new PocketBase(TEST_API_URL, new BaseAuthStore());

const ids = {
  userA: "",
  userB: "",
  accountA: newId(),
  accountA2: newId(),
  accountB: newId(),
  txA: newId(),
  txB: newId(),
  templateA: newId(),
};

// Two users, each with real rows
beforeAll(async () => {
  ({ client: a, id: ids.userA } = await newUser("probe_iso_a"));
  ({ client: b, id: ids.userB } = await newUser("probe_iso_b"));

  const tx = { type: "EXPENSE", amount: 1000, description: "Probe", date: "2026-09-01" };
  await a.collection("accounts").create({ id: ids.accountA, user: ids.userA, name: "A1", color: "#495867", baseBalance: 0 });
  await a.collection("accounts").create({ id: ids.accountA2, user: ids.userA, name: "A2", color: "#64733a", baseBalance: 0 });
  await a.collection("transactions").create({ id: ids.txA, user: ids.userA, account: ids.accountA, ...tx });
  await a.collection("template_items").create({ id: ids.templateA, user: ids.userA, account: ids.accountA, type: "EXPENSE", amount: 500, description: "Probe", day: 1 });
  await b.collection("accounts").create({ id: ids.accountB, user: ids.userB, name: "B1", color: "#495867", baseBalance: 0 });
  await b.collection("transactions").create({ id: ids.txB, user: ids.userB, account: ids.accountB, ...tx });
});

describe("reading", () => {
  it("lists only own rows", async () => {
    const accounts = await a.collection("accounts").getFullList();
    const transactions = await a.collection("transactions").getFullList();
    const users = await a.collection("users").getFullList();
    expect(accounts.map((r) => r.id).sort()).toEqual([ids.accountA, ids.accountA2].sort());
    expect(transactions.map((r) => r.id)).toEqual([ids.txA]);
    expect(users.map((r) => r.id)).toEqual([ids.userA]);
  });

  it("cannot read the other user's rows by id", async () => {
    expect(await statusOf(a.collection("accounts").getOne(ids.accountB))).toBe(404);
    expect(await statusOf(a.collection("transactions").getOne(ids.txB))).toBe(404);
  });

  // The rule filters rather than rejects, so logged out reads are empty, not refused
  it("returns an empty list when logged out", async () => {
    expect(await anon.collection("transactions").getFullList()).toEqual([]);
  });
});

describe("writing to the other user's rows", () => {
  it("cannot update or delete them", async () => {
    expect(await statusOf(a.collection("transactions").update(ids.txB, { amount: 1 }))).toBe(404);
    expect(await statusOf(a.collection("transactions").delete(ids.txB))).toBe(404);
    expect(await statusOf(a.collection("accounts").delete(ids.accountB))).toBe(404);
  });

  it("cannot create a row owned by the other user", async () => {
    const tx = { id: newId(), user: ids.userB, account: ids.accountB, type: "EXPENSE", amount: 1, description: "Probe", date: "2026-09-02" };
    expect(await statusOf(a.collection("transactions").create(tx))).toBe(400);
  });

  it("cannot create an own row on the other user's account", async () => {
    const tx = { id: newId(), user: ids.userA, account: ids.accountB, type: "EXPENSE", amount: 1, description: "Probe", date: "2026-09-02" };
    expect(await statusOf(a.collection("transactions").create(tx))).toBe(400);
  });
});

describe("changing own rows", () => {
  it("cannot hand an own row to the other user", async () => {
    expect(await statusOf(a.collection("transactions").update(ids.txA, { user: ids.userB }))).toBe(404);
    // Still owned by A
    expect((await a.collection("transactions").getOne(ids.txA)).user).toBe(ids.userA);
  });

  it("cannot point an own row at the other user's account", async () => {
    expect(await statusOf(a.collection("transactions").update(ids.txA, { account: ids.accountB }))).toBe(404);
    expect(await statusOf(a.collection("template_items").update(ids.templateA, { account: ids.accountB }))).toBe(404);
  });

  it("can change only the amount", async () => {
    expect(await statusOf(a.collection("transactions").update(ids.txA, { amount: 2000 }))).toBe(200);
  });

  it("can point an own row at another own account", async () => {
    expect(await statusOf(a.collection("transactions").update(ids.txA, { account: ids.accountA2 }))).toBe(200);
    expect(await statusOf(a.collection("template_items").update(ids.templateA, { account: ids.accountA2 }))).toBe(200);
  });

  it("left the other user's rows untouched", async () => {
    const rows = await b.collection("transactions").getFullList();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: ids.txB, account: ids.accountB, amount: 1000 });
  });
});
