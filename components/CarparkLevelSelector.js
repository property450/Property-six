import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ✅ 可编辑下拉输入框（点击显示下拉、点选后仍可编辑）
 * - 点击/聚焦：显示“全量列表”
 * - 只有在用户真正输入时才筛选
 * - 适配手机：onTouchStart / onMouseDown 强制打开
 */
function EditableDropdownInput({
  placeholder,
  value,
  onValueChange,
  groupedOptions,
  maxHeightClass = "max-h-56",
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [isTypingFilter, setIsTypingFilter] = useState(false);
  const [query, setQuery] = useState("");

  // 点击外部关闭（用 capture 更稳）
  useEffect(() => {
    const handler = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target)) {
        setOpen(false);
        setIsTypingFilter(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
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
  }, [groupedOptions, isTypingFilter, query]);

  const openAll = () => {
    setOpen(true);
    setIsTypingFilter(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ""}
        className="w-full border border-gray-300 rounded px-3 py-2"
        // ✅ 手机/桌面都稳：先用 mouseDown/touchStart 打开，避免 focus 还没触发就被外部监听关掉
        onMouseDown={() => openAll()}
        onTouchStart={() => openAll()}
        onFocus={() => openAll()}
        onClick={() => openAll()}
        onChange={(e) => {
          const v = e.target.value;
          onValueChange(v);

          // ✅ 只有真正输入时才筛选
          setOpen(true);
          setIsTypingFilter(true);
          setQuery(v);
        }}
      />

      {open && (
        <div
          className={[
            "absolute z-50 w-full bg-white border border-gray-300 rounded shadow mt-1 overflow-y-auto",
            maxHeightClass,
          ].join(" ")}
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
                    // ✅ 防止点击导致 input blur -> dropdown 先关掉导致 click 丢失
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
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

  // ✅ 把 groupedOptions memo 住，避免每次渲染都变成新对象导致 dropdown 状态怪异
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

  // ======================
  // range 模式：✅ 选择 + 可编辑（你要求的）
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
              groupedOptions={groupedOptions}
              maxHeightClass="max-h-52" // ✅ 比较短，不会太长（你要再短就改 max-h-48）
              onValueChange={(v) => {
                const next = { ...internalRange, min: v };
                setInternalRange(next);
                onChange?.(next);
              }}
            />
          </div>

          <div className="w-1/2">
            <EditableDropdownInput
              placeholder="最大楼层"
              value={internalRange.max}
              groupedOptions={groupedOptions}
              maxHeightClass="max-h-52"
              onValueChange={(v) => {
                const next = { ...internalRange, max: v };
                setInternalRange(next);
                onChange?.(next);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ======================
  // single 模式：✅ 选择 + 可编辑（你之前要的视频效果）
  // ======================
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位位置</label>

      <EditableDropdownInput
        placeholder="请选择车位位置"
        value={internalSingle}
        groupedOptions={groupedOptions}
        maxHeightClass="max-h-52" // ✅ 下拉缩短
        onValueChange={(v) => {
          setInternalSingle(v);
          onChange?.(v);
        }}
      />
    </div>
  );
}
