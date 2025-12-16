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

// value 结构：可以是 string | string[] | [{label, remark}]
export default function FacingSelector({ value, onChange }) {
  const [items, setItems] = useState([]);

  const normalizeInput = (v) => {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    return arr
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          return { label: item, remark: "" };
        }
        const label = item.label ?? item.value ?? "";
        if (!label) return null;
        return { label, remark: item.remark ?? "" };
      })
      .filter(Boolean);
  };

  // 父组件 value 变化时同步
  useEffect(() => {
    setItems(normalizeInput(value));
  }, [value]);

  const emit = (next) => {
    setItems(next);
    onChange?.(next); // 回传对象数组，包含 remark
  };

  const handleChange = (selected) => {
    const labels = (selected || []).map((opt) => opt.value);
    const updated = labels.map((label) => {
      const existing = items.find((x) => x.label === label);
      return existing || { label, remark: "" };
    });
    emit(updated);
  };

  const setRemark = (label, remark) => {
    const updated = items.map((item) =>
      item.label === label ? { ...item, remark } : item
    );
    emit(updated);
  };

  const selectedOptions = items.map((v) => ({
    value: v.label,
    label: v.label,
  }));

  return (
    <div className="mb-4 space-y-3">
      <label className="block font-medium mb-1">朝向（可加备注）</label>
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

      {items.length > 0 && (
        <div className="space-y-2 mt-2">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">{item.label}</span>
              <input
                type="text"
                className="border rounded p-1 text-sm"
                placeholder="备注（可留空）"
                value={item.remark || ""}
                onChange={(e) => setRemark(item.label, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
