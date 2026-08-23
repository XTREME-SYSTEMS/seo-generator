export const money = (value) =>
  value === null || value === undefined
    ? 'UNKNOWN'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export const pct = (value) =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;

export const num = (value) =>
  value === null || value === undefined ? '—' : new Intl.NumberFormat('en-US').format(value);