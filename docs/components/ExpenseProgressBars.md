# ExpenseProgressBars

**File:** `src/components/ExpenseProgressBars.tsx`

One bar per account showing how much of the month's income was spent. Shown under the expense column on the Dashboard.

## Calculation

```
spent = expenses / income × 100   (100% when the account has no income)
remaining = income - expenses
```

Active month only.

## Appearance

- Left: [`AccountTag`](AccountTag.md). Right: `18% Spent | 1.637,00 € remaining`.
- The bar uses the account colour and stops at 100%.
- The label turns accent from 50% and danger from 80%, following the theme.

Renders nothing when there are no transactions this month.
