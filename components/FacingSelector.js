// components/FacingSelector.js
"use client";

import React from "react";
import CreatableSelect from "react-select/creatable";

// 默认朝向选项
const facingOptions = [
  "东",
  "南",
  "西",
  "北",
  "东南",
  "东北",
  "西南",
  "西北",
].map((label) => ({ value: label, label }));

export default function FacingSelector({ value, onChange }) {
  // 保证是数组
  const normalized = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  // 直接在渲染时把字符串转成 options，**不再用 useState / useEffect**
  const selectedOptions = normalized.map((v) => ({
    value: v,
    label: v,
  }));

  const handleChange = (selected) => {
    const arr = (selected || []).map((opt) => opt.value);
    onChange?.(arr);
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">朝向</label>
      <CreatableSelect
        isMulti
        placeholder="选择或输入朝向..."
        options={facingOptions}
        value={selectedOptions}
        onChange={handleChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        closeMenuOnSelect={false}
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />
    </div>
  );
}
