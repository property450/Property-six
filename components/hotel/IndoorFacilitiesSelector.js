// components/hotel/IndoorFacilitiesSelector.js
"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

const OPTIONS = [
  "电视",
  "投影仪",
  "无线网络",
  "熨烫设施",
  "空调/冷气",
  "暖气",
  "室内壁炉",
  "烟雾报警器",
  "一氧化碳报警器",
  "床单",
  "额外的枕头和毛毯",
  "蚊帐",
  "衣柜/衣橱",
  "婴儿床",
  "地暖",
  "吊扇",
  "书桌/椅子",
  "咖啡桌",
].map((label) => ({ value: label, label }));

export default function IndoorFacilitiesSelector({ value = [], onChange }) {
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
        室内设施（可加备注）
      </label>
      <CreatableSelect
        isMulti
        placeholder="选择或输入室内设施..."
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
              placeholder="备注（例如：55 寸 4K 电视 / 3D 电视等，可留空）"
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
