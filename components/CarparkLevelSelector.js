import React, { useState } from "react";

export default function CarparkPositionSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  const [customValue, setCustomValue] = useState("");

  const groupedOptions = { /* ... 保持不变 ... */ };

  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">车位位置范围</label>
        <div className="flex gap-2">
          <select
            value={value?.min || ""}
            onChange={(e) => onChange({ ...value, min: e.target.value })}
            className="w-1/2 border border-gray-300 rounded px-3 py-2"
          >
            <option value="">最小楼层</option>
            {Object.entries(groupedOptions).map(([groupLabel, options]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
            <option value="其他（自定义最小）">其他（自定义）</option>
          </select>

          <select
            value={value?.max || ""}
            onChange={(e) => onChange({ ...value, max: e.target.value })}
            className="w-1/2 border border-gray-300 rounded px-3 py-2"
          >
            <option value="">最大楼层</option>
            {Object.entries(groupedOptions).map(([groupLabel, options]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
            <option value="其他（自定义最大）">其他（自定义）</option>
          </select>
        </div>

        {(value?.min === "其他（自定义最小）" || value?.max === "其他（自定义最大）") && (
          <input
            type="text"
            placeholder="请输入自定义车位范围"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        )}
      </div>
    );
  }

  // -------- 单选模式 --------
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      {value === "其他（自定义）" ? (
        <input
          type="text"
          placeholder="请输入自定义车位位置"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">请选择车位位置</option>
          {Object.entries(groupedOptions).map(([groupLabel, options]) => (
            <optgroup key={groupLabel} label={groupLabel}>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="其他（自定义）">其他（自定义）</option>
        </select>
      )}
    </div>
  );
}
