import React, { useEffect, useMemo, useRef, useState } from "react";

export default function CarparkLevelSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  // ---------- 原本状态 ----------
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

  // ✅ 用来在“开始打字编辑”时自动 focus input
  const singleInputRef = useRef(null);

  // ---------- 选项（保留你的 optgroup 风格） ----------
  const groupedOptions = useMemo(
    () => ({
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
    }),
    []
  );

  // ---------- 外部 value 变化时同步 ----------
  useEffect(() => {
    if (mode === "range") {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({
        min: v.min || "",
        max: v.max || "",
      });
    } else {
      setInternalSingle(typeof value === "string" ? value : "");
      // 如果外部传进来一个 string，我们也同步到 customValue.single 方便编辑
      setCustomValue((p) => ({
        ...p,
        single: typeof value === "string" ? value : "",
      }));
    }
  }, [value, mode]);

  // ---------- range 模式：保持你原本逻辑 ----------
  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          车位位置范围
        </label>

        <div className="flex gap-2">
          {/* 最小楼层 */}
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

          {/* 最大楼层 */}
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

  // ---------- single 模式：保留原本 select 风格 + 允许直接编辑 ----------
  // 重点：仍然是 select（你的截图那种），但你只要开始打字就自动进入 input（无需点自定义）
  const startEditingFromSelect = (typedChar = "") => {
    setIsCustom((p) => ({ ...p, single: true }));
    setCustomValue((p) => ({
      ...p,
      single: (typedChar ? "" : (internalSingle || "")) + typedChar,
    }));

    // 下一个 tick focus input
    setTimeout(() => {
      if (singleInputRef.current) {
        singleInputRef.current.focus();
        // 光标放到末尾
        const len = singleInputRef.current.value.length;
        singleInputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      {/* ✅ 编辑模式：input（外观样式保持一样） */}
      {isCustom.single ? (
        <div className="flex gap-2">
          <input
            ref={singleInputRef}
            type="text"
            placeholder="请输入车位位置"
            value={customValue.single}
            onChange={(e) => {
              const v = e.target.value;
              setCustomValue((p) => ({ ...p, single: v }));
              setInternalSingle(v);
              onChange?.(v);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          {/* ✅ 返回到原本下拉 select（不改布局，只多一个很小按钮） */}
          <button
            type="button"
            onClick={() => {
              setIsCustom((p) => ({ ...p, single: false }));
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm whitespace-nowrap"
          >
            返回选择
          </button>
        </div>
      ) : (
        // ✅ 默认：原本 select 下拉（optgroup 风格完全保留）
        <select
          value={internalSingle || ""}
          onChange={(e) => {
            const v = e.target.value;

            // 你原本的“自定义”仍然保留（但你以后基本用不到了）
            if (v === "自定义") {
              setIsCustom((p) => ({ ...p, single: true }));
              setCustomValue((p) => ({ ...p, single: "" }));
              setInternalSingle("");
              onChange?.("");
              return;
            }

            setInternalSingle(v);
            setCustomValue((p) => ({ ...p, single: v }));
            onChange?.(v);
          }}
          // ✅ 关键：你开始打字就自动进入编辑（无需选自定义）
          onKeyDown={(e) => {
            // Backspace / Delete：进入编辑
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
              startEditingFromSelect("");
              return;
            }

            // 可打印字符：进入编辑并把字符放进去
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              startEditingFromSelect(e.key);
            }
          }}
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

          <option value="自定义">其他（自定义）</option>
        </select>
      )}
    </div>
  );
}
