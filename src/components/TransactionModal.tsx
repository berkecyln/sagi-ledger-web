/**
 * Transaction modal
 *
 * Screen to add/edit income or expense transactions, or template items.
 * On phones, this is a full screen modal, on desktop it is a centered popup.
 *
 */

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../store';
import { ACCOUNT_PALETTE } from '../utils/colors';
import { parseEuro, toEuroInput } from '../utils/aggregations';
import CreatableSelect from './CreatableSelect';
import type { Transaction, TransactionType } from '../types';

interface Props {
  type: TransactionType;
  onClose: () => void;
  editTransaction?: Transaction;
  isTemplate?: boolean;
}

const inputClass =
  'w-full bg-subtle border border-stroke rounded px-3 py-2 text-base md:text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent';
const labelClass = 'block text-xs font-medium text-ink-muted mb-1';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionModal({ type, onClose, editTransaction, isTemplate = false }: Props) {
  const { accountColors, descriptions, setAccountColor, addDescription, deleteDescription, addTransaction, updateTransaction, addTemplateItem, updateTemplateItem } = useStore();

  const isEdit = !!editTransaction;

  const [amount, setAmount] = useState(editTransaction ? toEuroInput(editTransaction.amount) : '');
  const [amountError, setAmountError] = useState('');
  const [date, setDate] = useState(editTransaction?.date ?? todayStr());
  const [templateDay, setTemplateDay] = useState(isTemplate && editTransaction ? editTransaction.date : '');
  const [description, setDescription] = useState(editTransaction?.description ?? '');
  const [account, setAccount] = useState(editTransaction?.account ?? '');

  // Every known account, including ones with no transactions yet
  const allAccounts = Object.keys(accountColors).sort();

  const currentColor = account ? accountColors[account] : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !account) return;

    // Amount check
    const cents = parseEuro(amount);
    if (cents === null || cents < 0) {
      setAmountError('Enter an amount like 12,50');
      return;
    }

    if (isTemplate) {
      const data = { type, amount: cents, description, account, date: templateDay };
      if (isEdit && editTransaction) {
        updateTemplateItem(editTransaction.id, data);
      } else {
        addTemplateItem(data);
      }
    } else {
      const data = { type, amount: cents, description, account, date };
      if (isEdit && editTransaction) {
        updateTransaction(editTransaction.id, data);
      } else {
        addTransaction(data);
      }
    }
    onClose();
  }

  const typeLabel = type === 'INCOME' ? 'Income' : 'Expense';
  const headerClass = type === 'INCOME'
    ? 'bg-income-surface text-income border-b border-income-stroke'
    : 'bg-expense-surface text-expense border-b border-expense-stroke';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card w-full h-full flex flex-col md:h-auto md:max-w-md md:rounded-lg md:border md:border-stroke md:shadow-lg">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 shrink-0 md:rounded-t-lg ${headerClass}`}>
          <h2 className="font-semibold text-base">
            {isEdit ? `Edit ${typeLabel}${isTemplate ? ' (Template)' : ''}` : isTemplate ? `Add ${typeLabel} to Template` : `Add ${typeLabel}`}
          </h2>
          <button type="button" onClick={onClose} className="p-2 -m-2 hover:opacity-60 transition-opacity" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form autoComplete="off" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Fields, scroll on phones */}
          <div className="flex-1 overflow-y-auto md:overflow-visible px-5 py-4 space-y-4">
            <div>
              <label htmlFor="amount" className={labelClass}>Amount (€)</label>
              <input
                id="amount" type="text" inputMode="decimal" required autoComplete="off"
                value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                className={inputClass} placeholder="0,00" autoFocus
              />
              {amountError && <p className="text-xs text-danger mt-1">{amountError}</p>}
            </div>

            {!isTemplate ? (
              <div>
                <label htmlFor="date" className={labelClass}>Date</label>
                <input
                  id="date" type="date" required autoComplete="off" value={date} onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="templateDay" className={labelClass}>
                  Day of month <span className="text-ink-ghost">(optional, 1-31)</span>
                </label>
                <input
                  id="templateDay" type="number" inputMode="numeric" min="1" max="31" autoComplete="off"
                  value={templateDay} onChange={(e) => setTemplateDay(e.target.value)}
                  className={inputClass}
                  placeholder="Leave blank for 1st of month"
                />
              </div>
            )}

            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <CreatableSelect
                id="description"
                value={description}
                onChange={setDescription}
                options={descriptions[type]}
                onCreate={(label) => addDescription(type, label)}
                onDelete={(label) => deleteDescription(type, label)}
                placeholder={type === 'INCOME' ? 'e.g. Salary, Bonus' : 'e.g. Rent, Groceries'}
              />
            </div>

            <div>
              <label htmlFor="account" className={labelClass}>Account</label>
              <CreatableSelect id="account" value={account} onChange={setAccount} options={allAccounts} placeholder="e.g. Sparkasse, TEB" />

              {account && (
                <div className="mt-2">
                  <div className="text-xs text-ink-faint mb-1.5">Account color</div>
                  <div className="flex gap-2 md:gap-1.5 flex-wrap">
                    {ACCOUNT_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAccountColor(account, color)}
                        className="w-7 h-7 md:w-5 md:h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
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
          </div>

          {/* Cancel and Add buttons, at the bottom on phones */}
          <div className="flex gap-2 px-5 pt-3 pb-4 shrink-0 border-t border-stroke md:border-0 md:pt-1 md:justify-end">
            <button type="button" onClick={onClose} className="flex-1 md:flex-none px-4 py-3 md:py-2 text-base md:text-sm rounded border border-stroke text-ink-muted hover:bg-thead transition-colors">
              Cancel
            </button>
            <button type="submit" className={`flex-1 md:flex-none px-4 py-3 md:py-2 text-base md:text-sm rounded font-medium transition-colors ${
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
