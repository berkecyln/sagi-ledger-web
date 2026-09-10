/**
 * Total balances
 *
 * Total balance per account, base balance plus every month, with the base balance settings.
 * Shared pieces with two layouts, a footer bar on desktop and a Dashboard card on phones.
 *
 */

import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { useStore } from '../store';
import { formatEuro, getTotalBalances } from '../utils/aggregations';
import BaseBalanceModal from './BaseBalanceModal';

// Balance of every known account, highest first
function useTotalBalances() {
  const months = useStore((s) => s.months);
  const accountColors = useStore((s) => s.accountColors);
  const baseAccountBalances = useStore((s) => s.baseAccountBalances);

  return useMemo(
    () => getTotalBalances(months, accountColors, baseAccountBalances),
    [months, accountColors, baseAccountBalances],
  );
}

// Account colour dot and name
function AccountName({ account }: { account: string }) {
  const color = useStore((s) => s.accountColors[account]);

  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color || 'var(--ink-faint)' }} />
      <span className="font-medium truncate" style={{ color: color || 'var(--ink)' }}>{account}</span>
    </span>
  );
}

// Balance amount, red when negative
function Amount({ total }: { total: number }) {
  return (
    <span className={`font-semibold shrink-0 ${total < 0 ? 'text-expense' : 'text-income'}`}>
      {formatEuro(total)}
    </span>
  );
}

// Gear that opens the base balance settings
function SettingsButton({ size, className = '' }: { size: number; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-ink-muted hover:text-ink transition-colors ${className}`}
        aria-label="Adjust base balances"
        title="Adjust base balances"
      >
        <Settings size={size} />
      </button>
      {open && <BaseBalanceModal onClose={() => setOpen(false)} />}
    </>
  );
}

// Footer bar under the pages on desktop, pills in a row
export function TotalBalancesFooter() {
  const balances = useTotalBalances();
  if (balances.length === 0) return null;

  return (
    <div className="max-md:hidden border-t border-stroke bg-card p-4 mt-auto flex justify-center items-center relative">
      <div className="max-w-7xl flex flex-wrap gap-4 items-center justify-center text-sm">
        <span className="mr-2 uppercase tracking-wider text-xs font-semibold text-ink">
          Total Balances
        </span>
        {balances.map(({ account, total }) => (
          <div
            key={account}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${
              total < 0 ? 'bg-expense-surface border-expense-stroke' : 'bg-income-surface border-income-stroke'
            }`}
          >
            <AccountName account={account} />
            <Amount total={total} />
          </div>
        ))}
      </div>

      <div className="absolute right-4 flex items-center">
        <SettingsButton size={20} className="outline-none focus:outline-none" />
      </div>
    </div>
  );
}

// Dashboard card on phones, one row per account
export function TotalBalancesCard() {
  const balances = useTotalBalances();
  if (balances.length === 0) return null;

  return (
    <div className="md:hidden border border-stroke rounded-lg overflow-hidden">
      <div className="bg-thead px-4 py-3 flex items-center justify-between border-b border-stroke">
        <span className="font-semibold text-ink">Total balances</span>
        <SettingsButton size={18} className="p-2 -m-2" />
      </div>

      <ul className="bg-card divide-y divide-stroke-light">
        {balances.map(({ account, total }) => (
          <li key={account} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <AccountName account={account} />
            <Amount total={total} />
          </li>
        ))}
      </ul>
    </div>
  );
}
