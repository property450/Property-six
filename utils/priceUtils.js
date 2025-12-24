//utils/priceUtils.js
import { parseNumber } from "./numberUtils";

export const getPriceRange = (o = {}) => ({
  low: Number(parseNumber(o.priceLow || o.price)) || 0,
  high: Number(parseNumber(o.priceHigh || o.price)) || 0,
});
