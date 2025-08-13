// components/ExtraSpacesSelector.js
"use client";

import React, { useState } from "react";
import CreatableSelect from "react-select/creatable";

// 数量选择器选项
const quantityOptions = [0, 1, 2, 3, 4, 5, 6];

// 预设额外空间选项
const extraSpacesOptions = [
  "阳台",
  "书房",
  "花园",
  "庭院",
  "走廊",
  "大厅",
  "景观",
  "洗衣房",
  "储物间",
].map((label) => ({ value: label, label }));

export default function ExtraSpacesSelector({ value = [], onChange }) {
  const [selectedSpaces, setSelectedSpaces] = useState(value);

  // 添加或更新标签
  const handleSelectChange = (selected) => {
    const currentLabels = selectedSpaces.map((s) => s.label);
    const newLabels = (selected || []).map((opt) => opt.value);

    // 保留已有数量
    const updated = newLabels.map((label) => {
      const existing = selectedSpaces.find((s) => s.label === label);
      return existing || { label, count: "" };
    });

    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  // 修改数量
  const handleCountChange = (label, count) => {
    const updated = selectedSpaces.map((s) =>
      s.label === label ? { ...s, count } : s
    );
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium mb-1">额外空间</label>

      {/* 标签输入框 */}
      <CreatableSelect
        isMulti
        closeMenuOnSelect={false} // 关键代码：多选不自动关闭
        placeholder="选择或输入额外空间..."
        options={extraSpacesOptions}
        value={selectedSpaces.map((s) => ({ value: s.label, label: s.label }))}
        onChange={handleSelectChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />

      {/* 框架 */}
      <div className="space-y-3">
        {selectedSpaces.map((space) => (
          <div
            key={space.label}
            className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50"
          >
            <span className="font-medium">{space.label}</span>
            <select
              value={space.count}
              onChange={(e) => handleCountChange(space.label, e.target.value)}
              className="border p-2 rounded w-28"
            >
              <option value="">选择数量</option>
              {quantityOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="custom">自定义</option>
            </select>
            {space.count === "custom" && (
              <input
                type="number"
                placeholder="请输入数量"
                className="border p-2 rounded w-28"
                onChange={(e) => handleCountChange(space.label, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
