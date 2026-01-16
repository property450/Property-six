// components/hotel/GuestSelector.js
"use client";

export default function GuestSelector({ value, onChange }) {
  const guests = value || { adults: "", children: "" };

  const update = (patch) => {
    onChange?.({ ...guests, ...patch });
  };

  const normalizeNumberLike = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // 只保留数字
    const digits = s.replace(/[^\d]/g, "");
    // 允许空
    return digits === "" ? "" : digits;
  };

  const renderEditableSelect = (field, label, listId) => (
    <div className="flex items-center gap-2">
      <span className="w-10 text-sm">{label}</span>

      <input
        className="
    border rounded px-2 py-1
    bg-white text-black
    [color-scheme:light]
  "
        list={listId}
        inputMode="numeric"
        placeholder="请选择"
        value={guests[field] ?? ""}
        onChange={(e) => update({ [field]: normalizeNumberLike(e.target.value) })}
        onBlur={(e) => update({ [field]: normalizeNumberLike(e.target.value) })}
      />

      <datalist id={listId}>
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)} />
        ))}
      </datalist>
    </div>
  );

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        这个房型能住几个人？
      </label>

      <div className="flex flex-wrap gap-4">
        {renderEditableSelect("adults", "大人", "guest-adults-options")}
        {renderEditableSelect("children", "小孩", "guest-children-options")}
      </div>
    </div>
  );
}
