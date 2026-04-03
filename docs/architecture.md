# Sagi  Architecture

## What it is

A local-first personal finance tracker. All data lives in LocalStorage. No server.

## Data model

One `Transaction` object is the only entity:

```ts
{
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string   // category label (e.g. "Rent", "Salary")
  account: string       // bank name (e.g. "TEB", "Sparkasse")
  date: string          // "YYYY-MM-DD" for real transactions, "15" (day only) for template items
}
```

## Global state (`src/store.ts`)

| Field | Type | Persisted | Notes |
|---|---|---|---|
| `months` | `Record<YYYY-MM, Transaction[]>` | ✅ | All entered data |
| `template` | `Transaction[]` | ✅ | Recurring items auto-copied to new months |
| `accountColors` | `Record<string, string>` | ✅ | Account name → hex color |
| `activeMonthKey` | `string` | ❌ | Resets to current month on every load |

## Month initialization

Months start blank. Navigating to a new month creates an empty `months[key] = []` entry. To seed a month from the template, click the **Apply Template** button in the MonthBar — it overwrites the current month's transactions with a fresh copy of the template items. Template item `date` field holds a day number (`"15"`) which gets expanded to `YYYY-MM-15`.

## Account colors

Each account gets a color from `src/utils/colors.ts` automatically on first use. Colors are stored in `accountColors` and rendered via the [`AccountTag`](components/AccountTag.md) component everywhere an account appears.

## App shell

```
src/components/Layout.tsx       wraps every page
  src/components/Header.tsx     logo + nav links
  src/components/MonthBar.tsx   ◀ March 2026 ▶ navigator
  <page content via Outlet>
```

## Routes

| Path | Page file | Description |
|---|---|---|
| `/` | [Dashboard](pages/Dashboard.md) | Aggregated income & expense tables + charts |
| `/analytics` | [Analytics](pages/Analytics.md) | Donut charts + net balance |
| `/ledger` | [Ledger](pages/Ledger.md) | Full sortable/filterable transaction table |
| `/template` | [TemplateManager](pages/TemplateManager.md) | Manage recurring template items |

## Shared components

| Component | File |
|---|---|
| AccountTag | [components/AccountTag.md](components/AccountTag.md) |
| TransactionModal | [components/TransactionModal.md](components/TransactionModal.md) |
| CumulativeFooter | [components/CumulativeFooter.md](components/CumulativeFooter.md) |
| BaseBalanceModal | [components/BaseBalanceModal.md](components/BaseBalanceModal.md) |
| IncomeBar | [components/IncomeBar.md](components/IncomeBar.md) |
| ExpenseProgressBars | [components/ExpenseProgressBars.md](components/ExpenseProgressBars.md) |
| CreatableSelect | [components/CreatableSelect.md](components/CreatableSelect.md) |

## Theming

All colours are CSS custom properties defined in `src/index.css`. See [theming.md](theming.md) for the full token reference and dark mode instructions.

## Utility functions (`src/utils/`)

| Function | Where used |
|---|---|
| `aggregateByDescriptionAndAccount` | Dashboard income rows |
| `aggregateByDescriptionWithAccounts` | Dashboard expense rows |
| `aggregateByDescription` | Analytics expense donut |
| `aggregateByAccount` | IncomeBar, ExpenseProgressBars, Analytics income donut |
| `getUniqueDescriptions` / `getUniqueAccounts` | TransactionModal dropdowns, Ledger filters |
| `formatEuro` | Everywhere amounts are displayed |
| `getNextColor` | store.ts auto-assigns account colors |
