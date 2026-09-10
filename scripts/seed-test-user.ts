/**
 * Seed the UI test user
 *
 * Signs in as the test user, wipes its data and writes a fresh demo ledger.
 *
 * Seeded data:
 *    accounts (TEB and Sparkasse, with base balances)
 *    labels (income and expense suggestion lists)
 *    template (recurring items, including a zero amount and a day 31 item)
 *    months (the current month and the two before it)
 *
 */

import { existsSync } from "node:fs";
import {
  createDescription,
  createTemplateItem,
  createTransaction,
  currentUser,
  ensureAccount,
  loadAll,
  login,
  newId,
  pb,
  resetAccountCache,
  signup,
} from "../src/api";
import { templateDateToFull } from "../src/store";
import { ACCOUNT_PALETTE } from "../src/utils/colors";
import type { TransactionType } from "../src/types";

// type, cents, description, account, day of month
type Row = [TransactionType, number, string, string, string];

interface Config {
  inviteCode: string;
  user: string;
  password: string;
}

const ACCOUNTS: Record<string, { color: string; base: number }> = {
  TEB: { color: ACCOUNT_PALETTE[0], base: 45000 },
  Sparkasse: { color: ACCOUNT_PALETTE[1], base: 210000 },
};

const LABELS: Record<TransactionType, string[]> = {
  INCOME: ["Salary", "Family"],
  EXPENSE: [
    "Rent", "Internet", "Phone", "Gym", "Savings", "Rundfunkbeitrag",
    "Groceries", "Coffee", "Transport", "Restaurant",
  ],
};

const TEMPLATE: Row[] = [
  ["INCOME", 250000, "Salary", "TEB", "1"],
  ["EXPENSE", 90000, "Rent", "Sparkasse", "2"],
  ["EXPENSE", 3999, "Internet", "Sparkasse", "3"],
  ["EXPENSE", 1500, "Phone", "TEB", "5"],
  ["EXPENSE", 2990, "Gym", "TEB", "5"],
  ["EXPENSE", 0, "Rundfunkbeitrag", "Sparkasse", "15"],
  ["EXPENSE", 50000, "Savings", "TEB", "31"],
];

// Day to day rows added to every seeded month
const VARIABLE: Row[] = [
  ["EXPENSE", 2145, "Groceries", "TEB", "4"],
  ["EXPENSE", 450, "Coffee", "TEB", "6"],
  ["EXPENSE", 5630, "Groceries", "Sparkasse", "9"],
  ["EXPENSE", 1299, "Transport", "TEB", "12"],
  ["INCOME", 15000, "Family", "Sparkasse", "14"],
  ["EXPENSE", 7800, "Restaurant", "TEB", "17"],
  ["EXPENSE", 380, "Coffee", "TEB", "21"],
  ["EXPENSE", 3410, "Groceries", "TEB", "24"],
];

// Load .env.local and return the required values
function readConfig(): Config {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const { SAGI_INVITE_CODE, SAGI_TEST_USER, SAGI_TEST_PASSWORD } = process.env;
  if (!SAGI_INVITE_CODE || !SAGI_TEST_USER || !SAGI_TEST_PASSWORD) {
    throw new Error("SAGI_ values are missing, copy .env.example to .env.local and fill it in.");
  }
  return { inviteCode: SAGI_INVITE_CODE, user: SAGI_TEST_USER, password: SAGI_TEST_PASSWORD };
}

// Return the YYYY-MM key offset from the current month
function monthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Sign in, creating the test user on the first run
async function signIn({ inviteCode, user, password }: Config) {
  try {
    await login(user, password);
  } catch {
    await signup(user, password, inviteCode);
  }
  if (currentUser()?.username !== user) {
    throw new Error(`Signed in as ${currentUser()?.username}, refusing to wipe it.`);
  }
}

// Delete every row the test user owns
async function wipe() {
  for (const name of ["transactions", "template_items", "descriptions", "accounts"]) {
    const rows = await pb.collection(name).getFullList();
    for (let i = 0; i < rows.length; i += 10) {
      await Promise.all(rows.slice(i, i + 10).map((r) => pb.collection(name).delete(r.id)));
    }
  }
  // Cached account ids point at the deleted rows
  resetAccountCache();
}

// Write accounts, labels, template and three months of rows
async function seed() {
  for (const [name, { color, base }] of Object.entries(ACCOUNTS)) {
    await ensureAccount(name, color, base);
  }

  const types = Object.keys(LABELS) as TransactionType[];
  await Promise.all(
    types.flatMap((type) => LABELS[type].map((label) => createDescription(type, label))),
  );

  await Promise.all(
    TEMPLATE.map(([type, amount, description, account, day]) =>
      createTemplateItem(
        { id: newId(), type, amount, description, account, date: day },
        ACCOUNTS[account].color,
      ),
    ),
  );

  const months = [monthKey(-2), monthKey(-1), monthKey(0)];
  await Promise.all(
    months.flatMap((key) =>
      [...TEMPLATE, ...VARIABLE].map(([type, amount, description, account, day]) =>
        createTransaction(
          { id: newId(), type, amount, description, account, date: templateDateToFull(day, key) },
          ACCOUNTS[account].color,
        ),
      ),
    ),
  );
}

async function main() {
  const config = readConfig();
  await signIn(config);
  console.log(`Signed in as ${config.user}, wiping...`);
  await wipe();

  console.log("Seeding, the write throttle makes this take about 20 seconds...");
  await seed();

  const state = await loadAll();
  console.log(`Months: ${Object.keys(state.months).sort().join(", ")}`);
  console.log(`Transactions: ${Object.values(state.months).flat().length}`);
  console.log(`Template items: ${state.template.length}`);
  console.log(`\nSign in as ${config.user}, password in .env.local`);
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
