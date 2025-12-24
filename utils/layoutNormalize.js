// utils/layoutNormalize.js

import { cloneDeep } from "./commonFields";

/**
 * UnitTypeSelector 产生的 layouts（或 upload-property 内部）标准化
 * 保持你原本 upload-property 里的 normalize 逻辑，只是抽出来
 */
export function normalizeLayoutsFromUnitTypeSelector(layouts) {
  const arr = Array.isArray(layouts) ? layouts : [];
  return arr.map((l) => {
    const c = cloneDeep(l);
    if (!c._uiId) c._uiId = `layout_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    return c;
  });
}
