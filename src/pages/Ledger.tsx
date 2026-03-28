import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { formatEuro, getUniqueAccounts, getUniqueDescriptions } from '../utils/aggregations';
import TransactionModal from '../components/TransactionModal';
import AccountTag from '../components/AccountTag';
import type { Transaction, TransactionType } from '../types';

type SortKey = keyof Pick<Transaction, 'date' | 'type' | 'description' | 'account' | 'amount'>;

export default function Ledger() {
  const { months, activeMonthKey, deleteTransaction, accountColors } = useStore();
  const [modal, setModal] = useState<TransactionType | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  const active = months[activeMonthKey] ?? [];
  const allDescriptions = getUniqueDescriptions(months);
  const allAccounts = getUniqueAccounts(months);

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const filtered = active
    .filter((t) => filterType === 'ALL' || t.type === filterType)
    .filter((t) => !filterDescription || t.description === filterDescription)
    .filter((t) => !filterAccount || t.account === filterAccount);

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp size={12} className="text-stroke" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-ink" /> : <ChevronDown size={12} className="text-ink" />;
  }

  const th = 'px-4 py-2.5 text-left text-xs font-medium text-ink-faint uppercase tracking-wide cursor-pointer select-none hover:text-ink';
  const selectClass = 'bg-subtle border border-stroke rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-accent';

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-semibold text-ink">Ledger</h1>
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

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-3 p-3 bg-card border border-stroke rounded-lg">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className={selectClass}>
          <option value="ALL">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        <select value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)} className={selectClass}>
          <option value="">All descriptions</option>
          {allDescriptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className={selectClass}>
          <option value="">All accounts</option>
          {allAccounts.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {(filterType !== 'ALL' || filterDescription || filterAccount) && (
          <button
            onClick={() => { setFilterType('ALL'); setFilterDescription(''); setFilterAccount(''); }}
            className="text-xs text-ink-faint hover:text-ink px-2 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="border border-stroke rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-thead border-b border-stroke">
            <tr>
              {(['date', 'type', 'description', 'account', 'amount'] as SortKey[]).map((col) => (
                <th key={col} className={th} onClick={() => toggleSort(col)}>
                  <span className="flex items-center gap-1">
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint text-sm">
                  {active.length === 0 ? 'No transactions this month.' : 'No transactions match the filters.'}
                </td>
              </tr>
            ) : (
              sorted.map((tx, i) => (
                <tr key={tx.id} className={i % 2 === 0 ? 'bg-card' : 'bg-subtle'}>
                  <td className="px-4 py-2.5 text-ink-faint">{tx.date}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      tx.type === 'INCOME' ? 'bg-income-btn text-income' : 'bg-expense-btn text-expense'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink">{tx.description}</td>
                  <td className="px-4 py-2.5"><AccountTag account={tx.account} color={accountColors[tx.account]} /></td>
                  <td className={`px-4 py-2.5 font-medium text-right ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatEuro(tx.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditTx(tx)} className="text-stroke hover:text-accent transition-colors" aria-label="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteTransaction(tx.id)} className="text-stroke hover:text-danger transition-colors" aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} />}
      {editTx && (
        <TransactionModal
          type={editTx.type}
          editTransaction={editTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </>
  );
}
