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
- Removes an account entirely via `deleteAccount`

If a newly added account has no color yet, it gets the next palette color from `getNextColor`.

## Form sections

- Existing accounts list:
  - account color dot + account name
  - number input for base amount
  - remove button, disabled while the account is still used
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

## Removing an account

Accounts are never stored as their own entity, they exist as keys in `accountColors` and `baseAccountBalances`. The remove button deletes those keys plus any stale `monthlyBalances` entry, which is what clears a leftover typo account such as "Teb" out of this list.

`deleteAccount` is guarded by `isAccountInUse`: while any transaction in any month or any template item still names the account, the store ignores the call and the button renders disabled with a "Still used by transactions" title. Deletion is therefore only ever possible when there is no data to lose, and retyping the name recreates the account on next use.

Deleting also drops the row from the modal's local `balances` state, otherwise Save would write the base balance straight back.

## Styling notes

Uses semantic theme tokens (`text-ink`, `text-ink-muted`, `border-stroke`, `bg-accent`, etc.) so colors follow light/dark theme automatically.
Account labels use per-account color from `accountColors`, matching the color dot.