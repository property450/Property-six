// utils/psfUtils.js

/** 把 AreaSelector 返回的对象，转换成「总平方英尺」 */
export function getAreaSqftFromAreaSelector(area) {
  if (!area) return 0;

  const convertToSqFt = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认 sqft
  };

  const types = Array.isArray(area.types) ? area.types : [];
  const units = area.units || {};
  const values = area.values || {};

  let total = 0;
  types.forEach((t) => {
    total += convertToSqFt(values[t], units[t]);
  });

  return total;
}

/** 统一解析价格范围：支持单值 / 区间对象 / 字符串 */
export function getPriceRange(priceValue) {
  let minPrice = 0;
  let maxPrice = 0;

  if (!priceValue) return { minPrice, maxPrice };

  // 区间对象
  if (typeof priceValue === "object") {
    const low = Number(String(priceValue.priceLow ?? priceValue.min ?? "").replace(/,/g, "")) || 0;
    const high = Number(String(priceValue.priceHigh ?? priceValue.max ?? "").replace(/,/g, "")) || 0;
    minPrice = low;
    maxPrice = high;
    return { minPrice, maxPrice };
  }

  // 字符串/数字
  const num = Number(String(priceValue).replace(/,/g, "")) || 0;
  minPrice = num;
  maxPrice = num;
  return { minPrice, maxPrice };
}

/** 生成「每平方英尺 RM xxx.xx ~ RM yyy.yy」 */
export function getPsfText(areaObj, priceValue) {
  const totalAreaSqft = getAreaSqftFromAreaSelector(areaObj);
  const { minPrice, maxPrice } = getPriceRange(priceValue);

  if (!totalAreaSqft || totalAreaSqft <= 0) return "";
  if (!minPrice && !maxPrice) return "";

  const lowPrice = minPrice > 0 ? minPrice : maxPrice;
  const highPrice = maxPrice > 0 ? maxPrice : minPrice;

  if (!lowPrice) return "";

  const lowPsf = lowPrice / totalAreaSqft;
  const highPsf = highPrice > 0 ? highPrice / totalAreaSqft : lowPsf;

  if (!isFinite(lowPsf)) return "";

  if (Math.abs(highPsf - lowPsf) < 0.005) {
    return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ~ RM ${highPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
