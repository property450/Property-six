// utils/areaUtils.js

/**
 * 把 AreaSelector 返回的对象，转换成「总平方英尺」
 * （从你 UnitLayoutForm 里原封不动抽出来）
 */
export function getAreaSqftFromAreaSelector(area) {
  if (!area) return 0;

  const convertToSqFt = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("sq ft") || u.includes("square feet") || u.includes("sqft")) {
      return num;
    }
    if (u.includes("acre")) {
      return num * 43560;
    }
    if (u.includes("hectare")) {
      return num * 107639;
    }
    return num;
  };

  const builtUpSqft = convertToSqFt(area.builtUpValue, area.builtUpUnit);
  const landSqft = convertToSqFt(area.landValue, area.landUnit);

  // 以 builtUp 为主；如果没有 builtUp，才用 land
  return builtUpSqft > 0 ? builtUpSqft : landSqft;
}
