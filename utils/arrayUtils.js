// utils/arrayUtils.js

export function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === "") return [];
  return [v];
}

export function getName(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") return item.name || item.label || "";
  return String(item);
}

export function parseSubtypeToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
