import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, TransactionType } from "./types";
import { getNextColor } from "./utils/colors";

function todayKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function generateId(): string {
  return crypto.randomUUID();
}

function templateDateToFull(templateDate: string, monthKey: string): string {
  const day = /^\d{1,2}$/.test(templateDate.trim())
    ? Math.min(Math.max(parseInt(templateDate), 1), 28)
    : 1;
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}

function ensureAccountColor(
  account: string,
  colors: Record<string, string>,
): Record<string, string> {
  if (colors[account]) return colors;
  return { ...colors, [account]: getNextColor(colors) };
}

function recalculateMonthlyBalances(
  transactions: Transaction[],
): Record<string, number> {
  const monthlyBalances: Record<string, number> = {};
  for (const tx of transactions) {
    monthlyBalances[tx.account] =
      (monthlyBalances[tx.account] ?? 0) +
      (tx.type === "INCOME" ? tx.amount : -tx.amount);
  }
  return monthlyBalances;
}

interface StoreState {
  template: Transaction[];
  months: Record<string, Transaction[]>;
  activeMonthKey: string;
  accountColors: Record<string, string>; // account name → hex color
  monthlyBalances: Record<string, Record<string, number>>;
  baseAccountBalances: Record<string, number>;

  setActiveMonth: (key: string) => void;
  applyTemplateToMonth: () => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  addTemplateItem: (tx: Omit<Transaction, "id">) => void;
  deleteTemplateItem: (id: string) => void;
  updateTemplateItem: (
    id: string,
    updates: Partial<Omit<Transaction, "id">>,
  ) => void;
  setAccountColor: (account: string, color: string) => void;
  setBaseAccountBalance: (account: string, amount: number) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      template: [],
      months: {},
      activeMonthKey: todayKey(),
      accountColors: {},
      monthlyBalances: {},
      baseAccountBalances: {},

      setActiveMonth: (key) => {
        set((s) => ({
          activeMonthKey: key,
          months: s.months[key] ? s.months : { ...s.months, [key]: [] },
        }));
      },

      applyTemplateToMonth: () => {
        const { activeMonthKey, template } = get();
        const seeded = template.map((t) => ({
          ...t,
          id: generateId(),
          date: templateDateToFull(t.date, activeMonthKey),
        }));
        set((s) => ({
          months: { ...s.months, [activeMonthKey]: seeded },
          monthlyBalances: {
            ...s.monthlyBalances,
            [activeMonthKey]: recalculateMonthlyBalances(seeded),
          },
        }));
      },

      addTransaction: (tx) => {
        const { activeMonthKey, months, accountColors } = get();
        const newTx: Transaction = { ...tx, id: generateId() };
        const current = months[activeMonthKey] ?? [];
        const updatedTransactions = [...current, newTx];
        set((s) => ({
          months: { ...s.months, [activeMonthKey]: updatedTransactions },
          accountColors: ensureAccountColor(tx.account, accountColors),
          monthlyBalances: {
            ...s.monthlyBalances,
            [activeMonthKey]: recalculateMonthlyBalances(updatedTransactions),
          },
        }));
      },

      updateTransaction: (id, updates) => {
        const { activeMonthKey, months, accountColors } = get();
        const current = months[activeMonthKey] ?? [];
        const updatedTransactions = current.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        );
        set((s) => ({
          months: {
            ...s.months,
            [activeMonthKey]: updatedTransactions,
          },
          accountColors: ensureAccountColor(updates.account, accountColors),
          monthlyBalances: {
            ...s.monthlyBalances,
            [activeMonthKey]: recalculateMonthlyBalances(updatedTransactions),
          },
        }));
      },

      deleteTransaction: (id) => {
        const { activeMonthKey, months } = get();
        const current = months[activeMonthKey] ?? [];
        const updatedTransactions = current.filter((t) => t.id !== id);
        set((s) => ({
          months: {
            ...s.months,
            [activeMonthKey]: updatedTransactions,
          },
          monthlyBalances: {
            ...s.monthlyBalances,
            [activeMonthKey]: recalculateMonthlyBalances(updatedTransactions),
          },
        }));
      },

      addTemplateItem: (tx) => {
        const { accountColors } = get();
        const newTx: Transaction = {
          ...tx,
          id: generateId(),
          type: tx.type as TransactionType,
        };
        set((s) => ({
          template: [...s.template, newTx],
          accountColors: ensureAccountColor(tx.account, accountColors),
        }));
      },

      deleteTemplateItem: (id) => {
        set((s) => ({ template: s.template.filter((t) => t.id !== id) }));
      },

      updateTemplateItem: (id, updates) => {
        const { accountColors } = get();
        set((s) => ({
          template: s.template.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
          accountColors: updates.account
            ? ensureAccountColor(updates.account, accountColors)
            : s.accountColors,
        }));
      },

      setAccountColor: (account, color) => {
        set((s) => ({
          accountColors: { ...s.accountColors, [account]: color },
        }));
      },

      setBaseAccountBalance: (account, amount) => {
        set((s) => ({
          baseAccountBalances: { ...s.baseAccountBalances, [account]: amount },
        }));
      },
    }),
    {
      name: "sagi-storage",
      partialize: (s) => ({
        template: s.template,
        months: s.months,
        accountColors: s.accountColors,
        monthlyBalances: s.monthlyBalances,
        baseAccountBalances: s.baseAccountBalances,
      }),
    },
  ),
);
