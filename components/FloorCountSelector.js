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

  // 过滤（如果输入“2”，显示例如 2 / 2.5 / 12 / 20）
  const filteredOptions = storeyOptions.filter((opt) =>
    opt.startsWith(inputValue)
  );

  // 点击外面关闭
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="mb-3" ref={wrapperRef}>
      <label className="block font-medium mb-1">有多少层（Storeys）</label>

      <div className="relative">
        {/* 白色输入框 */}
        <input
          type="text"
          placeholder="例如：2 或 2.5"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            onChange(val); // 手动输入时同步父组件
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="border p-2 rounded w-full bg-white"
        />

        {/* 白色下拉面板 */}
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            <li className="px-3 py-2 text-gray-500 cursor-default border-b select-none">
              从 1 ~ 200 中选择，或直接输入
            </li>

            {filteredOptions.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault(); // 避免 input 失焦
                  setInputValue(opt);
                  onChange(opt); // 选中后回传父组件
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
