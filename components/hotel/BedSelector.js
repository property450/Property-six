// components/hotel/BedSelector.js
"use client";

import CreatableSelect from "react-select/creatable";
import { useState, useEffect } from "react";

const BED_OPTIONS = [
  "单人床",
  "双人床",
  "大床",
  "上下床",
].map((label) => ({ value: label, label }));

export default function BedSelector({ value = [], onChange }) {
  const [beds, setBeds] = useState(value);

  useEffect(() => {
    setBeds(value || []);
  }, [value]);

  const handleTagChange = (selected) => {
    const labels = (selected || []).map((opt) => opt.value);
    const next = labels.map((label) => {
      const exist = beds.find((b) => b.label === label);
      return exist || { label, count: 1 };
    });
    setBeds(next);
    onChange?.(next);
  };

  const handleCountChange = (label, newCount) => {
    const num = Math.max(1, Math.min(20, Number(newCount) || 1));
    const next = beds.map((b) =>
      b.label === label ? { ...b, count: num } : b
    );
    setBeds(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        这个房型的床是什么床？
      </label>
      <CreatableSelect
        isMulti
        placeholder="选择或输入床型，例如：单人床 / 大床..."
        options={BED_OPTIONS}
        value={beds.map((b) => ({ value: b.label, label: b.label }))}
        onChange={handleTagChange}
        formatCreateLabel={(input) => `添加自定义床型：${input}`}
      />

      <div className="space-y-2 mt-2">
        {beds.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-sm w-32">{b.label}</span>
            <input
              type="number"
              min={1}
              max={20}
              className="border rounded p-1 w-24"
              value={b.count || 1}
              onChange={(e) => handleCountChange(b.label, e.target.value)}
            />
            <span className="text-xs text-gray-500">张</span>
          </div>
        ))}
      </div>
    </div>
  );
}
