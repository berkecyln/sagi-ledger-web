# Template Manager (`/template`)

**File:** `src/pages/TemplateManager.tsx`

## What it is

A list of recurring transactions that get auto-copied into every **new** month when it's first opened. Changes here do not affect months that already exist.

## Columns

Description · Account ([`AccountTag`](../components/AccountTag.md)) · Day · Amount · Actions

## Day column

Shows the day of month this item will be dated when copied (e.g. "Day 15"). If no day was set it shows "—" and the item gets dated the 1st of the month.

## Edit & delete

Each row has a pencil icon (edit) and trash icon (delete). Edit opens [`TransactionModal`](../components/TransactionModal.md) in template mode, where the date field is a "Day of month (1–28)" number input instead of a full date picker.
