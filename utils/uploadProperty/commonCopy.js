// utils/uploadProperty/commonCopy.js

// ✅ 你要复制/脱钩的 common 字段（只做这四个）
export const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

// 深拷贝，避免引用共享导致“改一个影响全部”
export function cloneDeep(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

// 只提取 common 字段
export function pickCommon(layout) {
  const o = layout || {};
  return {
    extraSpaces: Array.isArray(o.extraSpaces) ? o.extraSpaces : [],
    furniture: Array.isArray(o.furniture) ? o.furniture : [],
    facilities: Array.isArray(o.facilities) ? o.facilities : [],
    transit: o.transit ?? null,
  };
}

// 用于判断 common 是否变化
export function commonHash(layout) {
  try {
    return JSON.stringify(pickCommon(layout));
  } catch {
    return String(Date.now());
  }
}
