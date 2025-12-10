// components/hotel/CleaningFeeInput.js
"use client";

const formatNumber = (val) => {
  if (!val) return "";
  const num = Number(String(val).replace(/,/g, ""));
  return Number.isFinite(num) ? num.toLocaleString() : "";
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

const SUGGESTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function CleaningFeeInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const handleInput = (raw) => {
    const cleaned = parseNumber(raw);
    if (/^\d*$/.test(cleaned)) update({ value: cleaned });
  };

  const isPaid = v.mode === "paid";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">
        这个房型的清洁费
      </label>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded p-2 w-28 bg-white text-black"
          value={v.mode}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">免费</option>
          <option value="paid">付费</option>
        </select>

        {isPaid && (
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <span className="mr-1">RM</span>
            <input
              type="text"
              list="cleaning_fee_suggestions"
              className="outline-none w-28 text-right bg-white text-black"
              placeholder="例如 80"
              value={formatNumber(v.value)}
              onChange={(e) => handleInput(e.target.value)}
            />
            <datalist id="cleaning_fee_suggestions">
              {SUGGESTIONS.map((amt) => (
                <option key={amt} value={amt}>
                  RM {amt}
                </option>
              ))}
            </datalist>
          </div>
        )}
      </div>
    </div>
  );
}
