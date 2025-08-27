import React from "react";

export default function CarparkPositionSelector({
  value,
  onChange,
  customValue,
  setCustomValue,
  mode = "single", // "single" | "range"
}) {

  // ✅ 内部管理 customValue
  const [customValue, setCustomValue] = useState("");
  
  const groupedOptions = {
    "🔻 地下楼层（Basement）": [
      "Basement 10", "Basement 9", "Basement 8", "Basement 7", "Basement 6",
      "Basement 5", "Basement 4", "Basement 3A", "Basement 3", "Basement 2", "Basement 1",
    ],
    "🔻 地下地面过渡层": ["LG3", "LG2", "LG1"],
    "🔹 地面与夹层": ["G", "UG", "M1", "M2", "M3"],
    "🔹 Podium 层（可选）": ["P1", "P2", "P3", "P3A", "P4", "P5"],
    "🔼 正常楼层": [
      "Level 1","Level 2","Level 3","Level 3A","Level 4","Level 5","Level 6","Level 7","Level 8","Level 9",
      "Level 10","Level 11","Level 12","Level 13","Level 13A","Level 14","Level 15","Level 16","Level 17","Level 18","Level 19",
      "Level 20","Level 21","Level 22","Level 23","Level 23A","Level 24","Level 25","Level 26","Level 27","Level 28","Level 29","Level 30",
    ],
    "🔝 顶层": ["R（Roof）", "Rooftop"],
  };

  if (mode === "range") {
    // -------- 范围模式 --------
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
