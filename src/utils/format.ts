export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("en-MY", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export const formatPercent = (value: number, digits = 1) =>
  `${(value * 100).toFixed(digits)}%`;
