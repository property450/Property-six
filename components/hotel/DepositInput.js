// components/hotel/DepositInput.js
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

export default function DepositInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };

  const [isOpen, setIsOpen] = useState(false);
  const [canOpenOnFocus, setCanOpenOnFocus] = useState(true);
  const wrapperRef = useRef(null);

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const handleInputChange = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;

    setIsOpen(false);
    setCanOpenOnFocus(false);

    update({ value: cleaned });
  };

  const handleFocusOrClick = () => {
    if (v.mode !== "paid") return;
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

  const isPaid = v.mode === "paid";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">
        这个房型的押金（Refundable）
      </label>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded p-2 w-28"
          value={v.mode || "free"}
          onChange={(e) => {
            const mode = e.target.value;
            update({ mode });
            if (mode === "paid") {
              setCanOpenOnFocus(true);
            } else {
              setIsOpen(false);
            }
          }}
        >
          <option value="free">免费</option>
          <option value="paid">付费</option>
        </select>

        {isPaid && (
          <div
            ref={wrapperRef}
            className="relative inline-flex items-center border rounded px-2 py-1 bg-white"
          >
            <span className="mr-1">RM</span>
            <input
              type="text"
              className="outline-none w-28 text-right bg-transparent"
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
    </div>
  );
}
