# Theming

All colours in Sagi are controlled from a single file: **`src/index.css`**.

No component file contains a hardcoded colour value. Components use semantic Tailwind utility classes (`bg-card`, `text-income`, `border-stroke`, etc.) that map to CSS custom properties. Changing a token in `index.css` updates every place that token is used across the entire app.

---

## How it works

```
src/index.css
  :root { --page: #c8c4bc; ... }        ← the one place you edit
  @theme inline { --color-page: var(--page); ... }  ← maps to Tailwind
  [data-theme="dark"] { --page: #0d1117; ... }       ← dark overrides

Components
  className="bg-page text-ink border-stroke"  ← never a hex value
```

The `@theme inline` block tells Tailwind v4 to generate utilities (`bg-page`, `text-ink`, etc.) that reference the CSS variables instead of inlining static values. This means the variables can be swapped at runtime for dark/light switching.

---

## Token reference

### Surfaces

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--page` | `bg-page` | `#c8c4bc` | `#0d1117` | Page background |
| `--card` | `bg-card` | `#d4d0c8` | `#161b22` | Cards, panels |
| `--subtle` | `bg-subtle` | `#ccc8c0` | `#21262d` | Input fields, alternating table rows |
| `--hover` | `bg-hover` | `#c0bdb5` | `#30363d` | Hover states, progress bar track |
| `--thead` | `bg-thead` | `#cac6be` | `#1c2128` | Table headers, dropdown options hover |
| `--monthbar` | `bg-monthbar` | `#c4c0b8` | `#161b22` | MonthBar strip |

### Borders

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--stroke` | `border-stroke` | `#aeaaa2` | `#30363d` | Primary borders, dividers |
| `--stroke-light` | `border-stroke-light` | `#c0bcb4` | `#21262d` | Subtle inner borders (table rows) |

### Text

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--ink` | `text-ink` | `#2c2825` | `#e2e8f0` | Primary body text |
| `--ink-muted` | `text-ink-muted` | `#5a5650` | `#8b949e` | Secondary labels, nav items |
| `--ink-faint` | `text-ink-faint` | `#807870` | `#6e7681` | Timestamps, column headers, hints |
| `--ink-ghost` | `text-ink-ghost` | `#a09890` | `#484f58` | Placeholder text |

### Income (olive green)

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--income` | `text-income` | `#2e3c14` | `#8aa868` | Income text, amounts |
| `--income-surface` | `bg-income-surface` | `#bfcda0` | `#1a2810` | Income card header background |
| `--income-btn` | `bg-income-btn` | `#b0c08c` | `#243418` | Add Income button, type badge |
| `--income-btn-hover` | `bg-income-btn-hover` | `#a4b47c` | `#2e4220` | Add Income button hover |
| `--income-stroke` | `border-income-stroke` | `#90a868` | `#3a5428` | Income card border bottom |

### Expense (warm brick)

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--expense` | `text-expense` | `#581010` | `#c06868` | Expense text, amounts |
| `--expense-surface` | `bg-expense-surface` | `#c9a0a0` | `#281010` | Expense card header background |
| `--expense-btn` | `bg-expense-btn` | `#bc9090` | `#381818` | Add Expense button, type badge |
| `--expense-btn-hover` | `bg-expense-btn-hover` | `#b08080` | `#442020` | Add Expense button hover |
| `--expense-stroke` | `border-expense-stroke` | `#a07070` | `#6a2c2c` | Expense card border bottom |

### Accent & Danger

| Token | Tailwind class | Light value | Dark value | Used for |
|---|---|---|---|---|
| `--accent` | `text-accent`, `bg-accent`, `border-accent` | `#BC6C25` | `#e8914a` | Logo, nav active, buttons, focus rings, Apply Template |
| `--danger` | `text-danger`, `border-danger` | `#9D1B1B` | `#f87171` | Destructive confirm text/border, delete icon hover |

---

## Switching themes at runtime

The dark/light state is stored in `localStorage` under the key `sagi-theme` and applied as `data-theme="dark"` on `<html>`. The toggle button lives in the Header (moon/sun icon, right of the nav).

To switch programmatically:
```js
document.documentElement.dataset.theme = 'dark'   // dark
document.documentElement.dataset.theme = 'light'  // light
localStorage.setItem('sagi-theme', 'dark')         // persist it
```

---

## Adding a new theme

1. Add a new attribute block in `src/index.css`:
   ```css
   [data-theme="sepia"] {
     --page: #f1e7d0;
     --card: #faf3e0;
     /* ...override any tokens you want to change... */
   }
   ```
2. Set `document.documentElement.dataset.theme = 'sepia'` anywhere in JS.
3. No component files need to change.

---

## Account tag colours

Account tags use per-account hex colours stored in `accountColors` (chosen from `src/utils/colors.ts`). The `AccountTag` component observes `data-theme` via a `MutationObserver` and adjusts background and border opacity automatically — higher opacity in dark mode so tags stay clearly visible against dark surfaces.

All palette colours are mid-tones chosen to work in both themes. Avoid very dark colours (near-black) in the palette as they become unreadable in dark mode.

## Progress bar thresholds

The `ExpenseProgressBars` component uses `var(--danger)`, `var(--accent)`, and `var(--ink-faint)` directly for its threshold colours (>80% spent = danger, 50–80% = accent, <50% = faint). These automatically follow the active theme.
