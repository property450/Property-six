// components/hotel/OtherFeeInput.js
"use client";

export default function OtherFeeInput({ value, onChange, label }) {
  // 统一一个安全的默认值，避免 undefined 报错
  const v = {
    mode: value?.mode || "free",   // free = 没有其它费用，fixed = 有其它费用
    value: value?.value || "",
    note: value?.note || "",
  };

  const title = label || "这个房型的其它费用（含备注）";

  const update = (patch) => {
    const next = { ...v, ...patch };
    // 把标准结构回传给上层
    onChange?.(next);
  };

  // 只有在“有其它费用”时才显示金额和备注
  const hasOtherFee = v.mode === "fixed";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">{title}</label>

      <div className="flex flex-wrap gap-2 items-center">
        {/* 下拉：没有其它费用 / 有其它费用 */}
        <select
          className="border rounded p-1 text-sm"
          value={v.mode}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">有其它费用</option>
        </select>

        {/* 选了“有其它费用”才显示金额输入框 */}
        {hasOtherFee && (
          <>
            <span className="text-sm text-gray-700">RM</span>
            <input
              type="number"
              className="border rounded p-1 text-sm w-32"
              placeholder="例如 50"
              value={v.value}
              onChange={(e) => update({ value: e.target.value })}
            />
          </>
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
