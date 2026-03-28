# AccountTag

**File:** `src/components/AccountTag.tsx`

A small colored badge showing an account name. Used everywhere an account name appears in the UI.

## Props

| Prop | Type | Notes |
|---|---|---|
| `account` | `string` | Account name to display |
| `color` | `string?` | Hex color from `accountColors`. Falls back to gray if undefined. |

## Appearance

Colored dot + account name text. Background and border are tinted versions of the account color (low opacity so it's readable).

## Where it's used

- Dashboard income rows (one tag per row)
- Dashboard expense rows (one or more tags if multiple accounts)
- Ledger account column
- Template Manager account column
- ExpenseProgressBars account labels

## Changing a color

Open any [`TransactionModal`](TransactionModal.md), type or select the account name, then click a color swatch in the "Account color" picker that appears below the field. Color updates immediately everywhere.
