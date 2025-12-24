// utils/unitLayoutForm/area.js

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
    if (u.includes("acre")) {
      return num * 43560;
    }
    if (u.includes("hectare")) {
      return num * 107639;
    }
    return num; // 默认 sqft
  };

  const types = Array.isArray(area.types) ? area.types : [];
  const units = area.units || {};
  const values = area.values || {};

  let total = 0;
  types.forEach((t) => {
    const v = values[t];
    const u = units[t];
    total += convertToSqFt(v, u);
  });

  return total;
}
