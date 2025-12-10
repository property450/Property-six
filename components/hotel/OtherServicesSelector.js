// components/hotel/OtherServicesSelector.js
"use client";

import { useState } from "react";

const PRESET_SERVICES = [
  "机场接送",
  "允许携带宠物",
  "室外监控摄像头",
  "行李寄存",
];

function normalizeValue(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        key: item,
        label: item,
        note: "",
      };
    }
    return {
      key: item.key || item.label || `service_${index}`,
      label: item.label || "",
      note: item.note || "",
    };
  });
}

export default function OtherServicesSelector({ value, onChange }) {
  const [customInput, setCustomInput] = useState("");
  const services = normalizeValue(value);

  const triggerChange = (next) => {
    onChange?.(next);
  };

  const toggleService = (label) => {
    const existing = services.find((s) => s.label === label);
    if (existing) {
      // 取消选择
      triggerChange(services.filter((s) => s.label !== label));
    } else {
      // 新增
      triggerChange([
        ...services,
        { key: label, label, note: "" },
      ]);
    }
  };

  const handleNoteChange = (key, note) => {
    const next = services.map((s) =>
      s.key === key ? { ...s, note } : s
    );
    triggerChange(next);
  };

  const handleAddCustom = () => {
    const label = customInput.trim();
    if (!label) return;

    if (!services.find((s) => s.label === label)) {
      triggerChange([
        ...services,
        { key: label, label, note: "" },
      ]);
    }
    setCustomInput("");
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  // 把自定义的标签也显示在上面的“可点的标签”里
  const allTagLabels = Array.from(
    new Set([...PRESET_SERVICES, ...services.map((s) => s.label)])
  );

  return (
    <div className="mt-4 space-y-2">
      <p className="font-semibold text-sm">
        其它服务（可加备注）
      </p>

      {/* 标签选择 + 自定义输入 */}
      <div className="flex flex-wrap gap-2">
        {allTagLabels.map((label) => {
          const active = !!services.find((s) => s.label === label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggleService(label)}
              className={`px-3 py-1 rounded-full border text-sm ${
                active
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-1 text-sm"
          placeholder="输入其它服务后回车添加，例如：行程规划、租车服务..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleCustomKeyDown}
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3 py-1 text-sm border rounded bg-white"
        >
          添加
        </button>
      </div>

      {/* 每个服务的备注 */}
      {services.length > 0 && (
        <div className="space-y-2 mt-3">
          {services.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="text-sm font-medium">{s.label}</div>
              <input
                type="text"
                className="w-full border rounded px-3 py-1 text-sm"
                placeholder="备注（可留空）"
                value={s.note}
                onChange={(e) =>
                  handleNoteChange(s.key, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
