import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../store";
import {
  aggregateByDescriptionAndAccount,
  aggregateByDescriptionWithAccounts,
  formatEuro,
} from "../utils/aggregations";
import TransactionModal from "../components/TransactionModal";
import IncomeBar from "../components/IncomeBar";
import ExpenseProgressBars from "../components/ExpenseProgressBars";
import AccountTag from "../components/AccountTag";
import type { TransactionType } from "../types";

const th =
  "px-4 py-2 text-left text-xs font-medium text-ink-faint uppercase tracking-wide";
const thR =
  "px-4 py-2 text-right text-xs font-medium text-ink-faint uppercase tracking-wide";

export default function Dashboard() {
  const { months, activeMonthKey, accountColors } = useStore();
  const [modal, setModal] = useState<TransactionType | null>(null);

  const active = months[activeMonthKey] ?? [];
  const incomes = active.filter((t) => t.type === "INCOME");
  const expenses = active.filter((t) => t.type === "EXPENSE");

  const aggIncome = aggregateByDescriptionAndAccount(incomes);
  const aggExpense = aggregateByDescriptionWithAccounts(expenses);

  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0 flex-1">
        {/* Income Column */}
        <div className="border border-stroke rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="bg-income-surface px-4 py-3 flex items-center justify-between border-b border-income-stroke">
            <span className="font-semibold text-income">Income</span>
            <button
              onClick={() => setModal("INCOME")}
              className="flex items-center gap-1 text-xs font-medium bg-income-btn hover:bg-income-btn-hover text-income px-3 py-1.5 rounded transition-colors"
            >
              <Plus size={14} /> Add Income
            </button>
          </div>

          <div className="bg-card flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            {aggIncome.length === 0 ? (
              <p className="text-sm text-ink-faint px-4 py-8 text-center">
                No income this month
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-stroke-light">
                  <tr>
                    <th className={th}>Description</th>
                    <th className={th}>Account</th>
                    <th className={thR}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {aggIncome.map((row) => (
                    <tr
                      key={`${row.description}-${row.account}`}
                      className="border-b border-stroke-light last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">{row.description}</td>
                      <td className="px-4 py-3">
                        <AccountTag
                          account={row.account}
                          color={accountColors[row.account]}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-income">
                        {formatEuro(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-income-surface/50 border-t border-income-stroke px-4 py-2.5 flex justify-between items-center">
            <span className="text-xs font-semibold text-income uppercase tracking-wide">
              Total
            </span>
            <span className="font-semibold text-income">
              {formatEuro(totalIncome)}
            </span>
          </div>

          <div className="bg-card px-4 pt-2 pb-5 border-t border-stroke-light">
            <IncomeBar transactions={incomes} />
          </div>
        </div>

        {/* Expense Column */}
        <div className="border border-stroke rounded-lg overflow-hidden flex flex-col min-h-0">
          <div className="bg-expense-surface px-4 py-3 flex items-center justify-between border-b border-expense-stroke">
            <span className="font-semibold text-expense">Expenses</span>
            <button
              onClick={() => setModal("EXPENSE")}
              className="flex items-center gap-1 text-xs font-medium bg-expense-btn hover:bg-expense-btn-hover text-expense px-3 py-1.5 rounded transition-colors"
            >
              <Plus size={14} /> Add Expense
            </button>
          </div>

          <div className="bg-card flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            {aggExpense.length === 0 ? (
              <p className="text-sm text-ink-faint px-4 py-8 text-center">
                No expenses this month
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-stroke-light">
                  <tr>
                    <th className={th}>Description</th>
                    <th className={th}>Account</th>
                    <th className={thR}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {aggExpense.map((row) => (
                    <tr
                      key={row.description}
                      className="border-b border-stroke-light last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">{row.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.accounts.map((acc) => (
                            <AccountTag
                              key={acc}
                              account={acc}
                              color={accountColors[acc]}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-expense">
                        {formatEuro(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-expense-surface/50 border-t border-expense-stroke px-4 py-2.5 flex justify-between items-center">
            <span className="text-xs font-semibold text-expense uppercase tracking-wide">
              Total
            </span>
            <span className="font-semibold text-expense">
              {formatEuro(totalExpense)}
            </span>
          </div>

          <div className="bg-card px-4 pt-2 pb-5 border-t border-stroke-light">
            <ExpenseProgressBars transactions={active} />
          </div>
        </div>
      </div>

      {modal && (
        <TransactionModal type={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
