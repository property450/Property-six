// components/hotel/OtherFeeInput.js
"use client";

const PRESET_AMOUNTS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10); // 10 ~ 200

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

export default function OtherFeeInput({ value, onChange, label }) {
  // 统一一个安全的默认值
  const v = {
    mode: value?.mode || "free", // free = 没有其它费用，fixed = 有其它费用
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

  const handlePresetChange = (raw) => {
    if (!raw) return;
    update({ value: String(raw) });
  };

  const hasOtherFee = v.mode === "fixed";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">{title}</label>

      <div className="flex flex-wrap gap-2 items-center">
        {/* 下拉：没有其它费用 / 有其它费用 */}
        <select
          className="border rounded p-2 w-36 text-sm"
          value={v.mode}
          onChange={(e) => update({ mode: e.target.value })}
        >
          <option value="free">没有其它费用</option>
          <option value="fixed">有其它费用</option>
        </select>

        {hasOtherFee && (
          <>
            {/* 金额输入（带 RM 前缀 + 千分位） */}
            <div className="flex items-center border rounded px-2 py-1">
              <span className="mr-1">RM</span>
              <input
                type="text"
                className="outline-none w-28 text-right text-sm"
                placeholder="例如 50"
                value={formatNumber(v.value)}
                onChange={(e) => handleInput(e.target.value)}
              />
            </div>

            {/* 常用金额下拉 */}
            <select
              className="border rounded p-2 w-40 text-sm"
              value=""
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="">选择常用金额</option>
              {PRESET_AMOUNTS.map((amt) => (
                <option key={amt} value={amt}>
                  {`RM ${amt.toLocaleString()}`}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* 备注说明：只有有其它费用时才显示 */}
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
