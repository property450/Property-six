// components/hotel/OtherFeeInput.js
"use client";

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 建议金额：RM 10 ~ RM 200
const SUGGESTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10);

export default function OtherFeeInput({ value, onChange, label }) {
  // 安全默认值
  const v = {
    mode: value?.mode || "free", // free = 没有其它费用；fixed = 有其它费用
    value: value?.value || "",
    note: value?.note || "",
  };

  const title = label || "这个房型的其它费用（含备注）";

  const update = (patch) => {
    const next = { ...v, ...patch };
    onChange?.(next);
  };

  const handleInput = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;
    update({ value: cleaned });
  };

  const hasOtherFee = v.mode === "fixed";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">{title}</label>

      <div className="flex flex-wrap gap-2 items-center">
        {/* 下拉：没有其它费用 / 有其它费用 */}
        <select
          className="border rounded p-2 w-32 text-sm"
          value={v.mode}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">有其它费用</option>
        </select>

        {/* 有其它费用时，显示金额输入 + 下拉建议 */}
        {hasOtherFee && (
          <div className="flex items-center border rounded px-2 py-1">
            <span className="mr-1">RM</span>
            <input
              type="text"
              list="other_fee_suggestions"
              className="outline-none w-28 text-right text-sm"
              placeholder="例如 50"
              value={formatNumber(v.value)}
              onChange={(e) => handleInput(e.target.value)}
            />
            <datalist id="other_fee_suggestions">
              {SUGGESTIONS.map((amt) => (
                <option key={amt} value={amt}>
                  {`RM ${amt}`}
                </option>
              ))}
            </datalist>
          </div>
        )}
      </div>

      {/* 有其它费用时，显示备注说明 */}
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
