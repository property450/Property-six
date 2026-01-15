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

  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );
  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  // ✅ single 模式下拉控制：点击/聚焦显示全量，输入才筛选
  const [openSingleDropdown, setOpenSingleDropdown] = useState(false);
  const [isTypingFilter, setIsTypingFilter] = useState(false);
  const [query, setQuery] = useState("");
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
        setIsTypingFilter(false);
        setQuery("");
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

  const filteredGroupedOptions = useMemo(() => {
    // ✅ 只有在“输入筛选模式”才过滤；点击/聚焦永远显示全量
    if (!isTypingFilter) return groupedOptions;

    const q = (query || "").trim().toLowerCase();
    if (!q) return groupedOptions;

    const next = {};
    for (const [group, arr] of Object.entries(groupedOptions)) {
      const hit = arr.filter((x) => x.toLowerCase().includes(q));
      if (hit.length) next[group] = hit;
    }
    return next;
  }, [groupedOptions, isTypingFilter, query]);

  // ======================
  // range 模式（保持你原本逻辑）
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
  // single 模式：✅ 点击全量下拉 + 输入才筛选 + 选择后可编辑
  // ======================
  return (
    <div className="space-y-2" ref={singleWrapRef}>
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      <div className="relative">
        <input
          type="text"
          placeholder="请选择车位位置"
          value={internalSingle || ""}
          // ✅ 重点：点击/聚焦永远显示全量
          onFocus={() => {
            setOpenSingleDropdown(true);
            setIsTypingFilter(false);
            setQuery("");
          }}
          onClick={() => {
            setOpenSingleDropdown(true);
            setIsTypingFilter(false);
            setQuery("");
          }}
          onChange={(e) => {
            const v = e.target.value;
            setInternalSingle(v);
            onChange?.(v);

            // ✅ 只有真正输入时才筛选
            setOpenSingleDropdown(true);
            setIsTypingFilter(true);
            setQuery(v);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        {openSingleDropdown && (
          <div className="absolute z-30 w-full bg-white border border-gray-300 rounded shadow mt-1 max-h-[520px] overflow-y-auto">
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
                      // 防止点击导致 input blur 先关掉下拉
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setInternalSingle(opt);
                        onChange?.(opt);

                        // ✅ 选中后关闭，下次再点输入框仍然全量下拉
                        setOpenSingleDropdown(false);
                        setIsTypingFilter(false);
                        setQuery("");
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
