import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../store';
import { formatEuro } from '../utils/aggregations';
import TransactionModal from '../components/TransactionModal';
import AccountTag from '../components/AccountTag';
import type { Transaction, TransactionType } from '../types';

function formatDay(date: string): string {
  if (!date || !/^\d{1,2}$/.test(date.trim())) return '—';
  return `Day ${date}`;
}

export default function TemplateManager() {
  const { template, deleteTemplateItem, accountColors } = useStore();
  const [modal, setModal] = useState<TransactionType | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const incomes = template.filter((t) => t.type === 'INCOME');
  const expenses = template.filter((t) => t.type === 'EXPENSE');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-semibold text-ink">Template</h1>
          <p className="text-xs text-ink-faint mt-0.5">
            These items are applied when you click "Apply Template" on a month.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal('INCOME')}
            className="flex items-center gap-1 text-xs font-medium bg-income-btn hover:bg-income-btn-hover text-income px-3 py-1.5 rounded transition-colors"
          >
            <Plus size={14} /> Add Income
          </button>
          <button
            onClick={() => setModal('EXPENSE')}
            className="flex items-center gap-1 text-xs font-medium bg-expense-btn hover:bg-expense-btn-hover text-expense px-3 py-1.5 rounded transition-colors"
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {template.length === 0 ? (
        <div className="border border-dashed border-stroke rounded-lg px-6 py-12 text-center text-ink-faint text-sm">
          No template items yet. Add recurring income or expenses above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomes.length > 0 && (
            <div className="border border-stroke rounded-lg overflow-hidden">
              <div className="bg-income-surface px-4 py-2.5 border-b border-income-stroke">
                <span className="text-sm font-semibold text-income">Income</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-thead border-b border-stroke">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Description</th>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Account</th>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Day</th>
                    <th className="px-4 py-2 text-right text-xs text-ink-faint font-medium">Amount</th>
                    <th className="px-4 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((tx, i) => (
                    <tr key={tx.id} className={i % 2 === 0 ? 'bg-card' : 'bg-subtle'}>
                      <td className="px-4 py-2.5 text-ink">{tx.description}</td>
                      <td className="px-4 py-2.5"><AccountTag account={tx.account} color={accountColors[tx.account]} /></td>
                      <td className="px-4 py-2.5 text-ink-faint">{formatDay(tx.date)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-income">{formatEuro(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditTx(tx)} className="text-stroke hover:text-accent transition-colors" aria-label="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteTemplateItem(tx.id)} className="text-stroke hover:text-danger transition-colors" aria-label="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="border border-stroke rounded-lg overflow-hidden">
              <div className="bg-expense-surface px-4 py-2.5 border-b border-expense-stroke">
                <span className="text-sm font-semibold text-expense">Expenses</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-thead border-b border-stroke">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Description</th>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Account</th>
                    <th className="px-4 py-2 text-left text-xs text-ink-faint font-medium">Day</th>
                    <th className="px-4 py-2 text-right text-xs text-ink-faint font-medium">Amount</th>
                    <th className="px-4 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((tx, i) => (
                    <tr key={tx.id} className={i % 2 === 0 ? 'bg-card' : 'bg-subtle'}>
                      <td className="px-4 py-2.5 text-ink">{tx.description}</td>
                      <td className="px-4 py-2.5"><AccountTag account={tx.account} color={accountColors[tx.account]} /></td>
                      <td className="px-4 py-2.5 text-ink-faint">{formatDay(tx.date)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-expense">{formatEuro(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditTx(tx)} className="text-stroke hover:text-accent transition-colors" aria-label="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteTemplateItem(tx.id)} className="text-stroke hover:text-danger transition-colors" aria-label="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} isTemplate />}
      {editTx && (
        <TransactionModal
          type={editTx.type}
          editTransaction={editTx}
          isTemplate
          onClose={() => setEditTx(null)}
        />
      )}
    </>
  );
}
