// components/FurnitureSelector.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

// 数字格式化
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};
const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 数量下拉选项
const quantityOptions = [0, 1, 2, 3, 4, 5, 6, "custom"];

// 预设家私选项
const furnitureOptions = [
  "桌子",
  "椅子",
  "冰箱",
  "洗衣机",
  "风扇",
  "床",
  "衣柜",
  "抽油烟机",
  "烘干机",
  "沙发",
  "烤炉",
  "冷气",
  "电视柜",
  "电视机",
  "橱柜",
  "电磁炉",
  "煤气炉",
].map((label) => ({ value: label, label }));

export default function FurnitureSelector({ value = [], onChange }) {
  const [selectedFurniture, setSelectedFurniture] = useState(value);
  const [openKey, setOpenKey] = useState(null);
  const [customFlags, setCustomFlags] = useState({});
  const refs = useRef({});

  // 点击外部关闭下拉
  useEffect(() => {
    const onDocClick = (e) => {
      const anyHit = Object.values(refs.current).some((el) => el && el.contains(e.target));
      if (!anyHit) setOpenKey(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 标签选择变化
  const handleSelectChange = (selected) => {
    const newLabels = (selected || []).map((opt) => opt.value);
    const updated = newLabels.map((label) => {
      const existing = selectedFurniture.find((s) => s.label === label);
      return existing || { label, count: "" };
    });
    setSelectedFurniture(updated);
    onChange?.(updated);
  };

  // 设置数量
  const setFieldValue = (label, val) => {
    const updated = selectedFurniture.map((s) =>
      s.label === label ? { ...s, count: val } : s
    );
    setSelectedFurniture(updated);
    onChange?.(updated);
  };

  // 选择数量
  const handlePick = (label, opt) => {
    if (opt === "custom") {
      setCustomFlags((p) => ({ ...p, [label]: true }));
      setFieldValue(label, "");
      setOpenKey(null);
      return;
    }
    setCustomFlags((p) => ({ ...p, [label]: false }));
    setFieldValue(label, String(opt));
    setOpenKey(null);
  };

  // 输入数量
  const handleInput = (label, rawInput) => {
    const raw = parseNumber(rawInput);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 7) return;
    setFieldValue(label, raw);
  };

  // 数量选项渲染
  const renderOptions = (label) =>
    quantityOptions.map((opt) => {
      const isCustom = opt === "custom";
      const display = isCustom ? "自定义" : String(opt);
      return (
        <li
          key={String(opt)}
          onMouseDown={(e) => {
            e.preventDefault();
            handlePick(label, opt);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {display}
        </li>
      );
    });

  return (
    <div className="space-y-4">
      <label className="block font-medium mb-1">家私</label>

      {/* 标签输入框 */}
      <CreatableSelect
        isMulti
        closeMenuOnSelect={false}
        placeholder="选择或输入家私..."
        options={furnitureOptions}
        value={selectedFurniture.map((s) => ({ value: s.label, label: s.label }))}
        onChange={handleSelectChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />

      {/* 数量输入框 */}
      <div className="space-y-3">
        {selectedFurniture.map((item) => {
          const isNumberLike = /^\d+$/.test(String(item.count || ""));
          const display = isNumberLike ? formatNumber(item.count) : item.count || "";
          const isCustom = !!customFlags[item.label];
          const placeholder = isCustom ? "请输入你要的数字" : "输入或选择数量";

          return (
            <div
              key={item.label}
              ref={(el) => (refs.current[item.label] = el)}
              className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50"
            >
              <span className="font-medium">{item.label}</span>
              <div className="relative w-32">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring focus:border-blue-500"
                  placeholder={placeholder}
                  value={display}
                  onChange={(e) => handleInput(item.label, e.target.value)}
                  onFocus={() => setOpenKey(item.label)}
                  onClick={() => setOpenKey(item.label)}
                />
                {openKey === item.label && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                    {renderOptions(item.label)}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
