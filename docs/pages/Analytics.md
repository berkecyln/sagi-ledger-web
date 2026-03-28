# Analytics (`/analytics`)

**File:** `src/pages/Analytics.tsx`

## What it shows

Two donut charts side by side for the active month, plus a centered net balance card below.

## Income donut (left)

- Grouped by **account** — shows which bank received income
- Segment colors come from `accountColors` (the same colors shown in [`AccountTag`](../components/AccountTag.md))

## Expense donut (right)

- Grouped by **description** — shows spending categories (Rent, Groceries, etc.)
- Colors are a fixed rose/orange palette (not account colors, since categories don't have colors)

## Net balance card

Centered below the charts. Shows `+€X,XXX` or `-€X,XXX` in green or red.
