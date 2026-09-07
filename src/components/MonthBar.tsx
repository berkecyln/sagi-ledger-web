import { ChevronLeft, ChevronRight, LayoutTemplate, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';

function prevMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthBar() {
  const { activeMonthKey, setActiveMonth, months, template, applyTemplateToMonth, applying } = useStore();
  const [confirming, setConfirming] = useState(false);

  const [y, m] = activeMonthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  const monthKeys = Object.keys(months).sort();
  const earliestMonth = monthKeys[0];
  const isPrevDisabled = !!earliestMonth && activeMonthKey <= earliestMonth;

  return (
    <div className="bg-monthbar border-b border-stroke py-3 relative">
      {applying && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-stroke">
          <div
            className="h-full bg-accent transition-all duration-200"
            style={{ width: `${(applying.done / applying.total) * 100}%` }}
          />
        </div>
      )}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => !isPrevDisabled && setActiveMonth(prevMonth(activeMonthKey))}
          disabled={isPrevDisabled}
          className="p-1.5 rounded text-ink-faint hover:text-ink hover:bg-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-baseline gap-2 min-w-[160px] justify-center">
          <span className="text-xl font-semibold text-ink tracking-tight">{monthName}</span>
          <span className="text-sm text-ink-faint">{year}</span>
        </div>

        <button
          onClick={() => setActiveMonth(nextMonth(activeMonthKey))}
          className="p-1.5 rounded text-ink-faint hover:text-ink hover:bg-hover transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {template.length > 0 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {applying ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-muted">
              <Loader2 size={14} className="animate-spin text-accent" />
              Saving {applying.done} of {applying.total}
            </div>
          ) : confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-faint">Overwrites this month.</span>
              <button
                onClick={() => { applyTemplateToMonth(); setConfirming(false); }}
                className="px-3 py-1.5 rounded text-xs font-medium text-danger border border-danger/30 hover:bg-danger/10 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="p-1.5 rounded text-ink-faint hover:text-ink hover:bg-hover transition-colors"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              title="Apply template to this month"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
            >
              <LayoutTemplate size={14} />
              Apply Template
            </button>
          )}
        </div>
      )}
    </div>
  );
}
