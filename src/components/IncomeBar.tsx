import type { Transaction } from '../types';
import { aggregateByAccount, formatEuro } from '../utils/aggregations';
import { useStore } from '../store';

interface Props {
  transactions: Transaction[];
}

export default function IncomeBar({ transactions }: Props) {
  const { accountColors } = useStore();
  const byAccount = aggregateByAccount(transactions).filter((a) => a.income > 0);
  if (byAccount.length === 0) return null;

  const total = byAccount.reduce((s, a) => s + a.income, 0);
  const segments = byAccount.map((a) => ({
    account: a.account,
    value: a.income,
    pct: (a.income / total) * 100,
    color: accountColors[a.account] ?? 'var(--ink-muted)',
  }));

  return (
    <div className="mt-3">
      <div className="text-xs text-ink-faint mb-1">Income by account</div>

      <div className="flex w-full h-3 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div
            key={s.account}
            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
            title={`${s.account}: ${formatEuro(s.value)} (${s.pct.toFixed(0)}%)`}
          />
        ))}
      </div>

      <div className="flex gap-3 mt-1.5 flex-wrap">
        {segments.map((s) => (
          <span key={s.account} className="text-xs text-ink-muted flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            {s.account} ({s.pct.toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
