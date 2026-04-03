# BaseBalanceModal

**File:** `src/components/BaseBalanceModal.tsx`

A modal for editing per-account starting balances (base balances) and creating brand new accounts with initial amounts.

Used from [`CumulativeFooter`](CumulativeFooter.md) via the settings icon.

## Props

| Prop | Type | Notes |
|---|---|---|
| `onClose` | `() => void` | Called when closing the modal or after successful save |

## What it edits in store

- `baseAccountBalances[account]` via `setBaseAccountBalance`
- `accountColors[account]` via `setAccountColor` (for newly created accounts only)

If a newly added account has no color yet, it gets the next palette color from `getNextColor`.

## Form sections

- Existing accounts list:
  - account color dot + account name
  - number input for base amount
- New account rows:
  - account name input
  - amount input
  - remove row button
- Actions:
  - Add New Account
  - Cancel / Save

## Save behaviour

- Existing account value:
  - valid number -> saves that number
  - empty string -> saves `0`
- New rows:
  - blank name -> skipped
  - invalid or empty amount -> saves `0`
  - missing account color -> auto-assigns one

## Styling notes

Uses semantic theme tokens (`text-ink`, `text-ink-muted`, `border-stroke`, `bg-accent`, etc.) so colors follow light/dark theme automatically.
Account labels use per-account color from `accountColors`, matching the color dot.