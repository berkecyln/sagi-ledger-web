# Ledger (`/ledger`)

**File:** `src/pages/Ledger.tsx`

Every transaction of the active month.

## Search and filters

- **Search** matches description, account or amount.
- **Filters** by type, description and account. The description and account lists come from the transactions of every month, so they show what is actually in the data.
- Both apply to the active month only.

## Desktop

A table with Date, Type, Description, Account and Amount. Clicking a column header sorts by it, clicking again reverses. Newest first by default.

Each row has edit and delete. Delete asks `Delete? Yes No` before removing the row.

## On phones

- Filters sit behind a toggle next to the search, with a dot when any filter is active.
- Rows are cards, newest first. Tapping a card opens it for editing.
- The trash icon asks `Delete "X"? Yes No` in place of the card.

Editing opens [`TransactionModal`](../components/TransactionModal.md) with the current values.
