// components/hotel/DepositInput.js
"use client";

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

export default function DepositInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const handleInput = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;
    update({ value: cleaned });
  };

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
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">免费</option>
          <option value="paid">付费</option>
        </select>
        {isPaid && (
          <div className="flex items-center border rounded px-2 py-1">
            <span className="mr-1">RM</span>
            <input
              type="text"
              className="outline-none w-28 text-right"
              placeholder="例如 50"
              value={formatNumber(v.value)}
              onChange={(e) => handleInput(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
