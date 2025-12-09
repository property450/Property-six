// components/hotel/OtherFacilitiesSelector.js
"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

const DEFAULT_OPTIONS = [
  "私人泳池",
  "游泳池",
  "健身房",
  "餐厅",
  "办公空间",
  "无障碍设施",
  "免费停车位",
  "电动汽车充电桩",
  "吸烟区",
  "夜总会",
  "篝火炉",
  "户外家具",
  "户外用餐区",
  "烧烤架",
].map((label) => ({ value: label, label }));

export default function OtherFacilitiesSelector({
  label = "其它设施（可加备注）",
  placeholder = "选择或输入其它设施...",
  options = DEFAULT_OPTIONS,
  value = [],
  onChange,
}) {
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
      <label className="block text-sm font-medium mb-1">{label}</label>
      <CreatableSelect
        isMulti
        placeholder={placeholder}
        options={options}
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
