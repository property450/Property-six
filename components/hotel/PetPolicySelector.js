// components/hotel/PetPolicySelector.js
"use client";

const OPTIONS = [
  { value: "forbidden", label: "禁止携带宠物" },
  { value: "allowed", label: "允许携带宠物" },
  { value: "care", label: "提供宠物托管服务" },
];

export default function PetPolicySelector({ value, onChange }) {
  const v = value || {
    type: "",
    note: "",
  };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        房型是否允许宠物入住？
      </label>
      <select
        className="border rounded p-2 w-full max-w-xs"
        value={v.type || ""}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">请选择宠物政策</option>
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 备注输入框（一直显示，方便说明细节） */}
      <textarea
        className="w-full border rounded p-2 text-xs"
        rows={2}
        placeholder="备注说明，例如：仅限小型犬、需额外清洁费、托管服务时间等…"
        value={v.note || ""}
        onChange={(e) => update({ note: e.target.value })}
      />
    </div>
  );
}
