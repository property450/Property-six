// components/UnitTypeSelector.js
"use client";

import { useEffect, useMemo, useState } from "react";

export default function UnitTypeSelector({
  saleType,
  unitLayouts,
  setUnitLayouts,
}) {
  const [count, setCount] = useState(1);

  const shouldShow = useMemo(() => {
    return saleType === "New Project (Developer)" || saleType === "Completed Unit (Developer)";
  }, [saleType]);

  useEffect(() => {
    if (!shouldShow) return;

    const arr = Array.isArray(unitLayouts) ? unitLayouts : [];
    const n = arr.length > 0 ? arr.length : 1;
    setCount(n);

    // 确保每个 layout 都有 _uiId
    setUnitLayouts((prev) => {
      const p = Array.isArray(prev) ? prev : [];
      if (!p.length) return [createEmptyLayout()];
      return p.map((l) => (l && l._uiId ? l : { ...(l || {}), _uiId: createEmptyLayout()._uiId }));
    });
  }, [shouldShow]); // eslint-disable-line react-hooks/exhaustive-deps

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
        className="w-full border rounded p-2"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      >
        {Array.from({ length: 20 }).map((_, i) => {
          const v = i + 1;
          return (
            <option key={v} value={v}>
              {v}
            </option>
          );
        })}
      </select>
    </div>
  );
}

