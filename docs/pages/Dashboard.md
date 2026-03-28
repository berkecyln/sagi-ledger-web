# Dashboard (`/`)

**File:** `src/pages/Dashboard.tsx`

## What it shows

Two equal columns side by side — Income (left) and Expenses (right) — for the active month.

## Income column

- Rows are grouped by **description + account**. "Salary" from TEB and "Salary" from Garanti appear as two separate rows.
- Each row shows: description · [`AccountTag`](../components/AccountTag.md) · amount
- Below the table: a [`Total` strip](../components/IncomeBar.md) then the [`IncomeBar`](../components/IncomeBar.md) (stacked bar by account)

## Expense column

- Rows are grouped by **description only**. If the same expense came from two accounts both tags are shown in the Account cell.
- Below the table: a `Total` strip then [`ExpenseProgressBars`](../components/ExpenseProgressBars.md)

## Total strip

Sits between the table and the chart section. Shows "TOTAL" label + amount. Not a table row — it's a separate `div` so it visually separates data from charts.

## Modal

Clicking "Add Income" or "Add Expense" opens [`TransactionModal`](../components/TransactionModal.md) with the type pre-set.
