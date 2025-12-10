// components/hotel/OtherFeeInput.js
"use client";

import { useState, useRef, useEffect } from "react";

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 价格下拉选项：RM 10 ~ RM 200
const PRICE_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function OtherFeeInput({ value, onChange, label }) {
  // 统一一个安全的默认值
  const v = {
    mode: value?.mode || "free", // free = 没有其它费用，fixed = 有其它费用
    value: value?.value || "",
    note: value?.note || "",
  };

  const title = label || "这个房型的其它费用";

  const [isOpen, setIsOpen] = useState(false);
  const [canOpenOnFocus, setCanOpenOnFocus] = useState(true);
  const wrapperRef = useRef(null);

  const update = (patch) => {
    const next = { ...v, ...patch };
    onChange?.(next);
  };

  const handleInputChange = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;

    setIsOpen(false);
    setCanOpenOnFocus(false);

    update({ value: cleaned });
  };

  const handleFocusOrClick = () => {
    if (v.mode !== "fixed") return;
    if (canOpenOnFocus) {
      setIsOpen(true);
    }
  };

  const handleSelectPrice = (amount) => {
    const val = String(amount);
    update({ value: val });
    setIsOpen(false);
    setCanOpenOnFocus(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setCanOpenOnFocus(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasOtherFee = v.mode === "fixed";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">{title}</label>

      <div className="flex flex-wrap gap-2 items-center">
        {/* 下拉：没有其它费用 / 有其它费用 */}
        <select
          className="border rounded p-1 text-sm"
          value={v.mode}
          onChange={(e) => {
            const mode = e.target.value;
            update({ mode });
            if (mode === "fixed") {
              setCanOpenOnFocus(true);
            } else {
              setIsOpen(false);
            }
          }}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">有其它费用</option>
        </select>

        {/* 选了“有其它费用”才显示金额输入框 + 下拉价格表 */}
        {hasOtherFee && (
          <div
            ref={wrapperRef}
            className="relative inline-flex items-center border rounded px-2 py-1 bg-white"
          >
            <span className="mr-1">RM</span>
            <input
              type="text"
              className="outline-none w-32 text-right bg-transparent"
              placeholder="例如 50"
              value={formatNumber(v.value)}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocusOrClick}
              onClick={handleFocusOrClick}
            />

            {isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto border rounded bg-white shadow z-20">
                {PRICE_OPTIONS.map((price) => (
                  <button
                    type="button"
                    key={price}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100"
                    onClick={() => handleSelectPrice(price)}
                  >
                    RM {price.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 选了“有其它费用”才显示备注说明 */}
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
