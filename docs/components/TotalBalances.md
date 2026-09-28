# TotalBalances

**File:** `src/components/TotalBalances.tsx`

Balance of every account across all months. One file with two layouts that share the same pieces.

| Export | Where |
|---|---|
| `TotalBalancesFooter` | bar under every page, desktop only |
| `TotalBalancesCard` | card on the Dashboard, phones only |

## Calculation

`getTotalBalances` in `src/utils/aggregations.ts`:

```
total = base balance + income - expenses, over every month
```

Every known account is listed, including ones with no transactions, so the list always matches [`BaseBalanceModal`](BaseBalanceModal.md). Sorted highest first. Nothing is shown when there are no accounts.

## Appearance

Account name in its colour, amount green when zero or above and red when negative. The gear button opens [`BaseBalanceModal`](BaseBalanceModal.md).
