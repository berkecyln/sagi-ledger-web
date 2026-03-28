# ExpenseProgressBars

**File:** `src/components/ExpenseProgressBars.tsx`

One horizontal progress bar per account showing spending vs income for the **active month only**. Shown at the bottom of the Expense column on the Dashboard.

## Per-account calculation

`pct = (monthExpense / monthIncome) * 100`

If an account has no income this month, `pct` is set to 100%.

## Color thresholds (bar fill)

| % spent | Bar color |
|---|---|
| < 50% | Slate (account color at 80% opacity) |
| 50–80% | Amber text warning |
| > 80% | Red text warning |

The bar fill uses the account's color. The right-side text label changes color based on threshold to draw attention.

## Labels

- Left: [`AccountTag`](AccountTag.md) with the account's color
- Right: "18% Spent — €1,637 remaining"

## Returns null

If there are no transactions this month, renders nothing.
