import { useMemo, useState } from "react";
import { useStore } from "../store";
import { formatEuro } from "../utils/aggregations";
import { SettingsIcon } from "lucide-react";
import BaseBalanceModal from "./BaseBalanceModal";

export default function CumulativeFooter() {
  const monthlyBalances = useStore((state) => state.monthlyBalances);
  const accountColors = useStore((state) => state.accountColors);
  const baseAccountBalances = useStore((state) => state.baseAccountBalances);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeBalances = useMemo(() => {
    // Start with the base balances mapped into totals
    const totals: Record<string, number> = { ...baseAccountBalances };

    for (const month of Object.values(monthlyBalances)) {
      for (const [account, amount] of Object.entries(month)) {
        totals[account] = (totals[account] || 0) + amount;
      }
    }

    return Object.entries(totals)
      .filter(([_, amount]) => amount !== 0)
      .sort((a, b) => b[1] - a[1]);
  }, [monthlyBalances, baseAccountBalances]);

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
