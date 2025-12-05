// components/FloorCountSelector.js
"use client";

import { useState, useRef, useEffect } from "react";

export default function FloorCountSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const wrapperRef = useRef(null);

  // 生成 1, 1.5, 2 ... 200
  const storeyOptions = [];
  for (let v = 1; v <= 200; v += 0.5) {
    storeyOptions.push(Number.isInteger(v) ? String(v) : String(v));
  }

  // 简单过滤（输入“2” 会出 2 / 2.5 / 20 / 21 ...）
  const filteredOptions =
    inputValue === ""
      ? storeyOptions
      : storeyOptions.filter((opt) => opt.startsWith(inputValue));

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    // 父组件外部更新时同步进来
    setInputValue(value || "");
  }, [value]);

  return (
    <div className="mb-3" ref={wrapperRef}>
      <label className="block font-medium mb-1">有多少层（Storeys）</label>

      <div className="relative">
        <input
          type="text"
          placeholder="例如：2 或 2.5"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            onChange && onChange(val);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="border p-2 rounded w-full bg-white"
        />

        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            <li className="px-3 py-2 text-gray-500 cursor-default border-b select-none text-sm">
              从 1 ~ 200 中选择，或直接输入
            </li>
            {filteredOptions.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setInputValue(opt);
                  onChange && onChange(opt);
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
