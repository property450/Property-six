//utils/areaUtils.js
export const convertToSqft = (val, unit) => {
  const n = Number(String(val || "").replace(/,/g, ""));
  if (!n) return 0;
  const u = String(unit).toLowerCase();
  if (u.includes("sqm")) return n * 10.7639;
  if (u.includes("acre")) return n * 43560;
  return n;
};

export const getAreaSqftFromAreaSelector = (area) =>
  (area?.types || []).reduce(
    (sum, t) => sum + convertToSqft(area.values?.[t], area.units?.[t]),
    0
  );
