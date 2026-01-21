// components/ExtraSpacesSelector.js
"use client";

import React, { useState, useRef, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

// 数量模式用到的工具函数 ------------
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 数量下拉选项
const quantityOptions = [0, 1, 2, 3, 4, 5, 6, "custom"];

// 预设额外空间选项
const extraSpacesOptions = [
  "阳台",
  "书房",
  "花园",
  "庭院",
  "走廊",
  "大厅",
  "景观",
  "洗衣房",
  "储物间",
].map((label) => ({ value: label, label }));

/**
 * ExtraSpacesSelector
 *
 * props:
 *  - value: 数组
 *      quantity 模式: [{ label, count, remark? }]
 *      remark   模式: [{ label, remark }]
 *  - onChange: (nextArray) => void
 *  - variant: "quantity" | "remark"
 *      不传时默认 "quantity"（Sale / Rent）
 */
export default function ExtraSpacesSelector({
  value = [],
  onChange,
  variant = "quantity",
}) {
  const [selectedSpaces, setSelectedSpaces] = useState([]);

  // ✅✅✅ 同步外部传进来的值：加“内容对比”，避免每次 render 都 setState 导致 Maximum update depth
  const lastSyncJsonRef = useRef("");

  useEffect(() => {
    const arr = Array.isArray(value) ? value : [];
    const normalized = arr.map((item) => {
      if (!item) return { label: "", count: "", remark: "" };

      if (typeof item === "string") {
        return { label: item, count: "", remark: "" };
      }

      const label = item.label ?? item.value ?? "";
      return {
        label,
        count: item.count ?? "",
        remark: item.remark ?? "",
      };
    });

    let nextJson = "";
    try {
      nextJson = JSON.stringify(normalized);
    } catch {
      nextJson = "";
    }

    // ✅ 内容没变就不要 setState（否则会无限循环）
    if (nextJson && nextJson === lastSyncJsonRef.current) return;
    lastSyncJsonRef.current = nextJson;

    setSelectedSpaces(normalized);
  }, [value]);

  // ---------- 共用：标签选择 ----------
  const handleSelectChange = (selected) => {
    const newLabels = (selected || []).map((opt) => opt.value);

    const updated = newLabels.map((label) => {
      const existing = selectedSpaces.find((s) => s.label === label);

      if (existing) {
        // 保留原来的 count / remark
        return {
          label,
          count: existing.count ?? "",
          remark: existing.remark ?? "",
        };
      }

      // 不同模式有不同默认结构
      if (variant === "remark") {
        return { label, remark: "" };
      }

      // quantity 模式默认有 count + remark
      return { label, count: "", remark: "" };
    });

    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  // =========================
  //  模式一：数量 (sale / rent)
  // =========================
  const [openKey, setOpenKey] = useState(null);
  const [customFlags, setCustomFlags] = useState({});
  const refs = useRef({});

  // 点击外部关闭下拉（仅数量模式需要）
  useEffect(() => {
    if (variant !== "quantity") return;

    const onDocClick = (e) => {
      const anyHit = Object.values(refs.current).some(
        (el) => el && el.contains(e.target)
      );
      if (!anyHit) setOpenKey(null);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [variant]);

  // 只在数量模式下用到的更新函数
  const setCountValue = (label, val) => {
    const updated = selectedSpaces.map((s) =>
      s.label === label ? { ...s, count: val } : s
    );
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  const handlePick = (label, opt) => {
    if (opt === "custom") {
      setCustomFlags((p) => ({ ...p, [label]: true }));
      setCountValue(label, "");
      setOpenKey(null);
      return;
    }
    setCustomFlags((p) => ({ ...p, [label]: false }));
    setCountValue(label, String(opt));
    setOpenKey(null);
  };

  const handleInputCount = (label, rawInput) => {
    const raw = parseNumber(rawInput);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 7) return;
    setCountValue(label, raw);
  };

  const renderQuantityOptions = (spaceLabel) => {
    return quantityOptions.map((opt) => {
      const isCustom = opt === "custom";
      const display = isCustom ? "自定义" : String(opt);
      return (
        <li
          key={String(opt)}
          onMouseDown={(e) => {
            e.preventDefault();
            handlePick(spaceLabel, opt);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {display}
        </li>
      );
    });
  };

  // =========================
  //  模式二：备注 (Homestay / Hotel)
  // =========================
  const setRemarkValue = (label, remark) => {
    const updated = selectedSpaces.map((s) =>
      s.label === label ? { ...s, remark } : s
    );
    setSelectedSpaces(updated);
    onChange?.(updated);
  };

  // =========================
  //  渲染
  // =========================
  const labelText =
    variant === "remark" ? "额外空间（可加备注）" : "额外空间";

  return (
    <div className="space-y-2 mt-2">
      <label className="block font-medium mb-1">{labelText}</label>

      {/* 标签输入框 */}
      <CreatableSelect
        isMulti
        closeMenuOnSelect={false}
        placeholder="选择或输入额外空间..."
        options={extraSpacesOptions}
        value={selectedSpaces.map((s) => ({ value: s.label, label: s.label }))}
        onChange={handleSelectChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />

      {/* 不同模式下面的内容不同 */}
      {variant === "quantity" ? (
        // ---------- 数量模式：标签 + 数量选择 + 备注 ----------
        <div className="space-y-3 mt-3">
          {selectedSpaces.map((space) => {
            const isNumberLike = /^\d+$/.test(String(space.count || ""));
            const display = isNumberLike
              ? formatNumber(space.count)
              : space.count || "";
            const isCustom = !!customFlags[space.label];
            const placeholder = isCustom
              ? "请输入你要的数字"
              : "输入或选择数量";

            return (
              <div
                key={space.label}
                ref={(el) => (refs.current[space.label] = el)}
                className="border p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{space.label}</span>
                  <div className="relative w-32">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring focus:border-blue-500"
                      placeholder={placeholder}
                      value={display}
                      onChange={(e) =>
                        handleInputCount(space.label, e.target.value)
                      }
                      onFocus={() => setOpenKey(space.label)}
                      onClick={() => setOpenKey(space.label)}
                    />
                    {openKey === space.label && (
                      <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                        {renderQuantityOptions(space.label)}
                      </ul>
                    )}
                  </div>
                </div>

                {/* ⭐ 新增：备注输入框（Sale / Rent 也有） */}
                <input
                  type="text"
                  className="mt-2 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-blue-500 bg-white"
                  placeholder="备注（可留空）"
                  value={space.remark || ""}
                  onChange={(e) =>
                    setRemarkValue(space.label, e.target.value)
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        // ---------- 备注模式：标签 + 文本备注 ----------
        <div className="space-y-2 mt-2">
          {selectedSpaces.map((space) => (
            <div key={space.label} className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">{space.label}</span>
              <input
                type="text"
                className="border rounded p-1 text-sm"
                placeholder="备注（可留空）"
                value={space.remark || ""}
                onChange={(e) =>
                  setRemarkValue(space.label, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

