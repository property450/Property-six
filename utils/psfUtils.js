// utils/psfUtils.js

import { getAreaSqftFromAreaSelector } from "./areaUtils";
import { getPriceRange } from "./priceUtils";

/**
 * 生成 psf 文本：RM xxx.xx ~ RM yyy.yy
 * 你原本 UnitLayoutForm 的链路逻辑保持一致，只是独立出来
 */
export function getPsfText(areaObj, priceObj) {
  const sqft = getAreaSqftFromAreaSelector(areaObj);
  if (!sqft || sqft <= 0) return "";

  const { min, max } = getPriceRange(priceObj);
  if (!min && !max) return "";

  const psfMin = min > 0 ? min / sqft : 0;
  const psfMax = max > 0 ? max / sqft : 0;

  const fmt = (v) => {
    if (!v || !Number.isFinite(v) || v <= 0) return "";
    return v.toFixed(2);
  };

  if (psfMin && psfMax) return `每平方英尺: RM ${fmt(psfMin)} ~ RM ${fmt(psfMax)}`;
  if (psfMin) return `每平方英尺: RM ${fmt(psfMin)}`;
  if (psfMax) return `每平方英尺: RM ${fmt(psfMax)}`;
  return "";
}
