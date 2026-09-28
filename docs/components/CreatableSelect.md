# CreatableSelect

**File:** `src/components/CreatableSelect.tsx`

Text field with a filtered suggestion list. Can optionally create new entries and delete existing ones.

## Props

| Prop | Type | Notes |
|---|---|---|
| `value` | `string` | Current value |
| `onChange` | `(val: string) => void` | Called on typing and on selection |
| `options` | `string[]` | Suggestions |
| `placeholder` | `string?` | |
| `id` | `string?` | For the label |
| `onCreate` | `(val: string) => void?` | Adds a `Create "X"` row when the typed value is new |
| `onDelete` | `(val: string) => void?` | Lets the user delete suggestions |

## Behaviour

- Typing filters the list. Typing alone never saves a new entry, only the `Create "X"` row does.
- A row is selected on click, so releasing after a scroll or a hold does not select it.
- Clicking outside closes the list.

## Deleting a suggestion

- **Desktop:** a cross appears when hovering a row.
- **Touch:** holding a row for half a second turns it into `Delete "X"? Yes No`. A hint at the bottom of the list says so.

Deleting removes the suggestion only. Transactions keep their text.

## Used in

[`TransactionModal`](TransactionModal.md):

- **Description:** labels for the modal's type, with create and delete.
- **Account:** every known account, no create or delete. A new name is created when the transaction is saved.
