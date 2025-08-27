import React, { useState } from "react";

export default function CarparkLevelSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  const [customValue, setCustomValue] = useState({ min: "", max: "", single: "" });
  const [isCustom, setIsCustom] = useState({ min: false, max: false, single: false });

  const groupedOptions = {
    "🔻 地下楼层（Basement）": [
      "Basement 10","Basement 9","Basement 8","Basement 7","Basement 6",
      "Basement 5","Basement 4","Basement 3A","Basement 3","Basement 2","Basement 1",
    ],
    "🔻 地下地面过渡层": ["LG3","LG2","LG1"],
    "🔹 地面与夹层": ["G","UG","M1","M2","M3"],
    "🔹 Podium 层（可选）": ["P1","P2","P3","P3A","P4","P5"],
    "🔼 正常楼层": [
      "Level 1","Level 2","Level 3","Level 3A","Level 4","Level 5","Level 6","Level 7","Level 8","Level 9",
      "Level 10","Level 11","Level 12","Level 13","Level 13A","Level 14","Level 15","Level 16","Level 17","Level 18","Level 19",
      "Level 20","Level 21","Level 22","Level 23","Level 23A","Level 24","Level 25","Level 26","Level 27","Level 28","Level 29","Level 30",
    ],
    "🔝 顶层": ["R（Roof）", "Rooftop"],
  };

  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">车位位置范围</label>
        <div className="flex gap-2">
          {/* 最小楼层 */}
          {isCustom.min ? (
            <input
              type="text"
              placeholder="请输入最小楼层"
              value={customValue.min}
              onChange={(e) => {
                setCustomValue({ ...customValue, min: e.target.value });
                onChange({ ...value, min: e.target.value });
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            />
          ) : (
            <select
              value={value?.min || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "自定义") {
                  setIsCustom({ ...isCustom, min: true });
                  onChange({ ...value, min: "" }); // 先清空
                } else {
                  onChange({ ...value, min: v });
                }
              }}
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
              <option value="自定义">其他（自定义）</option>
            </select>
          )}

          {/* 最大楼层 */}
          {isCustom.max ? (
            <input
              type="text"
              placeholder="请输入最大楼层"
              value={customValue.max}
              onChange={(e) => {
                setCustomValue({ ...customValue, max: e.target.value });
                onChange({ ...value, max: e.target.value });
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            />
          ) : (
            <select
              value={value?.max || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "自定义") {
                  setIsCustom({ ...isCustom, max: true });
                  onChange({ ...value, max: "" });
                } else {
                  onChange({ ...value, max: v });
                }
              }}
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
              <option value="自定义">其他（自定义）</option>
            </select>
          )}
        </div>
      </div>
    );
  }

  // -------- 单选模式 --------
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      {isCustom.single ? (
        <input
          type="text"
          placeholder="请输入车位位置"
          value={customValue.single}
          onChange={(e) => {
            setCustomValue({ ...customValue, single: e.target.value });
            onChange(e.target.value);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      ) : (
        <select
          value={value || ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "自定义") {
              setIsCustom({ ...isCustom, single: true });
              onChange(""); // 进入自定义模式时清空
            } else {
              onChange(v);
            }
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">请选择车位位置</option>
          {Object.entries(groupedOptions).map(([groupLabel, options]) => (
            <optgroup key={groupLabel} label={groupLabel}>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </optgroup>
          ))}
          <option value="自定义">其他（自定义）</option>
        </select>
      )}
    </div>
  );
}
