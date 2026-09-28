# Template (`/template`)

**File:** `src/pages/TemplateManager.tsx`

The recurring items, such as Salary or Rent, that **Apply Template** in the MonthBar copies into a month. Applying replaces that month's transactions. Changing the template does not change months already filled.

## Layout

One card for income and one for expenses, each listing Description, Account, Day and Amount. On phones the rows are cards: tap to edit, trash to delete with a confirm.

## Day

The day of the month the item lands on, 1 to 31. A blank day shows as `Day 1`. Days past the end of a month land on its last day, so day 31 becomes the 28th in February.

## Editing

Add, edit and delete use [`TransactionModal`](../components/TransactionModal.md) in template mode, where the date field is a day of month. Desktop deletes ask `Delete? Yes No` first.
