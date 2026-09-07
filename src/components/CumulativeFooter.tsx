import { useMemo, useState } from "react";
import { useStore } from "../store";
import { formatEuro, getAllTimeBalanceByAccount } from "../utils/aggregations";
import { SettingsIcon } from "lucide-react";
import BaseBalanceModal from "./BaseBalanceModal";

export default function CumulativeFooter() {
  const months = useStore((state) => state.months);
  const accountColors = useStore((state) => state.accountColors);
  const baseAccountBalances = useStore((state) => state.baseAccountBalances);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeBalances = useMemo(() => {
    // Every known account, same list as the settings modal
    const totals: Record<string, number> = {};
    for (const account of Object.keys(accountColors)) {
      totals[account] = baseAccountBalances[account] ?? 0;
    }

    // Monthly activity on top
    for (const { account, balance } of getAllTimeBalanceByAccount(months)) {
      totals[account] = (totals[account] ?? 0) + balance;
    }

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [months, baseAccountBalances, accountColors]);

  if (activeBalances.length === 0) return null;

  return (
    <div className="border-t border-stroke bg-card p-4 mt-auto flex justify-center items-center relative">
      <div className="max-w-7xl flex flex-wrap gap-4 items-center justify-center text-sm">
        <span className="mr-2 uppercase tracking-wider text-xs font-semibold text-ink">
          Total Balances
        </span>
        {activeBalances.map(([account, amount]) => (
          <div
            key={account}
            className={"flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border " + (amount < 0 ? " bg-expense-surface border-expense-stroke" : " bg-income-surface border-income-stroke")}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accountColors[account] || "#ccc" }}
            />
            <span
              className="font-medium"
              style={{ color: accountColors[account] || "var(--ink)" }}
            >
              {account}
            </span>
            <span className={"font-semibold " + (amount < 0 ? "text-expense" : "text-income")}>{formatEuro(amount)}</span>
          </div>
        ))}
      </div>
      <div className="absolute right-4 flex items-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-ink-muted hover:text-ink transition-colors outline-none focus:outline-none"
          title="Adjust Setting Balances"
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      {isModalOpen && <BaseBalanceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
