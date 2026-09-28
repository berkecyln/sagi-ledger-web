# TransactionModal

**File:** `src/components/TransactionModal.tsx`

Form to add or edit a transaction or a template item. Used by the Dashboard, Ledger and Template pages.

## Props

| Prop | Type | Notes |
|---|---|---|
| `type` | `'INCOME' \| 'EXPENSE'` | Header colour and which label list is shown |
| `onClose` | `() => void` | Called on cancel and after saving |
| `editTransaction` | `Transaction?` | Fills the form and saves as an edit |
| `isTemplate` | `boolean?` | Saves to the template, date becomes a day of month |

## Fields

- **Amount:** typed as text, `12,50` and `12.50` both work. Stored as cents. Negative or invalid amounts show an error.
- **Date:** date picker, or **Day of month** (1 to 31, optional) in template mode.
- **Description:** [`CreatableSelect`](CreatableSelect.md) with the labels for this type, including create and delete.
- **Account:** [`CreatableSelect`](CreatableSelect.md) with every known account. A new name creates the account on save.
- **Account colour:** swatches shown once an account is chosen. A click changes the colour straight away.

## Modes

| Mode | Store action |
|---|---|
| Add transaction | `addTransaction` |
| Edit transaction | `updateTransaction` |
| Add template item | `addTemplateItem` |
| Edit template item | `updateTemplateItem` |

## On phones

Full screen. The fields scroll and Cancel and Save stay at the bottom, above the keyboard.
