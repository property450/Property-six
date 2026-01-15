import React, { useState, useEffect, useRef, useMemo } from "react";

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

  // ⭐ 内部 state，用来记住范围 / 单选
  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );
  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  // ✅ 只给 single 模式用的下拉控制
  const [openSingleDropdown, setOpenSingleDropdown] = useState(false);
  const singleWrapRef = useRef(null);

  // 父组件 value 变化时，同步到内部
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

  // ✅ 点击外部关闭 single 下拉
  useEffect(() => {
    const handler = (e) => {
      if (!singleWrapRef.current) return;
      if (!singleWrapRef.current.contains(e.target)) {
        setOpenSingleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // ✅ single 下拉：根据输入过滤（不改你原本 options，只是过滤显示）
  const filteredGroupedOptions = useMemo(() => {
    const q = (internalSingle || "").trim().toLowerCase();
    if (!q) return groupedOptions;

    const next = {};
    for (const [group, arr] of Object.entries(groupedOptions)) {
      const hit = arr.filter((x) => x.toLowerCase().includes(q));
      if (hit.length) next[group] = hit;
    }
    return next;
  }, [internalSingle, groupedOptions]);

  // ======================
  // range 模式（完全保持你原本代码，不动）
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
  // single 模式：✅ 选择后还能编辑（视频那种）
  // ======================
  return (
    <div className="space-y-2" ref={singleWrapRef}>
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      <div className="relative">
        <input
          type="text"
          placeholder="请选择车位位置"
          value={internalSingle || ""}
          onFocus={() => setOpenSingleDropdown(true)}
          onClick={() => setOpenSingleDropdown(true)}
          onChange={(e) => {
            const v = e.target.value;
            setInternalSingle(v);
            onChange?.(v);
            setOpenSingleDropdown(true);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        {openSingleDropdown && (
          <div className="absolute z-30 w-full bg-white border border-gray-300 rounded shadow mt-1 max-h-64 overflow-y-auto">
            {Object.keys(filteredGroupedOptions).length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                没有匹配选项（可直接输入）
              </div>
            ) : (
              Object.entries(filteredGroupedOptions).map(([groupLabel, options]) => (
                <div key={groupLabel}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    {groupLabel}
                  </div>
                  {options.map((opt) => (
                    <div
                      key={opt}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      // 防止点击时 input 先 blur 导致 dropdown 关闭
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setInternalSingle(opt);
                        onChange?.(opt);
                        setOpenSingleDropdown(false);
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
