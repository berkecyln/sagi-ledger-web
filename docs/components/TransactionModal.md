# TransactionModal

**File:** `src/components/TransactionModal.tsx`

A modal dialog used for adding and editing transactions. Shared across Dashboard, Ledger, and Template Manager.

## Props

| Prop | Type | Notes |
|---|---|---|
| `type` | `'INCOME' \| 'EXPENSE'` | Controls header color and which store action is called |
| `onClose` | `() => void` | Called on cancel or successful submit |
| `editTransaction` | `Transaction?` | When provided, pre-fills all fields and calls update instead of add |
| `isTemplate` | `boolean?` | When true, writes to `template` array. Swaps date picker for day-of-month input. |

## Fields

- **Amount** — number input
- **Date** — date picker (normal mode) OR day-of-month 1–28 (template mode)
- **Description** — [`CreatableSelect`](CreatableSelect.md) populated from all existing descriptions
- **Account** — [`CreatableSelect`](CreatableSelect.md) populated from all existing accounts
- **Account color** — swatch picker (12 colors) appears when account field has a value. Clicking a swatch immediately calls `setAccountColor` and updates everywhere.

## Modes

| Mode | Triggered by | Store action |
|---|---|---|
| Add transaction | `editTransaction` not set, `isTemplate` false | `addTransaction` |
| Edit transaction | `editTransaction` provided | `updateTransaction` |
| Add template item | `isTemplate` true | `addTemplateItem` |
| Edit template item | `editTransaction` + `isTemplate` true | `updateTemplateItem` |
