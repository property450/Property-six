// components/FacingSelector.js
"use client";

import React, { useState, useEffect } from "react";
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

export default function FacingSelector({ value = [], onChange }) {
  // 确保 value 一定是数组
  const normalizedValue = Array.isArray(value) ? value : [];

  const [selectedOptions, setSelectedOptions] = useState(
    normalizedValue.map((v) => ({ value: v, label: v }))
  );

  useEffect(() => {
    setSelectedOptions(
      (Array.isArray(value) ? value : []).map((v) => ({ value: v, label: v }))
    );
  }, [value]);

  const handleChange = (selected) => {
    setSelectedOptions(selected || []);
    onChange?.(selected ? selected.map((opt) => opt.value) : []);
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
        closeMenuOnSelect={false} // ✅ 选中后不关闭菜单
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
