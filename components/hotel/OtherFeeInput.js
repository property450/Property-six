// components/hotel/OtherFeeInput.js
"use client";

export default function OtherFeeInput({ value, onChange, label }) {
  const v = value || { mode: "free", value: "", note: "" };
  const title = label || "这个房型的其它费用";

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">{title}</label>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded p-1 text-sm"
          value={v.mode || "free"}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">固定金额</option>
        </select>

        {v.mode !== "free" && (
          <input
            type="number"
            className="border rounded p-1 text-sm w-36"
            placeholder="金额（RM）"
            value={v.value || ""}
            onChange={(e) => update({ value: e.target.value })}
          />
        )}
      </div>

      {/* 备注输入框 */}
      {v.mode !== "free" && (
        <textarea
          className="w-full border rounded p-2 text-xs mt-1"
          rows={2}
          placeholder="备注说明，例如：节庆假期附加费、加床费、宠物附加清洁费等…"
          value={v.note || ""}
          onChange={(e) => update({ note: e.target.value })}
        />
      )}
    </div>
  );
}
