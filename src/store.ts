import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, TransactionType } from "./types";
import { getNextColor } from "./utils/colors";
import { isAccountInUse } from "./utils/aggregations";

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

type DescriptionLists = Record<TransactionType, string[]>;

type PersistedState = {
  template?: Transaction[];
  months?: Record<string, Transaction[]>;
  descriptions?: string[] | DescriptionLists;
};

// Description list migration from old logic
function collectDescriptions(
  state: PersistedState,
  legacy: string[],
): DescriptionLists {
  const lists: DescriptionLists = { INCOME: [], EXPENSE: [] };
  const all = [
    ...Object.values(state.months ?? {}).flat(),
    ...(state.template ?? []),
  ];

  // Labels in use, grouped by type
  for (const tx of all) {
    const label = tx.description?.trim();
    if (label && !lists[tx.type].includes(label)) lists[tx.type].push(label);
  }

  // Untyped labels from the old flat list
  for (const label of legacy) {
    const clean = label.trim();
    if (!clean) continue;
    if (!lists.INCOME.includes(clean) && !lists.EXPENSE.includes(clean)) {
      lists.INCOME.push(clean);
      lists.EXPENSE.push(clean);
    }
  }

  lists.INCOME.sort();
  lists.EXPENSE.sort();
  return lists;
}

interface StoreState {
  template: Transaction[];
  months: Record<string, Transaction[]>;
  activeMonthKey: string;
  accountColors: Record<string, string>; // account name → hex color
  monthlyBalances: Record<string, Record<string, number>>;
  baseAccountBalances: Record<string, number>;
  descriptions: DescriptionLists; // user-curated labels per type, only grow on explicit create

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
  deleteAccount: (account: string) => void;
  addDescription: (type: TransactionType, label: string) => void;
  deleteDescription: (type: TransactionType, label: string) => void;
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
      descriptions: { INCOME: [], EXPENSE: [] },

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

      // Delete account, blocked while any transaction or template item still uses it
      deleteAccount: (account) => {
        const { months, template } = get();
        if (isAccountInUse(account, months, template)) return;

        set((s) => {
          const accountColors = { ...s.accountColors };
          const baseAccountBalances = { ...s.baseAccountBalances };
          delete accountColors[account];
          delete baseAccountBalances[account];

          // Drop stale cache entries so no chip survives in the footer
          const monthlyBalances: Record<string, Record<string, number>> = {};
          for (const [key, balances] of Object.entries(s.monthlyBalances)) {
            const month = { ...balances };
            delete month[account];
            monthlyBalances[key] = month;
          }

          return { accountColors, baseAccountBalances, monthlyBalances };
        });
      },

      // Add label to the suggestion list of its type
      addDescription: (type, label) => {
        const clean = label.trim();
        if (!clean) return;
        set((s) =>
          s.descriptions[type].includes(clean)
            ? s
            : {
                descriptions: {
                  ...s.descriptions,
                  [type]: [...s.descriptions[type], clean].sort(),
                },
              },
        );
      },

      // Removes the label from the suggestion list only, transactions keep descriptions intact.
      deleteDescription: (type, label) => {
        set((s) => ({
          descriptions: {
            ...s.descriptions,
            [type]: s.descriptions[type].filter((d) => d !== label),
          },
        }));
      },
    }),
    {
      name: "sagi-storage",
      version: 2,
      partialize: (s) => ({
        template: s.template,
        months: s.months,
        accountColors: s.accountColors,
        monthlyBalances: s.monthlyBalances,
        baseAccountBalances: s.baseAccountBalances,
        descriptions: s.descriptions,
      }),
      // migrattion starter for the descriptions list
      migrate: (persisted, version) => {
        const state = persisted as PersistedState;
        if (version < 2) {
          const legacy = Array.isArray(state.descriptions)
            ? state.descriptions
            : [];
          state.descriptions = collectDescriptions(state, legacy);
        }
        return state;
      },
    },
  ),
);
