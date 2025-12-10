// components/hotel/OtherFeeInput.js
"use client";

function normalizeValue(value) {
  if (!value) return { amount: "", note: "" };
  if (typeof value === "string" || typeof value === "number") {
    // 兼容旧版本只保存金额
    return { amount: String(value), note: "" };
  }
  return {
    amount: value.amount ? String(value.amount) : "",
    note: value.note || "",
  };
}

export default function OtherFeeInput({ value, onChange, label }) {
  const val = normalizeValue(value);

  const emitChange = (patch) => {
    const next = { ...val, ...patch };
    onChange && onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">
        {label || "这个房型的其它费用"}
      </label>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            min="0"
            step="1"
            className="w-full border rounded px-3 py-2"
            placeholder="例如：50 或 100"
            value={val.amount}
            onChange={(e) => emitChange({ amount: e.target.value })}
          />
        </div>
        <div className="flex items-center text-sm text-gray-600">RM</div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">其它费用备注</label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="例如：节日附加费、加床费、宠物清洁费等说明"
          value={val.note}
          onChange={(e) => emitChange({ note: e.target.value })}
        />
      </div>
    </div>
  );
}
