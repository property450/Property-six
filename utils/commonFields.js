// utils/commonFields.js

export const COMMON_KEYS = [
  "category",
  "subType",
  "tenure",
  "usage",
  "saleType",
  "storeys",
  "facing",
  "furniture",
  "facilities",
  "walkToTransit",
  "transitLines",
  "transitStations",
  "transitNotes",
];

export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

export function pickCommon(layout) {
  const l = layout || {};
  const out = {};
  COMMON_KEYS.forEach((k) => {
    out[k] = l[k];
  });
  return out;
}

export function commonHash(commonObj) {
  return JSON.stringify(commonObj || {});
}
