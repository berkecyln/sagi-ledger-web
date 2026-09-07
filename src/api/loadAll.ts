/**
 * Full read
 *
 * One fetch of everything belonging to the signed in user, shaped for the store.
 *
 * Returns:
 *    months (transactions grouped by YYYY-MM, derived from date)
 *    template (recurring items, day of month in the date field)
 *    accountColors (hex colour per account name)
 *    baseAccountBalances (starting balance in cents per account name)
 *    descriptions (suggestion labels, one list per type)
 *
 */

import { pb } from "./client";
import { cacheAccounts, fetchAccounts } from "./accounts";
import { dayToDate } from "./templateItems";
import type { Transaction, TransactionType } from "../types";
import type { DescriptionRecord, TemplateItemRecord, TransactionRecord } from "./types";

export interface HydratedState {
  months: Record<string, Transaction[]>;
  template: Transaction[];
  accountColors: Record<string, string>;
  baseAccountBalances: Record<string, number>;
  descriptions: Record<TransactionType, string[]>;
}

// Return an empty state
export function emptyState(): HydratedState {
  return {
    months: {},
    template: [],
    accountColors: {},
    baseAccountBalances: {},
    descriptions: { INCOME: [], EXPENSE: [] },
  };
}

// Check whether the user has no data on the server
export function isEmpty(state: HydratedState): boolean {
  return (
    Object.keys(state.accountColors).length === 0 &&
    state.template.length === 0 &&
    state.descriptions.INCOME.length === 0 &&
    state.descriptions.EXPENSE.length === 0 &&
    Object.values(state.months).every((txs) => txs.length === 0)
  );
}

// Fetch every collection and shape it for the store
export async function loadAll(): Promise<HydratedState> {
  const [accounts, descriptions, transactions, templateItems] = await Promise.all([
    fetchAccounts(),
    pb.collection("descriptions").getFullList<DescriptionRecord>({ sort: "label" }),
    pb.collection("transactions").getFullList<TransactionRecord>({ sort: "date" }),
    pb.collection("template_items").getFullList<TemplateItemRecord>(),
  ]);

  // Seed the name to id map
  cacheAccounts(accounts);

  // Build the colour and balance maps
  const accountColors: Record<string, string> = {};
  const baseAccountBalances: Record<string, number> = {};
  const nameById = new Map<string, string>();
  for (const account of accounts) {
    accountColors[account.name] = account.color;
    baseAccountBalances[account.name] = account.baseBalance;
    nameById.set(account.id, account.name);
  }

  // An unknown relation id shows as itself
  const accountName = (id: string) => nameById.get(id) ?? id;

  // Group transactions by month key from the date
  const months: Record<string, Transaction[]> = {};
  for (const record of transactions) {
    const monthKey = record.date.slice(0, 7);
    (months[monthKey] ??= []).push({
      id: record.id,
      type: record.type,
      amount: record.amount,
      description: record.description,
      account: accountName(record.account),
      date: record.date,
    });
  }

  // Map template items, day number to date field
  const template: Transaction[] = templateItems.map((record) => ({
    id: record.id,
    type: record.type,
    amount: record.amount,
    description: record.description,
    account: accountName(record.account),
    date: dayToDate(record.day),
  }));

  // Split labels by type and sort
  const labels: Record<TransactionType, string[]> = { INCOME: [], EXPENSE: [] };
  for (const record of descriptions) labels[record.type].push(record.label);
  labels.INCOME.sort();
  labels.EXPENSE.sort();

  return { months, template, accountColors, baseAccountBalances, descriptions: labels };
}
