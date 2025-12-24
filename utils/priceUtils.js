// utils/priceUtils.js

/**
 * price 可能是：单价/范围/字符串
 * 这里保持你原本 UnitLayoutForm 的逻辑：尽量拿到 min/max
 */
export function getPriceRange(price) {
  if (!price) return { min: 0, max: 0 };

  if (typeof price === "object" && price !== null) {
    const min = Number(String(price.min ?? "").replace(/,/g, ""));
    const max = Number(String(price.max ?? "").replace(/,/g, ""));
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    };
  }

  // string / number
  const n = Number(String(price).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return { min: 0, max: 0 };
  return { min: n, max: n };
}
