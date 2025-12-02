// components/FloorCountSelector.js
"use client";

const STOREY_OPTIONS = Array.from({ length: 400 }, (_, index) => {
  const val = 1 + index * 0.5; // 1, 1.5, 2, 2.5 ... 到 200
  // 把 2.0 这种变成 2
  return Number.isInteger(val) ? String(val) : String(val);
});

export default function FloorCountSelector({ value, onChange }) {
  const handleChange = (e) => {
    const val = e.target.value;
    // 允许清空（删除），也允许手动输入任意数字/小数
    onChange?.(val);
  };

  return (
    <div className="mt-3 space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        有多少层（Storeys）
      </label>

      {/* 使用 datalist：既有下拉选，又能手动输入 */}
      <input
        list="storey-options"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="例如：2 或 2.5"
        value={value || ""}
        onChange={handleChange}
      />

      <datalist id="storey-options">
        {STOREY_OPTIONS.map((val) => (
          <option key={val} value={val} />
        ))}
      </datalist>

      <p className="mt-1 text-xs text-gray-500">
        可以从下拉列表选择，也可以直接输入或清空。
      </p>
    </div>
  );
}
