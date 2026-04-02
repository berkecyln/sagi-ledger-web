import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../store';
import { getUniqueAccounts, getUniqueDescriptions } from '../utils/aggregations';
import { ACCOUNT_PALETTE } from '../utils/colors';
import CreatableSelect from './CreatableSelect';
import type { Transaction, TransactionType } from '../types';

interface Props {
  type: TransactionType;
  onClose: () => void;
  editTransaction?: Transaction;
  isTemplate?: boolean;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionModal({ type, onClose, editTransaction, isTemplate = false }: Props) {
  const { months, accountColors, setAccountColor, addTransaction, updateTransaction, addTemplateItem, updateTemplateItem } = useStore();

  const isEdit = !!editTransaction;

  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
  const [date, setDate] = useState(editTransaction?.date ?? todayStr());
  const [templateDay, setTemplateDay] = useState(isTemplate && editTransaction ? editTransaction.date : '');
  const [description, setDescription] = useState(editTransaction?.description ?? '');
  const [account, setAccount] = useState(editTransaction?.account ?? '');

  const allDescriptions = getUniqueDescriptions(months);
  const allAccounts = getUniqueAccounts(months);

  const currentColor = account ? accountColors[account] : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description || !account) return;

    if (isTemplate) {
      const data = { type, amount: parseFloat(amount), description, account, date: templateDay };
      isEdit && editTransaction ? updateTemplateItem(editTransaction.id, data) : addTemplateItem(data);
    } else {
      const data = { type, amount: parseFloat(amount), description, account, date };
      isEdit && editTransaction ? updateTransaction(editTransaction.id, data) : addTransaction(data);
    }
    onClose();
  }

  const typeLabel = type === 'INCOME' ? 'Income' : 'Expense';
  const headerClass = type === 'INCOME'
    ? 'bg-income-surface text-income border-b border-income-stroke'
    : 'bg-expense-surface text-expense border-b border-expense-stroke';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card rounded-lg w-full max-w-md border border-stroke shadow-lg">
        <div className={`flex items-center justify-between px-5 py-4 rounded-t-lg ${headerClass}`}>
          <h2 className="font-semibold text-base">
            {isEdit ? `Edit ${typeLabel}${isTemplate ? ' (Template)' : ''}` : isTemplate ? `Add ${typeLabel} to Template` : `Add ${typeLabel}`}
          </h2>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity"><X size={18} /></button>
        </div>

        <form autoComplete="off" onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-xs font-medium text-ink-muted mb-1">Amount (€)</label>
            <input
              id="amount" type="number" step="0.01" min="0" required autoComplete="off"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-subtle border border-stroke rounded px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent"
              placeholder="0.00" autoFocus
            />
          </div>

          {!isTemplate ? (
            <div>
              <label htmlFor="date" className="block text-xs font-medium text-ink-muted mb-1">Date</label>
              <input
                id="date" type="date" required autoComplete="off" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-subtle border border-stroke rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="templateDay" className="block text-xs font-medium text-ink-muted mb-1">
                Day of month <span className="text-ink-ghost">(optional, 1–28)</span>
              </label>
              <input
                id="templateDay" type="number" min="1" max="28" autoComplete="off"
                value={templateDay} onChange={(e) => setTemplateDay(e.target.value)}
                className="w-full bg-subtle border border-stroke rounded px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent"
                placeholder="Leave blank for 1st of month"
              />
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-ink-muted mb-1">Description</label>
            <CreatableSelect id="description" value={description} onChange={setDescription} options={allDescriptions} placeholder="e.g. Salary, Rent, Groceries" />
          </div>

          <div>
            <label htmlFor="account" className="block text-xs font-medium text-ink-muted mb-1">Account</label>
            <CreatableSelect id="account" value={account} onChange={setAccount} options={allAccounts} placeholder="e.g. Sparkasse, TEB" />

            {account && (
              <div className="mt-2">
                <div className="text-xs text-ink-faint mb-1.5">Account color</div>
                <div className="flex gap-1.5 flex-wrap">
                  {ACCOUNT_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccountColor(account, color)}
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
                      style={{ backgroundColor: color, boxShadow: currentColor === color ? `0 0 0 2px var(--card), 0 0 0 3px ${color}` : undefined }}
                      title={color}
                    >
                      {currentColor === color && <Check size={10} className="text-white font-bold" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-stroke text-ink-muted hover:bg-thead transition-colors">
              Cancel
            </button>
            <button type="submit" className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
              type === 'INCOME'
                ? 'bg-income-btn text-income hover:bg-income-btn-hover'
                : 'bg-expense-btn text-expense hover:bg-expense-btn-hover'
            }`}>
              {isEdit ? 'Save Changes' : `Add ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
