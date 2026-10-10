/**
 * Live rule tests
 *
 * The server refuses data the app must never store, whatever the client sends.
 *
 */

import { beforeAll, describe, expect, it } from "vitest";
import type PocketBase from "pocketbase";
import { newId } from "../../src/api";
import { newUser, statusOf } from "./server";

let client: PocketBase;
let userId = "";
const accountId = newId();

// Build a transaction row with sensible defaults
const row = (over: Record<string, unknown> = {}) => ({
  id: newId(),
  user: userId,
  account: accountId,
  type: "EXPENSE",
  amount: 1000,
  description: "Rent",
  date: "2026-09-02",
  ...over,
});

// One user with one account
beforeAll(async () => {
  ({ client, id: userId } = await newUser("probe_rules"));
  await client.collection("accounts").create({ id: accountId, user: userId, name: "TEB", color: "#495867", baseBalance: 0 });
});

describe("money", () => {
  it("accepts integer cents only", async () => {
    expect(await statusOf(client.collection("transactions").create(row({ amount: 1250 })))).toBe(200);
    expect(await statusOf(client.collection("transactions").create(row({ amount: 12.5 })))).toBe(400);
  });
});

describe("dates", () => {
  it("accepts YYYY-MM-DD only", async () => {
    for (const date of ["2026-9-2", "02.09.2026", "2026-09", ""]) {
      expect(await statusOf(client.collection("transactions").create(row({ date }))), date).toBe(400);
    }
  });
});

describe("labels", () => {
  it("stores a label once per type, case sensitive", async () => {
    const label = (type: string, text: string) =>
      statusOf(client.collection("descriptions").create({ user: userId, type, label: text }));
    expect(await label("EXPENSE", "Coffee")).toBe(200);
    expect(await label("EXPENSE", "Coffee")).toBe(400);
    expect(await label("EXPENSE", "coffee")).toBe(200);
    expect(await label("INCOME", "Coffee")).toBe(200);
  });
});

describe("accounts", () => {
  it("allows a name once per user", async () => {
    const duplicate = { user: userId, name: "TEB", color: "#64733a", baseBalance: 0 };
    expect(await statusOf(client.collection("accounts").create(duplicate))).toBe(400);
  });

  it("refuses to delete an account still in use", async () => {
    expect(await statusOf(client.collection("accounts").delete(accountId))).toBe(400);
    expect((await client.collection("accounts").getOne(accountId)).name).toBe("TEB");
  });
});
