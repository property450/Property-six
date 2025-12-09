// components/hotel/BreakfastSelector.js
"use client";

export default function BreakfastSelector({ value, onChange }) {
  return (
    <div className="space-y-1 mt-2">
      <label className="block text-sm font-medium mb-1">
        房型是否包含早餐？
      </label>
      <select
        className="border rounded p-2 w-full max-w-xs"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">请选择</option>
        <option value="yes">是</option>
        <option value="no">否</option>
      </select>
    </div>
  );
}
