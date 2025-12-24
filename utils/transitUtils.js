//utils/transitUtils.js
const toBool = (v) => {
  if (v === true || v === false) return v;
  const s = String(v).toLowerCase();
  if (["yes", "true", "1"].includes(s)) return true;
  if (["no", "false", "0"].includes(s)) return false;
  return null;
};

export const normalizeTransitToSelector = (v) =>
  v?.walkable !== undefined ? v : v != null ? { walkable: toBool(v) } : null;

export const normalizeTransitFromSelector = (v) =>
  v?.walkable !== undefined ? v : null;
