// components/hotel/OtherServicesSelector.js
"use client";

import { useState, useEffect } from "react";

const PRESET_TAGS = [
  "机场接送",
  "允许携带宠物",
  "室外监控摄像头",
  "行李寄存",
  "自助入住",
  "24小时前台",
];

export default function OtherServicesSelector({ value, onChange }) {
  // 统一成 { tags: [], note: "" } 结构
  const safeValue = value || { tags: [], note: "" };
  const [tags, setTags] = useState(safeValue.tags || []);
  const [note, setNote] = useState(safeValue.note || "");
  const [input, setInput] = useState("");

  // 父组件更新时，同步本地 state
  useEffect(() => {
    setTags(safeValue.tags || []);
    setNote(safeValue.note || "");
  }, [safeValue.tags, safeValue.note]);

  // 把当前 tags + note 回传给父组件
  const emitChange = (nextTags, nextNote) => {
    onChange?.({
      tags: nextTags ?? tags,
      note: nextNote ?? note,
    });
  };

  const toggleTag = (tag) => {
    let next;
    if (tags.includes(tag)) {
      next = tags.filter((t) => t !== tag);
    } else {
      next = [...tags, tag];
    }
    setTags(next);
    emitChange(next, undefined);
  };

  const handleAddCustomTag = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      const next = [...tags, trimmed];
      setTags(next);
      emitChange(next, undefined);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleNoteChange = (e) => {
    const nextNote = e.target.value;
    setNote(nextNote);
    emitChange(undefined, nextNote);
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="font-semibold text-sm">其它服务（标签 + 备注）</p>

      {/* 预设标签 */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm border ${
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* 自定义标签输入 */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="输入自定义服务名称后按 Enter 或点添加，例如：代订门票"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleAddCustomTag}
          className="px-3 py-1 border rounded text-sm"
        >
          添加
        </button>
      </div>

      {/* 备注框 */}
      <div className="mt-2">
        <label className="block text-xs text-gray-600 mb-1">
          其它服务备注（可选）
        </label>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={2}
          placeholder="例如：机场接送需提前 24 小时预约；允许携带小型宠物，需额外清洁费等"
          value={note}
          onChange={handleNoteChange}
        />
      </div>
    </div>
  );
}
