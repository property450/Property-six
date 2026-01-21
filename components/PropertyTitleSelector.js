// components/PropertyTitleSelector.js
"use client";

export default function PropertyTitleSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block font-medium">
        Property Title
      </label>

      <select
        className="w-full border rounded px-3 py-2 bg-white"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">请选择 Property Title</option>

        <option value="Individual Title">
          Individual Title
        </option>

        <option value="Strata Title">
          Strata Title
        </option>

        <option value="Master Title (Pending Individual / Strata Title)">
          Master Title（Pending Individual / Strata Title）
        </option>
      </select>

      <p className="text-sm text-gray-600">
        Property Title 指房产目前的地契类型，新项目或部分已完工项目可能仍为发展商总地契。
      </p>
    </div>
  );
}
