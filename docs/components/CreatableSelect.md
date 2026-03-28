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

## Behaviour

- Typing filters the options list
- If the typed value doesn't exist in options, a "Create X" entry appears at the bottom
- Clicking outside closes the dropdown and clears the field if empty

## Used in

[`TransactionModal`](TransactionModal.md) — Description and Account fields.
