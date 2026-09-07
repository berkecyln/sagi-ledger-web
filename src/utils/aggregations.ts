import type { Transaction } from '../types';

export function aggregateByDescription(txs: Transaction[]): { description: string; total: number }[] {
  const map = new Map<string, number>();
  for (const tx of txs) {
    map.set(tx.description, (map.get(tx.description) ?? 0) + tx.amount);
  }
  return Array.from(map.entries()).map(([description, total]) => ({ description, total }));
}

export function aggregateByDescriptionWithAccounts(
  txs: Transaction[]
): { description: string; total: number; accounts: string[] }[] {
  const map = new Map<string, { total: number; accounts: Set<string> }>();
  for (const tx of txs) {
    const entry = map.get(tx.description) ?? { total: 0, accounts: new Set() };
    entry.total += tx.amount;
    entry.accounts.add(tx.account);
    map.set(tx.description, entry);
  }
  return Array.from(map.entries()).map(([description, v]) => ({
    description,
    total: v.total,
    accounts: Array.from(v.accounts),
  }));
}

export function aggregateByDescriptionAndAccount(
  txs: Transaction[]
): { description: string; account: string; total: number }[] {
  const map = new Map<string, number>();
  for (const tx of txs) {
    const key = `${tx.description}\0${tx.account}`;
    map.set(key, (map.get(key) ?? 0) + tx.amount);
  }
  return Array.from(map.entries()).map(([key, total]) => {
    const [description, account] = key.split('\0');
    return { description, account, total };
  });
}

export function aggregateByAccount(
  txs: Transaction[]
): { account: string; income: number; expense: number }[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of txs) {
    const entry = map.get(tx.account) ?? { income: 0, expense: 0 };
    if (tx.type === 'INCOME') entry.income += tx.amount;
    else entry.expense += tx.amount;
    map.set(tx.account, entry);
  }
  return Array.from(map.entries()).map(([account, v]) => ({ account, ...v }));
}

export function getAllTimeBalanceByAccount(
  months: Record<string, Transaction[]>
): { account: string; income: number; expense: number; balance: number; pctSpent: number }[] {
  const all = Object.values(months).flat();
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of all) {
    const entry = map.get(tx.account) ?? { income: 0, expense: 0 };
    if (tx.type === 'INCOME') entry.income += tx.amount;
    else entry.expense += tx.amount;
    map.set(tx.account, entry);
  }
  return Array.from(map.entries()).map(([account, v]) => ({
    account,
    income: v.income,
    expense: v.expense,
    balance: v.income - v.expense,
    pctSpent: v.income > 0 ? (v.expense / v.income) * 100 : 0,
  }));
}

export function getUniqueDescriptions(months: Record<string, Transaction[]>): string[] {
  const all = Object.values(months).flat();
  return [...new Set(all.map((t) => t.description))].filter(Boolean).sort();
}

export function getUniqueAccounts(months: Record<string, Transaction[]>): string[] {
  const all = Object.values(months).flat();
  return [...new Set(all.map((t) => t.account))].filter(Boolean).sort();
}

// Account referenced by any transaction or template item
export function isAccountInUse(
  account: string,
  months: Record<string, Transaction[]>,
  template: Transaction[]
): boolean {
  const all = [...Object.values(months).flat(), ...template];
  return all.some((t) => t.account === account);
}

// Amounts are integer cents
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount / 100);
}
