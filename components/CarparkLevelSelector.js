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
    single: false, // ✅ 这里继续用，但不再由“自定义选项”触发，而是由“编辑行为”触发
  });

  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );
  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  const singleInputRef = useRef(null);

  // 父组件 value 变化时，同步到内部（保持你原本逻辑）
  useEffect(() => {
    if (mode === "range") {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({
        min: v.min || "",
        max: v.max || "",
      });
    } else {
      const v = typeof value === "string" ? value : "";
      setInternalSingle(v);
      setCustomValue((p) => ({ ...p, single: v }));
    }
  }, [value, mode]);

  // ✅ 选项（完全保留你原本的 optgroup 风格与内容）
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

  const flatOptions = useMemo(() => {
    const all = [];
    Object.values(groupedOptions).forEach((arr) => all.push(...arr));
    return all;
  }, [groupedOptions]);

  const isKnownOption = useMemo(() => {
    if (!internalSingle) return true;
    return flatOptions.includes(internalSingle);
  }, [internalSingle, flatOptions]);

  // ✅ 进入编辑模式（不需要自定义选项）
  const enterEdit = (firstChar = "") => {
    setIsCustom((p) => ({ ...p, single: true }));
    setCustomValue((p) => ({
      ...p,
      single: firstChar ? firstChar : internalSingle || "",
    }));

    setTimeout(() => {
      if (singleInputRef.current) {
        singleInputRef.current.focus();
        const len = singleInputRef.current.value.length;
        singleInputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  // ✅ 提交编辑并回到 select 外观
  const commitEdit = () => {
    const v = (customValue.single || "").trim();
    setInternalSingle(v);
    onChange?.(v);
    setIsCustom((p) => ({ ...p, single: false }));
  };

  // ======================
  // range 模式（保持你原本逻辑，不动）
  // ======================
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

  // ======================
  // single 模式：保持 select 风格 + 可编辑 + 无“自定义”选项
  // ======================
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      {/* ✅ 编辑时：同一个位置显示 input（样式不变） */}
      {isCustom.single ? (
        <input
          ref={singleInputRef}
          type="text"
          placeholder="请选择车位位置"
          value={customValue.single}
          onChange={(e) => {
            const v = e.target.value;
            setCustomValue((p) => ({ ...p, single: v }));
          }}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") {
              // 取消编辑，回到 select（不改变原值）
              setCustomValue((p) => ({ ...p, single: internalSingle || "" }));
              setIsCustom((p) => ({ ...p, single: false }));
            }
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      ) : (
        <select
          value={internalSingle || ""}
          onChange={(e) => {
            const v = e.target.value;
            setInternalSingle(v);
            setCustomValue((p) => ({ ...p, single: v }));
            onChange?.(v);
          }}
          // ✅ 关键：你想编辑时直接打字 / Backspace，就进入编辑（不用“自定义选项”）
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
              enterEdit("");
              return;
            }
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              enterEdit(e.key);
            }
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">请选择车位位置</option>

          {/* ✅ 如果当前值不是列表里的选项，也能在 select 里正常显示（但不叫“自定义”） */}
          {!isKnownOption && internalSingle ? (
            <option value={internalSingle}>{internalSingle}</option>
          ) : null}

          {Object.entries(groupedOptions).map(([groupLabel, options]) => (
            <optgroup key={groupLabel} label={groupLabel}>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}
