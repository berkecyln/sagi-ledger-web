# Dashboard (`/`)

**File:** `src/pages/Dashboard.tsx`

Overview of the active month, income on the left and expenses on the right.

## Income

- Rows grouped by **description and account**. Salary from TEB and Salary from Sparkasse are two rows.
- Total below the rows, then [`IncomeBar`](../components/IncomeBar.md).

## Expenses

- Rows grouped by **description only**. When one label was paid from several accounts, every [`AccountTag`](../components/AccountTag.md) is shown.
- Total below the rows, then [`ExpenseProgressBars`](../components/ExpenseProgressBars.md).

## Adding

**Add Income** and **Add Expense** open [`TransactionModal`](../components/TransactionModal.md) with the type set.

## On phones

- Each column shows only its month total in the header and its bars. The rows are in the Ledger.
- [`TotalBalances`](../components/TotalBalances.md) appears as a card below the columns.
- Add Income and Add Expense are large buttons fixed to the bottom of the screen (`AddActionButtons`).
