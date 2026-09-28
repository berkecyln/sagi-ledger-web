# AccountTag

**File:** `src/components/AccountTag.tsx`

Coloured badge with a dot and the account name. Used wherever an account name appears.

## Props

| Prop | Type | Notes |
|---|---|---|
| `account` | `string` | Account name |
| `color` | `string?` | Hex colour from `accountColors`, grey when missing |

## Appearance

Text and dot use the account colour. Background and border are the same colour at low opacity, slightly stronger in dark mode. The component watches `data-theme` on `<html>` so it updates when the theme changes.

Palette colours in `src/utils/colors.ts` are mid tones so they stay readable in both themes.

## Changing a colour

Pick a swatch under the account field in [`TransactionModal`](TransactionModal.md). The change applies everywhere at once.
