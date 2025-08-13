// components/ExtraSpacesSelector.js
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
    const updated = selectedSpaces.map((s) =>
      s.label === label ? { ...s, count: val } : s
    );
    setSelectedSpaces(updated);
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
