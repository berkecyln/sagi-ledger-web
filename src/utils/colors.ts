export const ACCOUNT_PALETTE = [
  '#495867', // steel blue
  '#64733a', // olive green
  '#BC6C25', // burnt orange
  '#b84444', // muted red (readable on both themes)
  '#7a5c3a', // warm brown
  '#5c7a6e', // muted teal
  '#6e5c7a', // dusty purple
  '#7a6e3a', // golden olive
  '#5c6e7a', // slate
  '#8b6e5c', // terracotta
  '#4e8080', // muted teal (readable on both themes)
  '#7a3a5c', // dusty rose
];

export function getNextColor(existing: Record<string, string>): string {
  const used = new Set(Object.values(existing));
  return ACCOUNT_PALETTE.find((c) => !used.has(c)) ?? ACCOUNT_PALETTE[Object.keys(existing).length % ACCOUNT_PALETTE.length];
}
