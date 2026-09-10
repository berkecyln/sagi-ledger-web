import type { Transaction } from '../types';
import { aggregateByAccount, formatEuro } from '../utils/aggregations';
import { useStore } from '../store';
import AccountTag from './AccountTag';

interface Props {
  transactions: Transaction[];
}

function thresholdColor(pct: number): string {
  if (pct >= 80) return 'var(--danger)';
  if (pct >= 50) return 'var(--accent)';
  return 'var(--color-ink-faint, #9c948c)';
}

export default function ExpenseProgressBars({ transactions }: Props) {
  const { accountColors } = useStore();
  const byAccount = aggregateByAccount(transactions);
  const accounts = byAccount.filter((a) => a.income > 0 || a.expense > 0);

  if (accounts.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="text-xs text-ink-faint">Balance this month by account</div>
      {accounts.map((a) => {
        const pct = a.income > 0 ? (a.expense / a.income) * 100 : 100;
        const balance = a.income - a.expense;
        const accentColor = accountColors[a.account];
        const barColor = accentColor ?? 'var(--stroke)';

        return (
          <div key={a.account}>
            <div className="flex justify-between items-center mb-1">
              <AccountTag account={a.account} color={accentColor} />
              <span className="flex items-center gap-2 text-xs font-medium" style={{ color: thresholdColor(pct) }}>
                {pct.toFixed(0)}% Spent
                {/* Separator */}
                <span className="w-px h-3 bg-current opacity-40" />
                {formatEuro(balance)} remaining
              </span>
            </div>
            <div className="w-full bg-hover rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor + 'cc' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
