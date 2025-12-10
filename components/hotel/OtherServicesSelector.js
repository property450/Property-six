// components/hotel/OtherServicesSelector.js
"use client";

import { useState, useEffect } from "react";

function normalizeValue(value) {
  if (!value) return { tags: [], note: "" };
  if (Array.isArray(value)) {
    // 兼容旧版本只传数组的情况
    return { tags: value, note: "" };
  }
  return {
    tags: Array.isArray(value.tags) ? value.tags : [],
    note: value.note || "",
  };
}

export default function OtherServicesSelector({ value, onChange }) {
  const [state, setState] = useState(() => normalizeValue(value));
  const [input, setInput] = useState("");

  useEffect(() => {
    setState(normalizeValue(value));
  }, [value]);

  const emitChange = (next) => {
    setState(next);
    onChange && onChange(next);
  };

  const addTagsFromInput = () => {
    const text = input.trim();
    if (!text) return;
    const newTags = text
      .split(/[，,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (newTags.length === 0) return;

    const next = {
      ...state,
      tags: Array.from(new Set([...state.tags, ...newTags])),
    };
    setInput("");
    emitChange(next);
  };

  const removeTag = (tag) => {
    const next = {
      ...state,
      tags: state.tags.filter((t) => t !== tag),
    };
    emitChange(next);
  };

  const handleNoteChange = (e) => {
    const next = { ...state, note: e.target.value };
    emitChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">
        其它服务（机场接送 / 宠物 / 监控等）
      </label>

      {/* 标签输入 */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="例如：机场接送、允许携带宠物、室外监控摄像头..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTagsFromInput();
            }
          }}
        />
        <button
          type="button"
          className="border rounded px-3 py-2 text-sm"
          onClick={addTagsFromInput}
        >
          添加
        </button>
      </div>

      {/* 已选择的标签 */}
      <div className="flex flex-wrap gap-2">
        {state.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 text-sm bg-blue-50 border border-blue-200 rounded-full"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-xs text-gray-500"
              onClick={() => removeTag(tag)}
            >
              ✕
            </button>
          </span>
        ))}
        {state.tags.length === 0 && (
          <span className="text-xs text-gray-400">
            暂无服务，可在上方输入后按回车添加
          </span>
        )}
      </div>

      {/* 备注输入 */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">其它服务备注</label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="例如：机场接送需提前 2 天预约；宠物需加收清洁费等"
          value={state.note}
          onChange={handleNoteChange}
        />
      </div>
    </div>
  );
}
