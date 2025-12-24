//utils/numberUtils.js
export const formatNumber = (num) => {
  if (num === "" || num === null || num === undefined) return "";
  return Number(String(num).replace(/,/g, "")).toLocaleString();
};

export const parseNumber = (val) =>
  String(val || "").replace(/,/g, "");

export const toCount = (val) => {
  const n = Number(parseNumber(val));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};
