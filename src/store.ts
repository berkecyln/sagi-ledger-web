import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, TransactionType } from './types';
import { getNextColor } from './utils/colors';

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
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

function ensureAccountColor(
  account: string,
  colors: Record<string, string>
): Record<string, string> {
  if (colors[account]) return colors;
  return { ...colors, [account]: getNextColor(colors) };
}

interface StoreState {
  template: Transaction[];
  months: Record<string, Transaction[]>;
  activeMonthKey: string;
  accountColors: Record<string, string>; // account name → hex color

  setActiveMonth: (key: string) => void;
  applyTemplateToMonth: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addTemplateItem: (tx: Omit<Transaction, 'id'>) => void;
  deleteTemplateItem: (id: string) => void;
  updateTemplateItem: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void;
  setAccountColor: (account: string, color: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      template: [],
      months: {},
      activeMonthKey: todayKey(),
      accountColors: {},

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
        set((s) => ({
          months: { ...s.months, [activeMonthKey]: [...current, newTx] },
          accountColors: ensureAccountColor(tx.account, accountColors),
        }));
      },

      updateTransaction: (id, updates) => {
        const { activeMonthKey, months, accountColors } = get();
        const current = months[activeMonthKey] ?? [];
        set((s) => ({
          months: {
            ...s.months,
            [activeMonthKey]: current.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          },
          accountColors: ensureAccountColor(updates.account, accountColors),
        }));
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
      },

      addTemplateItem: (tx) => {
        const { accountColors } = get();
        const newTx: Transaction = { ...tx, id: generateId(), type: tx.type as TransactionType };
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
          template: s.template.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          accountColors: updates.account
            ? ensureAccountColor(updates.account, accountColors)
            : s.accountColors,
        }));
      },

      setAccountColor: (account, color) => {
        set((s) => ({ accountColors: { ...s.accountColors, [account]: color } }));
      },
    }),
    {
      name: 'sagi-storage',
      partialize: (s) => ({ template: s.template, months: s.months, accountColors: s.accountColors }),
    }
  )
);
