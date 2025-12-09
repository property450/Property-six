// components/hotel/KitchenFacilitiesSelector.js
"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

const OPTIONS = [
  "冰箱",
  "厨房",
  "咖啡/茶具",
  "儿童高脚椅",
  "微波炉",
  "烹饪基本用品（刀具、锅具、锅铲及油盐酱醋等基本调料）",
  "基本餐具（碗筷、餐盘、杯子等）",
  "炉灶",
  "电饭锅",
  "餐桌",
].map((label) => ({ value: label, label }));

export default function KitchenFacilitiesSelector({ value = [], onChange }) {
  const [items, setItems] = useState(value);

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const handleTagChange = (selected) => {
    const labels = (selected || []).map((opt) => opt.value);
    const next = labels.map((label) => {
      const exist = items.find((i) => i.label === label);
      return exist || { label, remark: "" };
    });
    setItems(next);
    onChange?.(next);
  };

  const handleRemarkChange = (label, remark) => {
    const next = items.map((i) =>
      i.label === label ? { ...i, remark } : i
    );
    setItems(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-2 mt-4">
      <label className="block text-sm font-medium mb-1">
        厨房设施（可加备注）
      </label>
      <CreatableSelect
        isMulti
        placeholder="选择或输入厨房设施..."
        options={OPTIONS}
        value={items.map((i) => ({ value: i.label, label: i.label }))}
        onChange={handleTagChange}
        formatCreateLabel={(input) => `添加自定义：${input}`}
      />
      <div className="space-y-2 mt-2">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">{i.label}</span>
            <input
              type="text"
              className="border rounded p-1 text-sm"
              placeholder="备注（可留空）"
              value={i.remark || ""}
              onChange={(e) =>
                handleRemarkChange(i.label, e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
