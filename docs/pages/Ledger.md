# Ledger (`/ledger`)

**File:** `src/pages/Ledger.tsx`

## What it shows

Every individual transaction for the active month in a sortable, filterable table.

## Columns

Date · Type (badge) · Description · Account ([`AccountTag`](../components/AccountTag.md)) · Amount · Actions

## Sorting

Click any column header to sort ascending. Click again for descending.

## Filters

A filter bar above the table with three dropdowns:
- **Type** — All / Income / Expense
- **Description** — populated from all unique descriptions across all months
- **Account** — populated from all unique accounts across all months

"Clear filters" button appears when any filter is active.

## Edit & delete

Each row has a pencil icon (edit) and trash icon (delete). Edit opens [`TransactionModal`](../components/TransactionModal.md) pre-filled with the transaction's current values.
