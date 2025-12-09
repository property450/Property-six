// components/hotel/OtherServicesSelector.js
"use client";

import React from "react";

const SERVICE_OPTIONS = [
  { value: "airport_transfer", label: "机场接送" },
  { value: "pet_friendly", label: "允许携带宠物" },
  { value: "outdoor_cctv", label: "室外监控摄像头" },
];

/**
 * props:
 *  - value: 数组 [{ value, label, remark }]
 *  - onChange: (nextArray) => void
 */
export default function OtherServicesSelector({ value, onChange }) {
  const safeValue = Array.isArray(value) ? value : [];

  const findItem = (val) => safeValue.find((item) => item.value === val);

  const toggleService = (option) => {
    const exists = findItem(option.value);
    let next;
    if (exists) {
      // 取消勾选 -> 从数组里移除
      next = safeValue.filter((item) => item.value !== option.value);
    } else {
      // 勾选 -> 加入数组，备注默认为空
      next = [
        ...safeValue,
        { value: option.value, label: option.label, remark: "" },
      ];
    }
    onChange && onChange(next);
  };

  const handleRemarkChange = (option, text) => {
    const next = safeValue.map((item) =>
      item.value === option.value ? { ...item, remark: text } : item
    );
    onChange && onChange(next);
  };

  return (
    <div className="space-y-2 mt-4">
      <label className="block text-sm font-medium text-gray-700">
        其它服务（可多选）
      </label>

      <p className="text-xs text-gray-500">
        例如：机场接送是否收费、宠物限制、监控范围等说明。
      </p>

      <div className="space-y-3">
        {SERVICE_OPTIONS.map((opt) => {
          const selectedItem = findItem(opt.value);
          const checked = !!selectedItem;

          return (
            <div
              key={opt.value}
              className="border rounded-md p-2 flex flex-col gap-2 bg-white"
            >
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={() => toggleService(opt)}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>

              {/* 只有勾选后才显示备注输入框 */}
              {checked && (
                <input
                  type="text"
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  placeholder={`备注（例如：${opt.label}是否收费、时间、限制等）`}
                  value={selectedItem?.remark || ""}
                  onChange={(e) => handleRemarkChange(opt, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
