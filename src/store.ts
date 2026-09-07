import { create } from "zustand";
import { newId, type HydratedState } from "./api";
import type { Transaction, TransactionType } from "./types";
import { getNextColor } from "./utils/colors";
import { isAccountInUse } from "./utils/aggregations";

function todayKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function generateId(): string {
  return newId();
}

function templateDateToFull(templateDate: string, monthKey: string): string {
  const requested = /^\d{1,2}$/.test(templateDate.trim())
    ? parseInt(templateDate)
    : 1;
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.min(Math.max(requested, 1), daysInMonth);
  return `${monthKey}-${String(day).padStart(2, "0")}`;
}

function ensureAccountColor(
  account: string,
  colors: Record<string, string>,
): Record<string, string> {
  if (colors[account]) return colors;
  return { ...colors, [account]: getNextColor(colors) };
}

type DescriptionLists = Record<TransactionType, string[]>;

type LoadStatus = "loading" | "ready" | "error";

interface StoreState {
  status: LoadStatus;
  error: string | null;
  template: Transaction[];
  months: Record<string, Transaction[]>;
  activeMonthKey: string;
  accountColors: Record<string, string>; // account name → hex color
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

  startLoading: () => void;
  hydrate: (data: HydratedState) => void;
  failLoading: (message: string) => void;
  reset: () => void;
}

const emptyData = {
  template: [] as Transaction[],
  months: {} as Record<string, Transaction[]>,
  accountColors: {} as Record<string, string>,
  baseAccountBalances: {} as Record<string, number>,
  descriptions: { INCOME: [], EXPENSE: [] } as DescriptionLists,
};

export const useStore = create<StoreState>()((set, get) => ({
  status: "loading",
  error: null,
  template: [],
  months: {},
  activeMonthKey: todayKey(),
  accountColors: {},
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

      return { accountColors, baseAccountBalances };
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

  // Mark a fetch as running
  startLoading: () => {
    set({ status: "loading", error: null });
  },

  // Replace every slice with what the server returned
  hydrate: (data) => {
    set({
      status: "ready",
      error: null,
      template: data.template,
      months: data.months,
      accountColors: data.accountColors,
      baseAccountBalances: data.baseAccountBalances,
      descriptions: data.descriptions,
    });
  },

  // Mark a fetch as failed
  failLoading: (message) => {
    set({ status: "error", error: message });
  },

  // Clear the data held for the previous user
  reset: () => {
    set({ status: "loading", error: null, ...emptyData });
  },
}));
