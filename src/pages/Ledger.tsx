/**
 * Ledger
 *
 * Every transaction of the active month, searchable, filterable and sortable.
 * On phones the rows are cards, tapping a card opens it for editing.
 *
 */

import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronUp, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store';
import { formatEuro, getUniqueAccounts, getUniqueDescriptions, matchesSearch } from '../utils/aggregations';
import TransactionModal from '../components/TransactionModal';
import AccountTag from '../components/AccountTag';
import type { Transaction, TransactionType } from '../types';

type SortKey = keyof Pick<Transaction, 'date' | 'type' | 'description' | 'account' | 'amount'>;

// Format date from YYYY-MM-DD to "D MMM" 
function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Ledger() {
  const { months, activeMonthKey, deleteTransaction, accountColors } = useStore();
  const [modal, setModal] = useState<TransactionType | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  const active = months[activeMonthKey] ?? [];
  const allDescriptions = getUniqueDescriptions(months);
  const allAccounts = getUniqueAccounts(months);
  const filtersActive = filterType !== 'ALL' || !!filterDescription || !!filterAccount;

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const filtered = active
    .filter((t) => matchesSearch(t, search))
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

  const emptyText = active.length === 0 ? 'No transactions this month.' : 'No transactions match the filters.';

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp size={12} className="text-stroke" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-ink" /> : <ChevronDown size={12} className="text-ink" />;
  }

  const th = 'px-4 py-2.5 text-left text-xs font-medium text-ink-faint uppercase tracking-wide cursor-pointer select-none hover:text-ink';
  const fieldClass = 'bg-subtle border border-stroke rounded px-2.5 py-1.5 text-base md:text-xs text-ink focus:outline-none focus:border-accent';

  return (
    <>
      <div className="flex items-center justify-between mb-3 shrink-0">
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

      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 mb-3 p-3 bg-card border border-stroke rounded-lg shrink-0">
        <div className="flex gap-2 md:w-56">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search" autoComplete="off" enterKeyHint="search"
              className={`${fieldClass} w-full pl-8`}
            />
          </div>

          {/* Filter toggle, phones only */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`md:hidden relative px-3 rounded border border-stroke transition-colors ${
              showFilters ? 'bg-accent/15 text-accent' : 'bg-subtle text-ink-muted'
            }`}
            aria-label="Filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} />
            {filtersActive && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />}
          </button>
        </div>

        {/* Filters, behind the toggle on phones */}
        <div className={`${showFilters ? 'grid' : 'hidden'} grid-cols-1 gap-2 md:flex md:flex-wrap`}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className={fieldClass}>
            <option value="ALL">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)} className={fieldClass}>
            <option value="">All descriptions</option>
            {allDescriptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className={fieldClass}>
            <option value="">All accounts</option>
            {allAccounts.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          {filtersActive && (
            <button
              onClick={() => { setFilterType('ALL'); setFilterDescription(''); setFilterAccount(''); }}
              className="text-xs text-ink-faint hover:text-ink px-2 py-1.5 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table, desktop only */}
      <div className="max-md:hidden border border-stroke rounded-lg overflow-y-auto flex-1 min-h-0 custom-scrollbar bg-card">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-thead sticky top-0 z-10">
            <tr>
              {(['date', 'type', 'description', 'account', 'amount'] as SortKey[]).map((col) => (
                <th key={col} className={`${th} border-b border-stroke`} onClick={() => toggleSort(col)}>
                  <span className="flex items-center gap-1">
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 w-10 border-b border-stroke" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint text-sm">
                  {emptyText}
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

      {/* Cards, phones only */}
      <div className="md:hidden space-y-2">
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-ink-faint text-sm bg-card border border-stroke rounded-lg">
            {emptyText}
          </p>
        ) : (
          sorted.map((tx) => (
            <div key={tx.id} className="flex bg-card border border-stroke rounded-lg">
              {confirmingId === tx.id ? (
                <div className="flex-1 flex items-center justify-between gap-2 px-4 py-3">
                  {/* Delete confirm */}
                  <span className="text-sm text-ink truncate">Delete "{tx.description}"?</span>
                  <span className="flex gap-4 shrink-0 text-sm font-medium">
                    <button onClick={() => { deleteTransaction(tx.id); setConfirmingId(null); }} className="text-danger">Yes</button>
                    <button onClick={() => setConfirmingId(null)} className="text-ink-muted">No</button>
                  </span>
                </div>
              ) : (
                <>
                  {/* Tap to edit */}
                  <button onClick={() => setEditTx(tx)} className="flex-1 min-w-0 text-left px-4 py-3">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-ink truncate">{tx.description}</span>
                      <span className={`font-medium shrink-0 ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatEuro(tx.amount)}
                      </span>
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
            </div>
          ))
        )}
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
