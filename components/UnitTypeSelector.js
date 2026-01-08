// components/UnitTypeSelector.js
"use client";

export default function UnitTypeSelector({
  value,
  onChange,
  min = 1,
  max = 200,
}) {
  // 允许 value 是 ""（未选择）
  const safeValue = value === undefined || value === null ? "" : String(value);

  const start = Math.max(1, Number(min) || 1);
  const end = Math.max(start, Number(max) || 200);

  return (
    <div className="mb-4">
      <label className="font-semibold block mb-2">
        这个项目有多少个房型 / Layout 数量
      </label>

      <select
        className="border rounded p-2 w-full"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)} // ✅ 传字符串（"" 或 "17"）
      >
        <option value="">请选择</option>
        {Array.from({ length: end - start + 1 }, (_, i) => String(start + i)).map(
          (n) => (
            <option key={n} value={n}>
              {n}
            </option>
          )
        )}
      </select>
    </div>
  );
}
