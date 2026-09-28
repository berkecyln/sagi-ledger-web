/**
 * Live isolation tests
 *
 * Two throwaway users attack each other's rows on the production server.
 * Every attempt must be refused by the access rules, not by the app.
 *
 * Users:
 *    A (owns accountA, accountA2, txA, templateA)
 *    B (owns accountB, txB)
 *
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import PocketBase, { BaseAuthStore, ClientResponseError } from "pocketbase";
import { newId } from "../../src/api";

const API_URL = "https://api.sagiledger.com";
const INVITE_CODE = process.env.SAGI_INVITE_CODE;
const LONG = 60_000;

// One client per user, each with its own in memory session
const a = new PocketBase(API_URL, new BaseAuthStore());
const b = new PocketBase(API_URL, new BaseAuthStore());
const anon = new PocketBase(API_URL, new BaseAuthStore());
for (const client of [a, b, anon]) client.autoCancellation(false);

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

// Create a user with the invite code and sign the client in
async function signup(client: PocketBase, prefix: string): Promise<string> {
  const username = `${prefix}_${Math.floor(Math.random() * 100000)}`;
  const password = `Probe_${newId()}`;
  await client.collection("users").create({ username, password, passwordConfirm: password, inviteCode: INVITE_CODE });
  const auth = await client.collection("users").authWithPassword(username, password);
  return auth.record.id;
}

// Return the HTTP status of a request, 200 when it succeeds
async function statusOf(request: Promise<unknown>): Promise<number> {
  try {
    await request;
    return 200;
  } catch (error) {
    if (error instanceof ClientResponseError) return error.status;
    throw error;
  }
}

// Delete every row of a signed in user, then the user
async function cleanup(client: PocketBase, userId: string) {
  if (!userId) return;
  // Transactions first, they block the account cascade
  for (const name of ["transactions", "template_items", "descriptions", "accounts"]) {
    const rows = await client.collection(name).getFullList();
    for (const row of rows) await client.collection(name).delete(row.id);
  }
  await client.collection("users").delete(userId);
  client.authStore.clear();
}

// Two users, each with real rows
beforeAll(async () => {
  if (!INVITE_CODE) {
    throw new Error("SAGI_INVITE_CODE is not set, copy .env.example to .env.local and fill it in.");
  }
  ids.userA = await signup(a, "probe_iso_a");
  ids.userB = await signup(b, "probe_iso_b");

  const tx = { type: "EXPENSE", amount: 1000, description: "Probe", date: "2026-09-01" };
  await a.collection("accounts").create({ id: ids.accountA, user: ids.userA, name: "A1", color: "#495867", baseBalance: 0 });
  await a.collection("accounts").create({ id: ids.accountA2, user: ids.userA, name: "A2", color: "#64733a", baseBalance: 0 });
  await a.collection("transactions").create({ id: ids.txA, user: ids.userA, account: ids.accountA, ...tx });
  await a.collection("template_items").create({ id: ids.templateA, user: ids.userA, account: ids.accountA, type: "EXPENSE", amount: 500, description: "Probe", day: 1 });
  await b.collection("accounts").create({ id: ids.accountB, user: ids.userB, name: "B1", color: "#495867", baseBalance: 0 });
  await b.collection("transactions").create({ id: ids.txB, user: ids.userB, account: ids.accountB, ...tx });
}, LONG);

// Remove both users, also after a failure
afterAll(async () => {
  // B first, a row handed over by A would block A's account delete
  const results = await Promise.allSettled([cleanup(b, ids.userB)]);
  results.push(...(await Promise.allSettled([cleanup(a, ids.userA)])));
  const failed = results.find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
}, LONG);

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
