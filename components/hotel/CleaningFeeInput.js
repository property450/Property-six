// components/hotel/CleaningFeeInput.js
"use client";

const PRESET_AMOUNTS = Array.from({ length: 20 }, (_, i) => (i + 1) * 10); // 10 ~ 200

const formatNumber = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

export default function CleaningFeeInput({ value, onChange }) {
  const v = value || { mode: "free", value: "" };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const handleInput = (raw) => {
    const cleaned = parseNumber(raw);
    if (!/^\d*$/.test(cleaned)) return;
    update({ value: cleaned });
  };

  const handlePresetChange = (raw) => {
    if (!raw) return;
    // 直接存「纯数字字符串」，显示时再 format
    update({ value: String(raw) });
  };

  const isPaid = v.mode === "paid";

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium mb-1">
        这个房型的清洁费
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
          <>
            {/* 金额输入（带 RM 前缀 + 千分位） */}
            <div className="flex items-center border rounded px-2 py-1">
              <span className="mr-1">RM</span>
              <input
                type="text"
                className="outline-none w-28 text-right"
                placeholder="例如 80"
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
    </div>
  );
}
