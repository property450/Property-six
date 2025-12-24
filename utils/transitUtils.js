// utils/transitUtils.js

// ================== Transit value normalize (防止选择后又跳回“请选择”) ==================
function toBool(v) {
  if (v === true || v === false) return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "yes" || s === "y" || s === "true" || s === "1") return true;
  if (s === "no" || s === "n" || s === "false" || s === "0") return false;
  return null;
}

// 给 TransitSelector 的 value：尽量使用对象 { walkable: boolean }
export function normalizeTransitToSelector(val) {
  if (!val) return null;

  if (typeof val === "object") {
    if (typeof val.walkable === "boolean") return { walkable: val.walkable };
    if (typeof val.value !== "undefined") {
      const b = toBool(val.value);
      return b === null ? null : { walkable: b };
    }
  }

  const b = toBool(val);
  return b === null ? null : { walkable: b };
}

export function normalizeTransitFromSelector(val) {
  if (!val) return null;

  if (typeof val === "object") {
    if (typeof val.walkable === "boolean") return { walkable: val.walkable };
    if (typeof val.value !== "undefined") {
      const b = toBool(val.value);
      return b === null ? null : { walkable: b };
    }
    if (typeof val.target?.value !== "undefined") {
      const b = toBool(val.target.value);
      return b === null ? null : { walkable: b };
    }
  }

  const b = toBool(val);
  return b === null ? null : { walkable: b };
}
