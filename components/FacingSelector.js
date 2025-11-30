// components/FacingSelector.js
"use client";

import React, { useEffect, useState } from "react";
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
  const normalize = (v) =>
    Array.isArray(v) ? v : v ? [v] : [];

  // ⭐ 内部 state 来记住选择
  const [selectedValues, setSelectedValues] = useState(normalize(value));

  // 父组件 value 变化时同步
  useEffect(() => {
    setSelectedValues(normalize(value));
  }, [value]);

  const selectedOptions = selectedValues.map((v) => ({
    value: v,
    label: v,
  }));

  const handleChange = (selected) => {
    const arr = (selected || []).map((opt) => opt.value);
    setSelectedValues(arr);
    onChange?.(arr); // 对外还是保持数组，不动你的其它逻辑
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
