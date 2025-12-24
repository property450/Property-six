// utils/uploadProperty/normalizeLayouts.js

// ✅【关键修复】把 UnitTypeSelector onChange 的返回值，统一变成 layouts 数组
export function normalizeLayoutsFromUnitTypeSelector(payload) {
  // 1) 已经是数组 -> 直接返回
  if (Array.isArray(payload)) return payload;

  // 2) 可能直接回传数字（选择了几个房型）
  if (typeof payload === "number") {
    const n = Math.max(0, Math.floor(payload));
    return Array.from({ length: n }, () => ({}));
  }

  // 3) 可能回传字符串数字
  if (typeof payload === "string" && /^\d+$/.test(payload.trim())) {
    const n = Math.max(0, Math.floor(Number(payload.trim())));
    return Array.from({ length: n }, () => ({}));
  }

  // 4) 可能是对象：{ count: 3 } / { layoutCount: 3 } / { unitCount: 3 }
  if (payload && typeof payload === "object") {
    // 常见字段优先：layouts / unitLayouts
    if (Array.isArray(payload.layouts)) return payload.layouts;
    if (Array.isArray(payload.unitLayouts)) return payload.unitLayouts;

    // 常见 count 字段
    const maybeCount =
      payload.count ??
      payload.layoutCount ??
      payload.unitTypeCount ??
      payload.unitCount ??
      payload.numLayouts ??
      payload.quantity;

    if (typeof maybeCount === "number") {
      const n = Math.max(0, Math.floor(maybeCount));
      return Array.from({ length: n }, () => ({}));
    }
    if (typeof maybeCount === "string" && /^\d+$/.test(maybeCount.trim())) {
      const n = Math.max(0, Math.floor(Number(maybeCount.trim())));
      return Array.from({ length: n }, () => ({}));
    }
  }

  // 5) 不认识的格式 -> 返回空
  return [];
}
