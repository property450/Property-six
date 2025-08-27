"use client";

import { useState, useRef, useEffect } from "react";

// 千分位格式化
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

// 去掉千分位
const parseNumber = (str) => String(str || "").replace(/,/g, "");

const OPTIONS = [0, 1, 2, 3, 4, 5];

export default function CarparkCountSelector({ value, onChange, mode = "single" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // 处理单值输入
  const handleInput = (val) => {
    const raw = parseNumber(val);
    if (/^\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  // 处理范围输入
  const handleRangeInput = (field, val) => {
    const raw = parseNumber(val);
    if (/^\d*$/.test(raw)) {
      onChange({ ...value, [field]: raw });
    }
  };

  if (mode === "range") {
    return (
      <div className="flex flex-col" ref={ref}>
        <label className="text-sm font-medium mb-1">停车位范围</label>
        <div className="flex gap-2">
          {/* 最少 */}
          <input
            type="text"
            placeholder="最少"
            value={formatNumber(value?.min)}
            onChange={(e) => handleRangeInput("min", e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          {/* 最大 */}
          <input
            type="text"
            placeholder="最多"
            value={formatNumber(value?.max)}
            onChange={(e) => handleRangeInput("max", e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
        </div>
      </div>
    );
  }

  // ---------- 单值模式 ----------
  return (
    <div className="flex flex-col" ref={ref}>
      <label className="text-sm font-medium mb-1">停车位</label>
      <div className="relative">
        <input
          type="text"
          placeholder="输入或选择停车位数量"
          value={formatNumber(value)}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full border rounded px-3 py-2"
        />
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            {OPTIONS.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(String(opt));
                  setOpen(false);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
