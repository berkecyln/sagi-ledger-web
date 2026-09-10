/**
 * Template manager
 *
 * Recurring items that Apply Template copies into a month.
 * On phones the rows are cards, tapping a row opens it for editing.
 *
 */

import { useState } from 'react';
import { LayoutTemplate, Plus, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../store';
import { formatEuro } from '../utils/aggregations';
import TransactionModal from '../components/TransactionModal';
import AccountTag from '../components/AccountTag';
import type { Transaction, TransactionType } from '../types';

// Return the day label, a blank day falls on the 1st
function formatDay(date: string): string {
  if (!date || !/^\d{1,2}$/.test(date.trim())) return 'Day 1';
  return `Day ${date}`;
}

// Title and colour classes per type
const TONE = {
  INCOME: { title: 'Income', header: 'bg-income-surface border-income-stroke', text: 'text-income' },
  EXPENSE: { title: 'Expenses', header: 'bg-expense-surface border-expense-stroke', text: 'text-expense' },
};

const th = 'px-4 py-2 text-left text-xs text-ink-faint font-medium';

interface SectionProps {
  type: TransactionType;
  items: Transaction[];
  onEdit: (tx: Transaction) => void;
}

// One card of template items, a table on desktop and rows on phones
function TemplateSection({ type, items, onEdit }: SectionProps) {
  const { deleteTemplateItem, accountColors } = useStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const tone = TONE[type];

  return (
    <div className="border border-stroke rounded-lg overflow-hidden">
      <div className={`px-4 py-2.5 border-b ${tone.header}`}>
        <span className={`text-sm font-semibold ${tone.text}`}>{tone.title}</span>
      </div>

      {/* Table, desktop only */}
      <table className="max-md:hidden w-full text-sm">
        <thead className="bg-thead border-b border-stroke">
          <tr>
            <th className={th}>Description</th>
            <th className={th}>Account</th>
            <th className={th}>Day</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((tx, i) => (
            <tr key={tx.id} className={i % 2 === 0 ? 'bg-card' : 'bg-subtle'}>
              <td className="px-4 py-2.5 text-ink">{tx.description}</td>
              <td className="px-4 py-2.5"><AccountTag account={tx.account} color={accountColors[tx.account]} /></td>
              <td className="px-4 py-2.5 text-ink-faint">{formatDay(tx.date)}</td>
              <td className={`px-4 py-2.5 text-right font-medium ${tone.text}`}>{formatEuro(tx.amount)}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(tx)} className="text-stroke hover:text-accent transition-colors" aria-label="Edit">
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

      {/* Rows, phones only */}
      <ul className="md:hidden bg-card divide-y divide-stroke-light">
        {items.map((tx) => (
          <li key={tx.id} className="flex">
            {confirmingId === tx.id ? (
              <div className="flex-1 flex items-center justify-between gap-2 px-4 py-3">
                {/* Delete confirm */}
                <span className="text-sm text-ink truncate">Delete "{tx.description}"?</span>
                <span className="flex gap-4 shrink-0 text-sm font-medium">
                  <button onClick={() => { deleteTemplateItem(tx.id); setConfirmingId(null); }} className="text-danger">Yes</button>
                  <button onClick={() => setConfirmingId(null)} className="text-ink-muted">No</button>
                </span>
              </div>
            ) : (
              <>
                {/* Tap to edit */}
                <button onClick={() => onEdit(tx)} className="flex-1 min-w-0 text-left px-4 py-3">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-ink truncate">{tx.description}</span>
                    <span className={`font-medium shrink-0 ${tone.text}`}>{formatEuro(tx.amount)}</span>
                  </span>
                  <span className="flex items-center gap-2 mt-1.5 text-xs text-ink-faint">
                    <AccountTag account={tx.account} color={accountColors[tx.account]} />
                    {formatDay(tx.date)}
                  </span>
                </button>
                <button
                  onClick={() => setConfirmingId(tx.id)}
                  className="px-4 text-ink-faint hover:text-danger border-l border-stroke-light transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TemplateManager() {
  const { template } = useStore();
  const [modal, setModal] = useState<TransactionType | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const incomes = template.filter((t) => t.type === 'INCOME');
  const expenses = template.filter((t) => t.type === 'EXPENSE');

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="font-semibold text-ink">Template</h1>
          <p className="text-xs text-ink-faint mt-0.5">
            {/* Desktop sentence */}
            <span className="hidden md:inline">
              These items are applied when you click "Apply Template" on a month.
            </span>
            {/* Phone sentence with the template icon */}
            <span className="md:hidden">
              Tap{' '}
              <span className="inline-flex p-0.5 rounded border border-accent/30 text-accent align-middle">
                <LayoutTemplate size={11} />
              </span>{' '}
              on any month to apply these items.
            </span>
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
        // Scrolls inside the page on desktop
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start md:min-h-0 md:overflow-y-auto custom-scrollbar">
          {incomes.length > 0 && <TemplateSection type="INCOME" items={incomes} onEdit={setEditTx} />}
          {expenses.length > 0 && <TemplateSection type="EXPENSE" items={expenses} onEdit={setEditTx} />}
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
