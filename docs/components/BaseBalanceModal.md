# BaseBalanceModal

**File:** `src/components/BaseBalanceModal.tsx`

Sets each account's starting balance, adds new accounts and removes unused ones. Opened from the gear in [`TotalBalances`](TotalBalances.md).

## Props

| Prop | Type | Notes |
|---|---|---|
| `onClose` | `() => void` | Called on Cancel and after Save |

## Rows

- **Existing accounts:** colour dot, name, balance field and a remove button.
- **New accounts:** name and balance fields, added with **Add New Account**.

## Removing an account

The cross marks the account for removal: its name and balance are crossed out and the cross becomes an undo arrow. Nothing is deleted until Save.

The cross is disabled while any transaction or template item uses the account (`isAccountInUse`). Deleting an account never deletes transactions.

## Save and Cancel

**Save** writes every change at once:

- balances, an empty field saves `0`
- new accounts with a name, each gets the next palette colour
- removal of marked accounts

**Cancel** closes without changing anything. It is the only way out besides Save.
