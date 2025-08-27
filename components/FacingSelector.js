// components/FacingSelector.js
"use client";

import React, { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

const defaultOptions = [
  "东", "南", "西", "北", "东南", "东北", "西南", "西北"
].map(label => ({ label, value: label }));

export default function FacingSelector({ value = [], onChange }) {
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleChange = (newValue) => {
    setSelected(newValue);
    onChange?.(newValue); // 输出父组件 [{label:"东"},{label:"其他"}]
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">朝向</label>
      <CreatableSelect
        isMulti
        closeMenuOnSelect={false}
        placeholder="选择或输入朝向..."
        options={defaultOptions}
        value={selected}
        onChange={handleChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        components={{
          MultiValueRemove: () => null, // 隐藏每个标签上的 ❌ 删除按钮
        }}
        styles={{
          menu: (provided) => ({ ...provided, zIndex: 9999 }),
        }}
      />
    </div>
  );
}
