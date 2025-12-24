// components/UnitTypeSelector.js
"use client";

import { useEffect, useMemo, useState } from "react";

function createEmptyLayout() {
  return {
    _uiId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
}

export default function UnitTypeSelector({
  saleType,
  computedStatus,
  unitLayouts,
  setUnitLayouts,
}) {
  const [count, setCount] = useState(1);

  const shouldShow = useMemo(() => {
    const s1 = String(saleType || "").toLowerCase();
    const s2 = String(computedStatus || "").toLowerCase();

    // ✅ 兼容旧命名 + 你现在实际在用的命名
    const byStatus =
      s2 === "new project / under construction".toLowerCase() ||
      s2 === "completed unit / developer unit".toLowerCase();

    const bySaleType =
      s1 === "new project (developer)".toLowerCase() ||
      s1 === "completed unit (developer)".toLowerCase();

    return byStatus || bySaleType;
  }, [saleType, computedStatus]);

  useEffect(() => {
    if (!shouldShow) return;

    const arr = Array.isArray(unitLayouts) ? unitLayouts : [];
    const n = arr.length > 0 ? arr.length : 1;
    setCount(n);

    setUnitLayouts((prev) => {
      const p = Array.isArray(prev) ? prev : [];
      if (!p.length) return [createEmptyLayout()];
      return p.map((l) => (l && l._uiId ? l : { ...(l || {}), _uiId: createEmptyLayout()._uiId }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;

    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const next = [...arr];

      if (next.length < count) {
        for (let i = next.length; i < count; i++) next.push(createEmptyLayout());
      } else if (next.length > count) {
        next.splice(count);
      }
      return next;
    });
  }, [count, shouldShow, setUnitLayouts]);

  if (!shouldShow) return null;

  return (
    <div className="mb-4">
      <label className="font-semibold block mb-2">这个项目有多少个房型 / Layout 数量</label>
      <select
        className="border rounded p-2 w-full"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      >
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
