# CumulativeFooter

**File:** `src/components/CumulativeFooter.tsx`

A bottom footer bar that shows cumulative account balances across all months plus optional base balances. Appears at the bottom of the app layout and hides itself when there is nothing to show.

## Data source

- `accountColors` from store (account -> hex color), doubles as the list of known accounts
- `monthlyBalances` from store (month -> account -> net amount)
- `baseAccountBalances` from store (account -> starting amount)

For each account:

`total = baseAccountBalances[account] + sum(monthlyBalances[*][account])`

Every account in `accountColors` gets a pill, so the footer always lists exactly the same accounts as [`BaseBalanceModal`](BaseBalanceModal.md).

An account leaves the footer only by being deleted in the settings modal, which is possible once nothing references it.

Accounts are sorted descending by amount.

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