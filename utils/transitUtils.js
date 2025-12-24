// utils/transitUtils.js

export function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

/**
 * 把后端/旧数据（可能是 string/bool）规范化为 TransitSelector 可用结构
 * 你原本 UnitLayoutForm 里就是这么做的，只是搬到 utils
 */
export function normalizeTransitToSelector(layout) {
  const l = layout || {};
  return {
    walkToTransit: toBool(l.walkToTransit),
    transitLines: Array.isArray(l.transitLines) ? l.transitLines : [],
    transitStations: Array.isArray(l.transitStations) ? l.transitStations : [],
    transitNotes: l.transitNotes || "",
  };
}

/**
 * TransitSelector 输出回 layout 的结构（保持你原本字段名）
 */
export function normalizeTransitFromSelector(prevLayout, selectorValue) {
  const prev = prevLayout || {};
  const v = selectorValue || {};
  return {
    ...prev,
    walkToTransit: !!v.walkToTransit,
    transitLines: Array.isArray(v.transitLines) ? v.transitLines : [],
    transitStations: Array.isArray(v.transitStations) ? v.transitStations : [],
    transitNotes: v.transitNotes || "",
  };
}
