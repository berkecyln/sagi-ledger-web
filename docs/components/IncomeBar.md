# IncomeBar

**File:** `src/components/IncomeBar.tsx`

A single stacked horizontal bar showing income split by account for the active month. Shown at the bottom of the Income column on the Dashboard.

## How it works

- Groups transactions by account using `aggregateByAccount`
- Each account becomes a colored segment. Width = percentage of total income
- Colors come from `accountColors` in the store (same colors as [`AccountTag`](AccountTag.md))
- Hovering a segment shows a tooltip with account name, amount, and percentage
- A legend below the bar shows each account with its color dot and percentage

## Returns null

If there are no income transactions, the component renders nothing.
