//utils/arrayUtils.js
export const toArray = (val) =>
  Array.isArray(val) ? val : val ? [val] : [];

export const getName = (item) =>
  typeof item === "string"
    ? item
    : item?.label || item?.value || item?.name || "";

export const parseSubtypeToArray = (val) =>
  Array.isArray(val) ? val : val ? [String(val)] : [];
