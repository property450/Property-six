// components/hotel/GuestSelector.js
"use client";

export default function GuestSelector({ value, onChange }) {
  const guests = value || { adults: "", children: "" };

  const update = (patch) => {
    onChange?.({ ...guests, ...patch });
  };

  const renderSelect = (field, label) => (
    <div className="flex items-center gap-2">
      <span className="w-10 text-sm">{label}</span>
      <select
        className="border rounded p-1 w-24"
        value={guests[field] || ""}
        onChange={(e) => update({ [field]: e.target.value })}
      >
        <option value="">请选择</option>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        这个房型能住几个人？
      </label>
      <div className="flex flex-wrap gap-4">
        {renderSelect("adults", "大人")}
        {renderSelect("children", "小孩")}
      </div>
    </div>
  );
}
