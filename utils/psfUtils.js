//utils/psfUtils.js
import { getAreaSqftFromAreaSelector } from "./areaUtils";
import { getPriceRange } from "./priceUtils";

export const calcPsfText = (layout) => {
  const sqft = getAreaSqftFromAreaSelector(layout?.area);
  const { low, high } = getPriceRange(layout);
  if (!sqft || !low || !high) return "";
  return `每平方英尺: RM ${(low / sqft).toFixed(2)} ~ RM ${(high / sqft).toFixed(2)}`;
};
