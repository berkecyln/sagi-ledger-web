# CumulativeFooter

**File:** `src/components/CumulativeFooter.tsx`

A bottom footer bar that shows cumulative account balances across all months plus optional base balances. Appears at the bottom of the app layout and hides itself when all totals are zero.

## Data source

- `monthlyBalances` from store (month -> account -> net amount)
- `baseAccountBalances` from store (account -> starting amount)
- `accountColors` from store (account -> hex color)

For each account:

`total = baseAccountBalances[account] + sum(monthlyBalances[*][account])`

Accounts with total `0` are filtered out. Remaining accounts are sorted descending by amount.

## Visual behaviour

- Header text: "Total Balances"
- One pill per account with:
  - color dot from `accountColors`
  - account label (same per-account color)
  - amount value (`text-income` for positive, `text-expense` for negative)
- Pill background/border depends on sign:
  - positive: `bg-income-surface border-income-stroke`
  - negative: `bg-expense-surface border-expense-stroke`

## Settings button

A settings icon on the right opens [`BaseBalanceModal`](BaseBalanceModal.md) to edit starting balances and add new accounts.