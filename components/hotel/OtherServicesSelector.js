// components/hotel/OtherServicesSelector.js
"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";

// 默认下拉选项
const BASE_OPTIONS = [
  "机场接送",
  "允许携带宠物",
  "室外监控摄像头",
  "行李寄存",
];

const OPTIONS = BASE_OPTIONS.map((label) => ({
  value: label,
  label,
}));

/**
 * value: 数组，每一项 { label: string, remark: string }
 * 例子：
 * [
 *   { label: "机场接送", remark: "需提前 24 小时预约" },
 *   { label: "允许携带宠物", remark: "限 10kg 以下" }
 * ]
 */
export default function OtherServicesSelector({ value, onChange }) {
  const [items, setItems] = useState(Array.isArray(value) ? value : []);

  // 外部 value 改变时同步进来
  useEffect(() => {
    setItems(Array.isArray(value) ? value : []);
  }, [value]);

  // 处理标签选择 / 新增
  const handleTagChange = (selected) => {
    const labels = (selected || []).map((opt) => opt.value);

    const next = labels.map((label) => {
      const exist = items.find((i) => i.label === label);
      return exist || { label, remark: "" };
    });

    setItems(next);
    onChange?.(next);
  };

  // 处理某个标签的备注修改
  const handleRemarkChange = (label, remark) => {
    const next = items.map((i) =>
      i.label === label ? { ...i, remark } : i
    );
    setItems(next);
    onChange?.(next);
  };

  const selectValue = items.map((i) => ({
    value: i.label,
    label: i.label,
  }));

  return (
    <div className="space-y-2 mt-4">
      <label className="block text-sm font-medium mb-1">
        其它服务（可加备注）
      </label>

      {/* 标签选择 + 自定义输入，效果跟“风景”类似 */}
      <CreatableSelect
        isMulti
        placeholder="选择或输入其它服务，例如：租车服务"
        options={OPTIONS}
        value={selectValue}
        onChange={handleTagChange}
        formatCreateLabel={(input) => `添加自定义：${input}`}
      />

      {/* 每个标签下面一个备注输入框 */}
      <div className="space-y-2 mt-2">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">{i.label}</span>
            <input
              type="text"
              className="border rounded p-1 text-sm"
              placeholder="备注（可留空）"
              value={i.remark || ""}
              onChange={(e) =>
                handleRemarkChange(i.label, e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
