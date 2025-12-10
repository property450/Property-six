// components/hotel/CleaningFeeInput.js
"use client";

import { useState, useRef, useEffect } from "react";

const formatNumber = (val) => {
  if (!val) return "";
  const num = Number(String(val).replace(/,/g, ""));
  return Number.isFinite(num) ? num.toLocaleString() : "";
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

const SUGGESTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function CleaningFeeInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };
  const [show, setShow] = useState(false);

  const dropdownRef = useRef(null);

  const update = (patch) => onChange?.({ ...v, ...patch });

  const handleType = (raw) => {
    const cleaned = parseNumber(raw);
    if (/^\d*$/.test(cleaned)) update({ value: cleaned });
  };

  const isPaid = v.mode === "paid";

  // ⭐ 点击空白处自动关闭 dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1">
        这个房型的清洁费
      </label>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded p-2 w-28"
          value={v.mode}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">免费</option>
          <option value="paid">付费</option>
        </select>

        {isPaid && (
          <div className="flex items-center border rounded px-2 py-1 bg-white cursor-text relative">
            <span className="mr-1">RM</span>

            <input
              type="text"
              className="outline-none w-28 text-right bg-white"
              placeholder="输入价格"
              value={formatNumber(v.value)}
              onChange={(e) => handleType(e.target.value)}
              onFocus={() => setShow(true)}
            />

            {/* 白色下拉框 */}
            {show && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded shadow z-50">
                {SUGGESTIONS.map((amt) => (
                  <div
                    key={amt}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={() => {
                      update({ value: String(amt) });
                      setShow(false); // ⭐ 选中后收起
                    }}
                  >
                    RM {amt}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
