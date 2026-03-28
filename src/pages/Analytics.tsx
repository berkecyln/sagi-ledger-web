import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { aggregateByAccount, aggregateByDescription, formatEuro } from '../utils/aggregations';

const EXPENSE_COLORS = ['#9D1B1B', '#BC6C25', '#64733a', '#495867', '#7a5c3a', '#8b6e6e', '#5c7a5c', '#6e7a8b'];

export default function Analytics() {
  const { months, activeMonthKey, accountColors } = useStore();
  const active = months[activeMonthKey] ?? [];

  const incomes = active.filter((t) => t.type === 'INCOME');
  const expenses = active.filter((t) => t.type === 'EXPENSE');

  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const allTx = [...incomes, ...expenses];
  const byAccount = aggregateByAccount(allTx);

  const incomeData = byAccount
    .filter((a) => a.income > 0)
    .map((a) => ({ name: a.account, value: a.income, color: accountColors[a.account] ?? 'var(--ink-muted)' }));

  const expenseData = aggregateByDescription(expenses).map((d, i) => ({
    name: d.description,
    value: d.total,
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  const hasData = incomeData.length > 0 || expenseData.length > 0;

  const tooltipStyle = {
    background: 'var(--card)',
    border: '1px solid var(--stroke)',
    color: 'var(--ink)',
    fontSize: 12,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-base font-semibold text-ink">Monthly Overview</h1>

      {!hasData ? (
        <p className="text-ink-faint text-sm">No transactions this month.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income donut */}
          <div className="bg-card border border-stroke rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-income">Income by Account</span>
              <span className="text-sm font-semibold text-income">{formatEuro(totalIncome)}</span>
            </div>
            {incomeData.length === 0 ? (
              <p className="text-ink-faint text-sm py-8 text-center">No income this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={incomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {incomeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(val) => formatEuro(Number(val))} contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expense donut */}
          <div className="bg-card border border-stroke rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-expense">Expenses by Category</span>
              <span className="text-sm font-semibold text-expense">{formatEuro(totalExpense)}</span>
            </div>
            {expenseData.length === 0 ? (
              <p className="text-ink-faint text-sm py-8 text-center">No expenses this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {expenseData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(val) => formatEuro(Number(val))} contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div className={`self-center border rounded-lg px-8 py-5 text-center ${net >= 0 ? 'border-income-stroke bg-income-surface' : 'border-expense-stroke bg-expense-surface'}`}>
        <div className="text-xs text-ink-faint mb-1 uppercase tracking-wide">Net Balance</div>
        <div className={`text-2xl font-semibold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
          {net >= 0 ? '+' : ''}{formatEuro(net)}
        </div>
        <div className="text-xs text-ink-faint mt-2 space-y-0.5">
          <div>Income: <span className="text-income font-medium">{formatEuro(totalIncome)}</span></div>
          <div>Expenses: <span className="text-expense font-medium">{formatEuro(totalExpense)}</span></div>
        </div>
      </div>
    </div>
  );
}
