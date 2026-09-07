import { create } from "zustand";
import {
  createDescription,
  createTemplateItem,
  createTransaction,
  deleteAccount as apiDeleteAccount,
  deleteDescription as apiDeleteDescription,
  deleteTemplateItem as apiDeleteTemplateItem,
  deleteTransaction as apiDeleteTransaction,
  describeError,
  ensureAccount,
  accountIdFor,
  newId,
  updateAccount,
  updateTemplateItem as apiUpdateTemplateItem,
  updateTransaction as apiUpdateTransaction,
  type HydratedState,
} from "./api";
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
  writeError: string | null;
  applying: { done: number; total: number } | null;
  offerImport: boolean;
  hasLegacy: boolean;
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
  clearWriteError: () => void;
  setOfferImport: (offer: boolean) => void;
  setHasLegacy: (present: boolean) => void;
  reset: () => void;
}

const emptyData = {
  template: [] as Transaction[],
  months: {} as Record<string, Transaction[]>,
  accountColors: {} as Record<string, string>,
  baseAccountBalances: {} as Record<string, number>,
  descriptions: { INCOME: [], EXPENSE: [] } as DescriptionLists,
};

export const useStore = create<StoreState>()((set, get) => {
  // Undo an optimistic change and show what went wrong
  const rollback = (undo: Partial<StoreState>) => (error: unknown) => {
    set({ ...undo, writeError: describeError(error) });
  };

  // Create the account row on first touch, update it afterwards
  const saveAccount = (name: string, color: string, baseBalance: number) =>
    accountIdFor(name)
      ? updateAccount(name, { color, baseBalance })
      : ensureAccount(name, color, baseBalance).then(() => undefined);

  return {
    status: "loading",
    error: null,
    writeError: null,
    applying: null,
    offerImport: false,
    hasLegacy: false,
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

    // Replaces the month, so old rows are removed before the template is written
    // Every row is a separate write, so progress is reported while it runs
    applyTemplateToMonth: () => {
      const { activeMonthKey, template, months, accountColors } = get();
      const previous = months[activeMonthKey] ?? [];
      const seeded = template.map((t) => ({
        ...t,
        id: generateId(),
        date: templateDateToFull(t.date, activeMonthKey),
      }));

      const total = previous.length + seeded.length;
      set((s) => ({
        months: { ...s.months, [activeMonthKey]: seeded },
        applying: { done: 0, total },
      }));

      const step = () =>
        set((s) => ({
          applying: s.applying
            ? { done: s.applying.done + 1, total: s.applying.total }
            : null,
        }));

      (async () => {
        for (const tx of previous) {
          await apiDeleteTransaction(tx.id);
          step();
        }
        for (const tx of seeded) {
          await createTransaction(tx, accountColors[tx.account] ?? "");
          step();
        }
      })()
        .catch(rollback({ months: { ...months, [activeMonthKey]: previous } }))
        .finally(() => set({ applying: null }));
    },

    addTransaction: (tx) => {
      const { activeMonthKey, months, accountColors } = get();
      const newTx: Transaction = { ...tx, id: generateId() };
      const current = months[activeMonthKey] ?? [];
      const colors = ensureAccountColor(tx.account, accountColors);

      set((s) => ({
        months: { ...s.months, [activeMonthKey]: [...current, newTx] },
        accountColors: colors,
      }));

      createTransaction(newTx, colors[tx.account]).catch(
        rollback({ months: { ...months, [activeMonthKey]: current } }),
      );
    },

    updateTransaction: (id, updates) => {
      const { activeMonthKey, months, accountColors } = get();
      const current = months[activeMonthKey] ?? [];
      const colors = ensureAccountColor(updates.account, accountColors);

      set((s) => ({
        months: {
          ...s.months,
          [activeMonthKey]: current.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        },
        accountColors: colors,
      }));

      apiUpdateTransaction(id, updates, colors[updates.account]).catch(
        rollback({ months: { ...months, [activeMonthKey]: current } }),
      );
    },

    deleteTransaction: (id) => {
      const { activeMonthKey, months } = get();
      const current = months[activeMonthKey] ?? [];

      set((s) => ({
        months: {
          ...s.months,
          [activeMonthKey]: current.filter((t) => t.id !== id),
        },
      }));

      apiDeleteTransaction(id).catch(
        rollback({ months: { ...months, [activeMonthKey]: current } }),
      );
    },

    addTemplateItem: (tx) => {
      const { template, accountColors } = get();
      const newTx: Transaction = { ...tx, id: generateId() };
      const colors = ensureAccountColor(tx.account, accountColors);

      set(() => ({
        template: [...template, newTx],
        accountColors: colors,
      }));

      createTemplateItem(newTx, colors[tx.account]).catch(
        rollback({ template }),
      );
    },

    deleteTemplateItem: (id) => {
      const { template } = get();

      set(() => ({ template: template.filter((t) => t.id !== id) }));

      apiDeleteTemplateItem(id).catch(rollback({ template }));
    },

    updateTemplateItem: (id, updates) => {
      const { template, accountColors } = get();
      const existing = template.find((t) => t.id === id);
      if (!existing) return;

      const merged = { ...existing, ...updates };
      const colors = updates.account
        ? ensureAccountColor(updates.account, accountColors)
        : accountColors;

      set(() => ({
        template: template.map((t) => (t.id === id ? merged : t)),
        accountColors: colors,
      }));

      apiUpdateTemplateItem(id, merged, colors[merged.account]).catch(
        rollback({ template }),
      );
    },

    setAccountColor: (account, color) => {
      const { accountColors, baseAccountBalances } = get();

      set((s) => ({
        accountColors: { ...s.accountColors, [account]: color },
      }));

      saveAccount(account, color, baseAccountBalances[account] ?? 0).catch(
        rollback({ accountColors }),
      );
    },

    setBaseAccountBalance: (account, amount) => {
      const { accountColors, baseAccountBalances } = get();
      const colors = ensureAccountColor(account, accountColors);

      set((s) => ({
        accountColors: colors,
        baseAccountBalances: { ...s.baseAccountBalances, [account]: amount },
      }));

      saveAccount(account, colors[account], amount).catch(
        rollback({ accountColors, baseAccountBalances }),
      );
    },

    // Delete account, blocked while any transaction or template item still uses it
    deleteAccount: (account) => {
      const { months, template, accountColors, baseAccountBalances } = get();
      if (isAccountInUse(account, months, template)) return;

      set((s) => {
        const colors = { ...s.accountColors };
        const balances = { ...s.baseAccountBalances };
        delete colors[account];
        delete balances[account];
        return { accountColors: colors, baseAccountBalances: balances };
      });

      apiDeleteAccount(account).catch(
        rollback({ accountColors, baseAccountBalances }),
      );
    },

    // Add label to the suggestion list of its type
    addDescription: (type, label) => {
      const clean = label.trim();
      if (!clean) return;

      const { descriptions } = get();
      if (descriptions[type].includes(clean)) return;

      set((s) => ({
        descriptions: {
          ...s.descriptions,
          [type]: [...s.descriptions[type], clean].sort(),
        },
      }));

      createDescription(type, clean).catch(rollback({ descriptions }));
    },

    // Removes the label from the suggestion list only, transactions keep descriptions intact.
    deleteDescription: (type, label) => {
      const { descriptions } = get();

      set((s) => ({
        descriptions: {
          ...s.descriptions,
          [type]: s.descriptions[type].filter((d) => d !== label),
        },
      }));

      apiDeleteDescription(type, label).catch(rollback({ descriptions }));
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
        writeError: null,
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

    // Dismiss the write error banner
    clearWriteError: () => {
      set({ writeError: null });
    },

    // Show or hide the one time import offer
    setOfferImport: (offer) => {
      set({ offerImport: offer });
    },

    // Whether this browser still holds a pre-server ledger
    setHasLegacy: (present) => {
      set({ hasLegacy: present });
    },

    // Clear the data held for the previous user
    reset: () => {
      set({
        status: "loading",
        error: null,
        writeError: null,
        applying: null,
        offerImport: false,
        hasLegacy: false,
        ...emptyData,
      });
    },
  };
});
