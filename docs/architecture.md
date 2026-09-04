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
| `monthlyBalances` | `Record<YYYY-MM, Record<account, number>>` | ✅ | Cached net per account per month |
| `baseAccountBalances` | `Record<string, number>` | ✅ | User-set starting balance per account |
| `descriptions` | `Record<'INCOME' \| 'EXPENSE', string[]>` | ✅ | User-curated label lists, one per type, see below |
| `activeMonthKey` | `string` | ❌ | Resets to current month on every load |

Persisted under `sagi-storage` at **version 2**, so no suggestions are lost on upgrade:

| Migration | Does |
|---|---|
| v0 to v2 | Builds both lists from labels already used in `months` + `template`, grouped by transaction type |
| v1 to v2 | Same, plus any label from the old flat list that is not yet in use goes to both lists, since it carries no type |

## Description labels

`descriptions` holds one suggestion list per transaction type. Income and expense labels never mix: the Add Income modal only ever sees `descriptions.INCOME`.

It is **explicit, not derived**: typing a new label into the field does not save it. Only clicking the `Create "X"` row does, via `addDescription(type, label)`. The cross on each dropdown row calls `deleteDescription(type, label)`, which removes the suggestion only; existing transactions keep their description text.

## Accounts

Accounts have no entity of their own. A name exists because it is a key in `accountColors`, created automatically by `ensureAccountColor` the first time any transaction names it, or by BaseBalanceModal when you add one by hand. `accountColors` is therefore the account registry, and both the CumulativeFooter and BaseBalanceModal list it, so the two always agree.

`deleteAccount` removes the name from `accountColors`, `baseAccountBalances` and any stale `monthlyBalances` entry. It is guarded by `isAccountInUse` and does nothing while a transaction or template item still names the account, so removal can never orphan data. The remove button in [`BaseBalanceModal`](components/BaseBalanceModal.md) renders disabled in that case.

The account dropdown in TransactionModal is still derived via `getUniqueAccounts`, so it lists names in use rather than the `accountColors` keys.

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
| `getUniqueDescriptions` | Ledger description filter (reflects real data, not the curated list) |
| `getUniqueAccounts` | TransactionModal account dropdown, Ledger account filter |
| `isAccountInUse` | Guards `deleteAccount`, disables the remove button in BaseBalanceModal |
| `formatEuro` | Everywhere amounts are displayed |
| `getNextColor` | store.ts auto-assigns account colors |
