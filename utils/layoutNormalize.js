//utils/layoutNormalize.js
export const normalizeLayoutsFromUnitTypeSelector = (p) =>
  Array.isArray(p)
    ? p
    : Number(p) > 0
    ? Array.from({ length: Number(p) }, () => ({}))
    : [];
