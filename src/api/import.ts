/**
 * One time import from LocalStorage
 *
 * Moves the pre-server ledger onto the backend, once, and never runs twice
 * over the same rows.
 *
 * Legacy blob (localStorage key "sagi-storage"):
 *    version (2 for euro floats, 3 for integer cents)
 *    state.months (transactions keyed by YYYY-MM)
 *    state.template (recurring items, day of month in the date field)
 *    state.accountColors (hex colour per account name)
 *    state.baseAccountBalances (starting balance per account name)
 *    state.descriptions (suggestion labels per type)
 *
 */

import { createDescription } from "./descriptions";
import { createTemplateItem } from "./templateItems";
import { createTransaction } from "./transactions";
import { ensureAccount } from "./accounts";
import { loadAll } from "./loadAll";
import type { Transaction, TransactionType } from "../types";

export const LEGACY_KEY = "sagi-storage";

// Version 3 already stores integer cents, anything older stores euro floats
const CENTS_VERSION = 3;

interface LegacyState {
  months?: Record<string, Transaction[]>;
  template?: Transaction[];
  accountColors?: Record<string, string>;
  baseAccountBalances?: Record<string, number>;
  descriptions?: string[] | Record<TransactionType, string[]>;
}

export interface LegacyBlob {
  version: number;
  state: LegacyState;
}

export interface ImportPlan {
  accounts: string[];
  descriptions: number;
  templateItems: number;
  transactions: number;
  total: number;
  toCents: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  transactions: number;
  templateItems: number;
  accounts: number;
  descriptions: number;
}

// Derive a stable server id from a legacy one, so re-running skips what exists
export function legacyId(id: string): string {
  const stripped = id.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return stripped.slice(0, 15).padEnd(15, "0");
}

// Check for the blob without parsing it
export function hasLegacyBlob(): boolean {
  return localStorage.getItem(LEGACY_KEY) !== null;
}

// Read and parse the blob left by the pre-server app
export function readLegacyBlob(): LegacyBlob | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LegacyBlob>;
    if (!parsed || typeof parsed !== "object" || !parsed.state) return null;
    return { version: parsed.version ?? 0, state: parsed.state };
  } catch {
    return null;
  }
}

const TYPES: TransactionType[] = ["INCOME", "EXPENSE"];

// Flatten the two description shapes the app has used
function legacyDescriptions(
  state: LegacyState,
): { type: TransactionType; label: string }[] {
  const source = state.descriptions;

  // A curated list per type, take it as it stands
  if (source && !Array.isArray(source)) {
    return TYPES.flatMap((type) =>
      (source[type] ?? []).map((label) => ({ type, label })),
    );
  }

  // One untyped list, rebuilt the way the app's own migration did
  const lists: Record<TransactionType, string[]> = { INCOME: [], EXPENSE: [] };
  const all = [
    ...Object.values(state.months ?? {}).flat(),
    ...(state.template ?? []),
  ];

  // Labels in use, grouped by the type they were used with
  for (const tx of all) {
    const label = tx.description?.trim();
    if (label && !lists[tx.type].includes(label)) lists[tx.type].push(label);
  }

  // Labels created but never used carry no type, so keep them on both sides
  for (const raw of source ?? []) {
    const label = raw.trim();
    if (!label) continue;
    if (!lists.INCOME.includes(label) && !lists.EXPENSE.includes(label)) {
      lists.INCOME.push(label);
      lists.EXPENSE.push(label);
    }
  }

  return TYPES.flatMap((type) => lists[type].map((label) => ({ type, label })));
}

// Every account named anywhere in the blob
function legacyAccounts(state: LegacyState): string[] {
  const names = new Set(Object.keys(state.accountColors ?? {}));
  for (const tx of Object.values(state.months ?? {}).flat()) names.add(tx.account);
  for (const item of state.template ?? []) names.add(item.account);
  return [...names].filter(Boolean);
}

// Count what an import would write, without writing anything
export function planImport(blob: LegacyBlob): ImportPlan {
  const transactions = Object.values(blob.state.months ?? {}).flat().length;
  const templateItems = (blob.state.template ?? []).length;
  const accounts = legacyAccounts(blob.state);
  const descriptions = legacyDescriptions(blob.state).length;
  return {
    accounts,
    descriptions,
    templateItems,
    transactions,
    total: accounts.length + descriptions + templateItems + transactions,
    toCents: blob.version < CENTS_VERSION,
  };
}

// Write the blob to the server, skipping anything already there
export async function runImport(
  blob: LegacyBlob,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const plan = planImport(blob);
  const amount = (value: number) => (plan.toCents ? Math.round(value * 100) : value);

  // Two source rows deriving to one id would silently drop a row
  const rows = [
    ...Object.values(blob.state.months ?? {}).flat(),
    ...(blob.state.template ?? []),
  ];
  const derived = new Map<string, string>();
  for (const row of rows) {
    const id = legacyId(row.id);
    const clash = derived.get(id);
    if (clash && clash !== row.id) {
      throw new Error(
        `Two records share the derived id ${id} (${clash} and ${row.id}). Nothing was imported.`,
      );
    }
    derived.set(id, row.id);
  }

  // What the server already holds, so a re-run is safe
  const server = await loadAll();
  const haveAccount = new Set(Object.keys(server.accountColors));
  const haveLabel = new Set(
    TYPES.flatMap((type) =>
      server.descriptions[type].map((label) => `${type}|${label}`),
    ),
  );
  const haveTransaction = new Set(
    Object.values(server.months).flat().map((tx) => tx.id),
  );
  const haveTemplate = new Set(server.template.map((item) => item.id));

  const result: ImportResult = {
    created: 0, skipped: 0, transactions: 0, templateItems: 0, accounts: 0, descriptions: 0,
  };
  let done = 0;
  const step = (created: boolean, bucket?: keyof ImportResult) => {
    done += 1;
    if (created) {
      result.created += 1;
      if (bucket) result[bucket] += 1;
    } else {
      result.skipped += 1;
    }
    onProgress?.(done, plan.total);
  };

  // Accounts first, transactions reference them
  const colors = blob.state.accountColors ?? {};
  const balances = blob.state.baseAccountBalances ?? {};
  for (const name of plan.accounts) {
    if (haveAccount.has(name)) {
      step(false);
      continue;
    }
    await ensureAccount(name, colors[name] ?? "#495867", amount(balances[name] ?? 0));
    step(true, "accounts");
  }

  for (const { type, label } of legacyDescriptions(blob.state)) {
    if (haveLabel.has(`${type}|${label}`)) {
      step(false);
      continue;
    }
    haveLabel.add(`${type}|${label}`);
    await createDescription(type, label);
    step(true, "descriptions");
  }

  for (const item of blob.state.template ?? []) {
    const id = legacyId(item.id);
    if (haveTemplate.has(id)) {
      step(false);
      continue;
    }
    await createTemplateItem(
      { ...item, id, amount: amount(item.amount) },
      colors[item.account] ?? "#495867",
    );
    step(true, "templateItems");
  }

  for (const tx of Object.values(blob.state.months ?? {}).flat()) {
    const id = legacyId(tx.id);
    if (haveTransaction.has(id)) {
      step(false);
      continue;
    }
    await createTransaction(
      { ...tx, id, amount: amount(tx.amount) },
      colors[tx.account] ?? "#495867",
    );
    step(true, "transactions");
  }

  return result;
}

// Save the blob to a file before it is cleared
export function downloadLegacyBackup(blob: LegacyBlob): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(blob)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `sagi-storage-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Remove the blob, only after the server copy is verified
export function clearLegacyBlob(): void {
  localStorage.removeItem(LEGACY_KEY);
}
