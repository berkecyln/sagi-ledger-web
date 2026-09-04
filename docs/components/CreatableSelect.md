# CreatableSelect

**File:** `src/components/CreatableSelect.tsx`

A combobox input that shows a filtered dropdown of existing options and allows typing a new value that isn't in the list.

## Props

| Prop | Type | Notes |
|---|---|---|
| `value` | `string` | Controlled value |
| `onChange` | `(val: string) => void` | Called on every keystroke and on selection |
| `options` | `string[]` | Existing options to show in dropdown |
| `placeholder` | `string?` | Input placeholder text |
| `id` | `string?` | For `<label htmlFor>` linkage |
| `onCreate` | `((val: string) => void)?` | Called **only** when the "Create X" row is clicked. Omit for an ad-hoc field with no saved list |
| `onDelete` | `((val: string) => void)?` | When provided, each option row gets a cross to remove it from the saved list |

## Behaviour

- Typing filters the options list
- If the trimmed typed value doesn't exist in options, a "Create X" entry appears at the bottom
- Typing alone never saves a label, only the "Create X" row does, via `onCreate`
- With `onDelete`, hovering an option reveals a cross that removes the label from the list without touching any transaction
- Clicking outside closes the dropdown and clears the field if empty

## Used in

[`TransactionModal`](TransactionModal.md):

- **Description**: curated list from `store.descriptions[type]`, with `onCreate` + `onDelete` bound to the modal's transaction type
- **Account**: still derived from existing transactions via `getUniqueAccounts`, no create/delete wiring yet
