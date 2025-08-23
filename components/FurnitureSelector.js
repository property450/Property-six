// components/FurnitureSelector.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

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
const FurnitureOptions = [
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
  const [selectedSpaces, setSelectedSpaces] = useState(value);
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
      const existing = selectedSpaces.find((s) => s.label === label);
      return existing || { label, count: "" };
    });
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  const setFieldValue = (label, val) => {
    const updated = selectedFurniture.map((s) =>
      s.label === label ? { ...s, count: val } : s
    );
    setSelectedFurniture(updated);
    onChange?.(updated);
  };

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

  const handleInput = (label, rawInput) => {
    const raw = parseNumber(rawInput);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 7) return;
    setFieldValue(label, raw);
  };

  const renderOptions = (spaceLabel) => {
    return quantityOptions.map((opt) => {
      const isCustom = opt === "custom";
      const display = isCustom ? "自定义" : String(opt);
      return (
        <li
          key={String(opt)}
          onMouseDown={(e) => {
            e.preventDefault();
            handlePick(spaceLabel, opt);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {display}
        </li>
      );
    });
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium mb-1">额外空间</label>

      {/* 标签输入框 */}
      <CreatableSelect
        isMulti
        closeMenuOnSelect={false}
        placeholder="选择或输入额外家私..."
        options={FurnitureOptions}
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

      {/* 数量输入框 */}
      <div className="space-y-3">
        {selectedSpaces.map((space) => {
          const isNumberLike = /^\d+$/.test(String(space.count || ""));
          const display = isNumberLike ? formatNumber(space.count) : space.count || "";
          const isCustom = !!customFlags[space.label];
          const placeholder = isCustom ? "请输入你要的数字" : "输入或选择数量";

          return (
            <div
              key={space.label}
              ref={(el) => (refs.current[space.label] = el)}
              className="flex items-center gap-3 border p-3 rounded-lg bg-gray-50"
            >
              <span className="font-medium">{space.label}</span>
              <div className="relative w-32">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring focus:border-blue-500"
                  placeholder={placeholder}
                  value={display}
                  onChange={(e) => handleInput(space.label, e.target.value)}
                  onFocus={() => setOpenKey(space.label)}
                  onClick={() => setOpenKey(space.label)}
                />
                {openKey === space.label && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                    {renderOptions(space.label)}
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
        )
      );
    } else {
      onChange([...value, { name, quantity }]);
    }
    setInputValue("");
    setQuantity(1);
  };

  const removeFurniture = (name) => {
    onChange(value.filter((item) => item.name !== name));
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">家私</label>

      {/* 已选择的家具 */}
      <div className="flex flex-wrap gap-2">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
          >
            {item.name} × {item.quantity}
            <button
              type="button"
              onClick={() => removeFurniture(item.name)}
              className="ml-2 text-red-500 font-bold"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 下拉选择 */}
      <select
        value=""
        onChange={(e) => addFurniture(e.target.value)}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">选择家私...</option>
        {predefinedOptions.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {/* 手动输入 + 数量 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="输入家私名称"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20 border rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={() => addFurniture(inputValue)}
          className="bg-blue-600 text-white px-3 rounded"
        >
          添加
        </button>
      </div>
    </div>
  );
}
