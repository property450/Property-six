// components/hotel/OtherFeeInput.js
"use client";

import { useState, useEffect, useRef } from "react";

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

const PRESET_AMOUNTS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function OtherFeeInput({ value, onChange, label }) {
  // 统一安全默认值
  const v = {
    mode: value?.mode || "free", // free = 没有其它费用，fixed = 有其它费用
    value: value?.value || "",
    note: value?.note || "",
  };

  const title = label || "这个房型的其它费用（含备注）";

  const [localValue, setLocalValue] = useState(formatNumber(v.value));
  const [open, setOpen] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(formatNumber(v.value));
  }, [v.value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHasSelected(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const update = (patch) => {
    const next = { ...v, ...patch };
    onChange?.(next);
  };

  const handleInputChange = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;
    setLocalValue(formatNumber(cleaned));
    update({ value: cleaned });
  };

  const handleSelectAmount = (amount) => {
    const str = String(amount);
    setLocalValue(formatNumber(str));
    update({ value: str });
    setOpen(false);
    setHasSelected(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasOtherFee = v.mode === "fixed";

  return (
    <div className="space-y-1" ref={wrapperRef}>
      <label className="block text-sm font-medium mb-1">{title}</label>

      <div className="flex flex-wrap gap-2 items-center">
        {/* 下拉：没有其它费用 / 有其它费用 */}
        <select
          className="border rounded p-1 text-sm"
          value={v.mode}
          onChange={(e) => {
            const mode = e.target.value;
            update({ mode });
            if (mode === "free") {
              setOpen(false);
            } else {
              setHasSelected(false);
            }
          }}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">有其它费用</option>
        </select>

        {/* 选了“有其它费用”才显示金额输入框（带白色下拉选择） */}
        {hasOtherFee && (
          <div className="relative">
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <span className="mr-1">RM</span>
              <input
                ref={inputRef}
                type="text"
                className="outline-none w-32 text-right bg-white"
                placeholder="例如 50"
                value={localValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => {
                  if (!hasSelected) {
                    setOpen(true);
                  }
                }}
              />
            </div>

            {open && (
              <div className="absolute z-20 mt-1 max-h-40 w-full overflow-auto border rounded-md bg-white shadow">
                {PRESET_AMOUNTS.map((amt) => (
                  <div
                    key={amt}
                    className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectAmount(amt);
                    }}
                  >
                    RM {amt.toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 有其它费用时才显示备注说明 */}
      {hasOtherFee && (
        <textarea
          className="w-full border rounded p-2 text-xs mt-1"
          rows={2}
          placeholder="备注说明，例如：节庆假期附加费、加床费、宠物附加清洁费等…"
          value={v.note}
          onChange={(e) => update({ note: e.target.value })}
        />
      )}
    </div>
  );
}
