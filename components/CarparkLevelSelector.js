import React, { useState, useEffect, useMemo, useRef } from "react";

export default function CarparkLevelSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  const [customValue, setCustomValue] = useState({
    min: "",
    max: "",
    single: "",
  });
  const [isCustom, setIsCustom] = useState({
    min: false,
    max: false,
    single: false,
  });

  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );
  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  // ✅ 给 datalist 一个稳定且不冲突的 id
  const listIdRef = useRef(
    `carpark-level-options-${Math.random().toString(36).slice(2)}`
  );
  const listId = listIdRef.current;

  // 父组件 value 变化时，同步到内部（保持你原本逻辑）
  useEffect(() => {
    if (mode === "range") {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({
        min: v.min || "",
        max: v.max || "",
      });
    } else {
      setInternalSingle(typeof value === "string" ? value : "");
    }
  }, [value, mode]);

  const groupedOptions = {
    "🔻 地下楼层（Basement）": [
      "Basement 10",
      "Basement 9",
      "Basement 8",
      "Basement 7",
      "Basement 6",
      "Basement 5",
      "Basement 4",
      "Basement 3A",
      "Basement 3",
      "Basement 2",
      "Basement 1",
    ],
    "🔻 地下地面过渡层": ["LG3", "LG2", "LG1"],
    "🔹 地面与夹层": ["G", "UG", "M1", "M2", "M3"],
    "🔹 Podium 层（可选）": ["P1", "P2", "P3", "P3A", "P4", "P5"],
    "🔼 正常楼层": [
      "Level 1",
      "Level 2",
      "Level 3",
      "Level 3A",
      "Level 4",
      "Level 5",
      "Level 6",
      "Level 7",
      "Level 8",
      "Level 9",
      "Level 10",
      "Level 11",
      "Level 12",
      "Level 13",
      "Level 13A",
      "Level 14",
      "Level 15",
      "Level 16",
      "Level 17",
      "Level 18",
      "Level 19",
      "Level 20",
      "Level 21",
      "Level 22",
      "Level 23",
      "Level 23A",
      "Level 24",
      "Level 25",
      "Level 26",
      "Level 27",
      "Level 28",
      "Level 29",
      "Level 30",
    ],
    "🔝 顶层": ["R（Roof）", "Rooftop"],
  };

  // ✅ 展平所有选项给 datalist 用（不改变你原本选项内容）
  const flatOptions = useMemo(() => {
    const all = [];
    Object.values(groupedOptions).forEach((arr) => all.push(...arr));
    return all;
  }, []);

  // ======================
  // ✅ range 模式（完全保持你原本的写法）
  // ======================
  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          车位位置范围
        </label>

        <div className="flex gap-2">
          {/* Min */}
          {isCustom.min ? (
            <input
              type="text"
              placeholder="请输入最小楼层"
              value={customValue.min}
              onChange={(e) => {
                const v = e.target.value;
                setCustomValue((p) => ({ ...p, min: v }));
                const next = { ...internalRange, min: v };
                setInternalRange(next);
                onChange?.(next);
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            />
          ) : (
            <select
              value={internalRange.min || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "自定义") {
                  setIsCustom((p) => ({ ...p, min: true }));
                  setCustomValue((p) => ({ ...p, min: "" }));
                  const next = { ...internalRange, min: "" };
                  setInternalRange(next);
                  onChange?.(next);
                } else {
                  const next = { ...internalRange, min: v };
                  setInternalRange(next);
                  onChange?.(next);
                }
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">最小楼层</option>
              {Object.entries(groupedOptions).map(([groupLabel, options]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="自定义">其他（自定义）</option>
            </select>
          )}

          {/* Max */}
          {isCustom.max ? (
            <input
              type="text"
              placeholder="请输入最大楼层"
              value={customValue.max}
              onChange={(e) => {
                const v = e.target.value;
                setCustomValue((p) => ({ ...p, max: v }));
                const next = { ...internalRange, max: v };
                setInternalRange(next);
                onChange?.(next);
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            />
          ) : (
            <select
              value={internalRange.max || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "自定义") {
                  setIsCustom((p) => ({ ...p, max: true }));
                  setCustomValue((p) => ({ ...p, max: "" }));
                  const next = { ...internalRange, max: "" };
                  setInternalRange(next);
                  onChange?.(next);
                } else {
                  const next = { ...internalRange, max: v };
                  setInternalRange(next);
                  onChange?.(next);
                }
              }}
              className="w-1/2 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">最大楼层</option>
              {Object.entries(groupedOptions).map(([groupLabel, options]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
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

  // ======================
  // ✅ single 模式（保持原本外观/布局，只改成可编辑）
  // - 不再需要点“自定义”
  // - 选完还能编辑
  // - 不画你现在那种大浮层 UI
  // ======================
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      <input
        type="text"
        list={listId}
        placeholder="请选择或输入车位位置"
        value={internalSingle || ""}
        onChange={(e) => {
          const v = e.target.value;
          setInternalSingle(v);
          onChange?.(v);
        }}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <datalist id={listId}>
        {flatOptions.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}
