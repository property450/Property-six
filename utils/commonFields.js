//utils/commonFields.js
export const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

export const cloneDeep = (v) => JSON.parse(JSON.stringify(v || {}));

export const pickCommon = (l = {}) =>
  Object.fromEntries(COMMON_KEYS.map((k) => [k, l[k]]));

export const commonHash = (l) => JSON.stringify(pickCommon(l));
