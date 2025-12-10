// components/hotel/OtherServicesSelector.js
"use client";
import { useState } from "react";
import TagInput from "./TagInput"; // 你已有的 tag input 组件

export default function OtherServicesSelector({ value, onChange }) {
  const services = value?.items || [];
  const note = value?.note || "";

  const update = (patch) => {
    onChange({
      items: services,
      note,
      ...patch,
    });
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">其它服务</label>

      <TagInput
        value={services}
        onChange={(items) => update({ items })}
        placeholder="如：机场接送、宠物允许、户外监控摄像头等"
      />

      <textarea
        className="border p-2 rounded w-full"
        placeholder="备注（可选）"
        value={note}
        onChange={(e) => update({ note: e.target.value })}
      />
    </div>
  );
}
