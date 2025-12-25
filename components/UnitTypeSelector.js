// components/UnitTypeSelector.js
"use client";

export default function UnitTypeSelector({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="font-semibold block mb-2">
        这个项目有多少个房型 / Layout 数量
      </label>

      <select
        className="border rounded p-2 w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>请选择</option>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
