import React, { useState, useEffect, useRef, useMemo } from "react";

export default function CarparkLevelSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );

  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  // 父组件 value 变化时，同步到内部
  useEffect(() => {
    if (mode === "range") {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({ min: v.min || "", max: v.max || "" });
    } else {
      setInternalSingle(typeof value === "string" ? value : "");
    }
  }, [value, mode]);

  // ✅ 选项（保持你原本分组/内容）
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

  // ========= 通用：可编辑下拉输入框（选择后仍可编辑） =========
  function EditableDropdownInput({
    placeholder,
    value,
    onValueChange,
    maxHeightClass = "max-h-64", // ✅ 控制下拉高度（你说要关小一些）
  }) {
    const wrapRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [isTypingFilter, setIsTypingFilter] = useState(false);
    const [query, setQuery] = useState("");

    // 点击外部关闭
    useEffect(() => {
      const handler = (e) => {
        if (!wrapRef.current) return;
        if (!wrapRef.current.contains(e.target)) {
          setOpen(false);
          setIsTypingFilter(false);
          setQuery("");
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredGroupedOptions = useMemo(() => {
      // ✅ 点击/聚焦：显示全量；只有输入时才筛选
      if (!isTypingFilter) return groupedOptions;

      const q = (query || "").trim().toLowerCase();
      if (!q) return groupedOptions;

      const next = {};
      for (const [group, arr] of Object.entries(groupedOptions)) {
        const hit = arr.filter((x) => x.toLowerCase().includes(q));
        if (hit.length) next[group] = hit;
      }
      return next;
    }, [isTypingFilter, query]);

    return (
      <div className="relative" ref={wrapRef}>
        <input
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onFocus={() => {
            setOpen(true);
            setIsTypingFilter(false);
            setQuery("");
          }}
          onClick={() => {
            setOpen(true);
            setIsTypingFilter(false);
            setQuery("");
          }}
          onChange={(e) => {
            const v = e.target.value;
            onValueChange(v);

            setOpen(true);
            setIsTypingFilter(true);
            setQuery(v);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        {open && (
          <div
            className={`absolute z-30 w-full bg-white border border-gray-300 rounded shadow mt-1 ${maxHeightClass} overflow-y-auto`}
          >
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
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onValueChange(opt);
                        setOpen(false);
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
    );
  }

  // ======================
  // range 模式：✅ 选择 + 可编辑（按你要求）
  // ======================
  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          车位位置范围
        </label>

        <div className="flex gap-2">
          <div className="w-1/2">
            <EditableDropdownInput
              placeholder="最小楼层"
              value={internalRange.min}
              onValueChange={(v) => {
                const next = { ...internalRange, min: v };
                setInternalRange(next);
                onChange?.(next);
              }}
              // ✅ 下拉不要太长：这里控制高度（你觉得还长就改成 max-h-52 / max-h-48）
              maxHeightClass="max-h-56"
            />
          </div>

          <div className="w-1/2">
            <EditableDropdownInput
              placeholder="最大楼层"
              value={internalRange.max}
              onValueChange={(v) => {
                const next = { ...internalRange, max: v };
                setInternalRange(next);
                onChange?.(next);
              }}
              maxHeightClass="max-h-56"
            />
          </div>
        </div>
      </div>
    );
  }

  // ======================
  // single 模式：✅ 选择 + 可编辑（你之前满意的逻辑）
  // ======================
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      <EditableDropdownInput
        placeholder="请选择车位位置"
        value={internalSingle}
        onValueChange={(v) => {
          setInternalSingle(v);
          onChange?.(v);
        }}
        // ✅ 你说下拉太长：这里同样改小
        maxHeightClass="max-h-56"
      />
    </div>
  );
}
