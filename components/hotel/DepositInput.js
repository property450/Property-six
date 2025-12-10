// components/hotel/DepositInput.js
"use client";

import { useState } from "react";

const formatNumber = (val) => {
  if (!val) return "";
  const num = Number(String(val).replace(/,/g, ""));
  return Number.isFinite(num) ? num.toLocaleString() : "";
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

const SUGGESTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function DepositInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };
  const [show, setShow] = useState(false);

  const update = (patch) => onChange?.({ ...v, ...patch });
  const isPaid = v.mode === "paid";

  return (
    <div className="space-y-1 relative">
      <label className="block text-sm font-medium mb-1">
        这个房型的押金（Refundable）
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
          <div
            className="flex items-center border rounded px-2 py-1 bg-white cursor-text relative"
            onClick={() => setShow(true)}
          >
            <span className="mr-1">RM</span>
            <input
              type="text"
              className="outline-none w-28 text-right bg-white"
              placeholder="输入价格"
              value={formatNumber(v.value)}
              onChange={(e) => update({ value: parseNumber(e.target.value) })}
              onFocus={() => setShow(true)}
            />

            {show && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded shadow z-50">
                {SUGGESTIONS.map((amt) => (
                  <div
                    key={amt}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={() => {
                      update({ value: String(amt) });
                      setShow(false);
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
