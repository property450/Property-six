// utils/numberUtils.js

export function formatNumber(val) {
  const num = Number(String(val ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-MY");
}

export function parseNumber(val) {
  const num = Number(String(val ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(num)) return 0;
  return num;
}

export function toCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}
