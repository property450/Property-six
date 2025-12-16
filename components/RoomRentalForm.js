// components/RoomRentalForm.js
"use client";

import React from "react";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import TransitSelector from "./TransitSelector";

const bedTypeOptions = [
  "King size",
  "Queen size",
  "Super Single size",
  "Single size",
  "上下床",
  "没有提供床",
];

const rentIncludeOptions = [
  "包括电费",
  "包括水费",
  "包括沥水机",
  "包括管理费",
  "包括电费但冷气/空调费不包",
];

const cleaningOptions = [
  "每月一次",
  "每两星期一次",
  "每三星期一次",
  "每个星期一次",
  "没有清洁服务",
];

const parkingOptions = [
  "1个车位",
  "2个车位",
  "3个车位",
  "4个车位",
  "5个车位",
  "公共停车位",
  "没有车位",
  "车位另租",
];

const parkingRentOptions = [50, 100, 150, 200];

const raceOptions = ["马来人", "印度人", "华人", "外国人"];

const leaseTermOptions = [
  "1个月",
  "3个月",
  "6个月",
  "一年以下",
  "一年以上",
];

const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

export default function RoomRentalForm({ data, onChange }) {
  const value = data || {};

  const update = (patch) => {
    const next = { ...value, ...patch };
    onChange && onChange(next);
  };

  // 通用：多选（带 ✅）
  const toggleMulti = (field, item) => {
    const current = Array.isArray(value[field]) ? value[field] : [];
    const exists = current.includes(item);
    const next = exists ? current.filter((v) => v !== item) : [...current, item];
    update({ [field]: next });
  };

  const renderMultiSelect = (label, field, options, placeholder) => {
    const selected = Array.isArray(value[field]) ? value[field] : [];
    return (
      <div className="mt-3">
        <label className="block font-medium mb-1">{label}</label>
        <div className="border rounded p-2 bg-white cursor-pointer">
          <div className="text-sm text-gray-700">
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selected.map((v) => `${v} ✅`).join("，")
            )}
          </div>
        </div>
        <div className="mt-1 border rounded bg-white divide-y">
          {options.map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex justify-between items-center ${
                  isOn ? "bg-gray-50 font-semibold" : ""
                }`}
                onClick={() => toggleMulti(field, opt)}
              >
                <span>{opt}</span>
                {isOn && <span>✅</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Bed config: [{ type, count }]
  const beds = Array.isArray(value.beds) ? value.beds : [];

  const updateBed = (index, patch) => {
    const list = [...beds];
    list[index] = { ...list[index], ...patch };
    update({ beds: list });
  };

  const ensureBedsForSelectedTypes = (nextTypes) => {
    const types = Array.isArray(nextTypes) ? nextTypes : [];
    const list = types.map((t) => {
      const existing = beds.find((b) => b.type === t);
      return existing || { type: t, count: "1" };
    });
    update({ beds: list });
  };

  const bedTypes = Array.isArray(value.bedTypes) ? value.bedTypes : [];

  return (
    <div className="space-y-4 mt-4 border rounded-lg p-4 bg-gray-50">
      {/* 房型 */}
      <div>
        <label className="block font-medium mb-1">这是什么房？</label>
        <select
          className="w-full border rounded p-2"
          value={value.roomType || ""}
          onChange={(e) => update({ roomType: e.target.value })}
        >
          <option value="">请选择房型</option>
          <option value="大房">大房</option>
          <option value="中房">中房</option>
          <option value="单人房">单人房</option>
        </select>
      </div>

      {/* 卫生间 */}
      <div>
        <label className="block font-medium mb-1">卫生间</label>
        <select
          className="w-full border rounded p-2"
          value={value.bathroomType || ""}
          onChange={(e) => update({ bathroomType: e.target.value })}
        >
          <option value="">请选择卫生间类型</option>
          <option value="独立卫生间">独立卫生间</option>
          <option value="共用卫生间">共用卫生间</option>
        </select>
      </div>

      {/* 床型多选 + 数量 */}
      <div>
        <label className="block font-medium mb-1">请选择床型</label>
        <div className="border rounded p-2 bg-white">
          <div className="flex flex-wrap gap-2">
            {bedTypeOptions.map((opt) => {
              const on = bedTypes.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`px-2 py-1 text-sm rounded border flex items-center gap-1 ${
                    on ? "bg-blue-50 border-blue-500 font-semibold" : "bg-white"
                  }`}
                  onClick={() => {
                    const exists = bedTypes.includes(opt);
                    const next = exists
                      ? bedTypes.filter((v) => v !== opt)
                      : [...bedTypes, opt];
                    update({ bedTypes: next });
                    ensureBedsForSelectedTypes(next);
                  }}
                >
                  <span>{opt}</span>
                  {on && <span>✅</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 数量列表 */}
        {beds.length > 0 && (
          <div className="mt-3 space-y-2">
            {beds.map((bed, idx) => (
              <div
                key={bed.type}
                className="flex items-center gap-3 border p-2 rounded bg-white"
              >
                <span className="w-32 text-sm font-medium">{bed.type}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-24 border rounded px-2 py-1 text-sm"
                    value={bed.count ?? ""}
                    onChange={(e) =>
                      updateBed(idx, {
                        count: e.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                  />
                  <span className="text-sm text-gray-500">张</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 房间私密性 */}
      <div>
        <label className="block font-medium mb-1">是独立房间还是共用房间？</label>
        <select
          className="w-full border rounded p-2"
          value={value.roomPrivacy || ""}
          onChange={(e) => update({ roomPrivacy: e.target.value })}
        >
          <option value="">请选择</option>
          <option value="独立房间">独立房间</option>
          <option value="共用房间">共用房间</option>
        </select>
      </div>

      {/* 性别要求 */}
      <div>
        <label className="block font-medium mb-1">是否男女混住？</label>
        <select
          className="w-full border rounded p-2"
          value={value.genderPolicy || ""}
          onChange={(e) => update({ genderPolicy: e.target.value })}
        >
          <option value="">请选择</option>
          <option value="男女混住">男女混住</option>
          <option value="只限女生">只限女生</option>
          <option value="只限男生">只限男生</option>
        </select>
      </div>

      {/* 宠物 */}
      <div>
        <label className="block font-medium mb-1">是否允许宠物？</label>
        <select
          className="w-full border rounded p-2"
          value={value.petsAllowed || ""}
          onChange={(e) => update({ petsAllowed: e.target.value })}
        >
          <option value="">请选择</option>
          <option value="允许">允许</option>
          <option value="不允许">不允许</option>
        </select>
      </div>

      {/* ⬇️ 新加：是否允许烹饪 */}
      <div>
        <label className="block font-medium mb-1">是否允许烹饪？</label>
        <select
          className="w-full border rounded p-2"
          value={value.cookingAllowed || ""}
          onChange={(e) => update({ cookingAllowed: e.target.value })}
        >
          <option value="">请选择</option>
          <option value="允许">允许</option>
          <option value="不允许">不允许</option>
        </select>
      </div>

      {/* 租金包括 - 多选 */}
      {renderMultiSelect(
        "租金包括",
        "rentIncludes",
        rentIncludeOptions,
        "请选择租金包含的项目（可多选）"
      )}

      {/* 清洁服务 */}
      <div>
        <label className="block font-medium mb-1">清洁服务</label>
        <select
          className="w-full border rounded p-2"
          value={value.cleaningService || ""}
          onChange={(e) => update({ cleaningService: e.target.value })}
        >
          <option value="">请选择</option>
          {cleaningOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 车位 */}
      <div>
        <label className="block font-medium mb-1">包括几个车位？</label>
        <select
          className="w-full border rounded p-2"
          value={value.parkingOption || ""}
          onChange={(e) => update({ parkingOption: e.target.value })}
        >
          <option value="">请选择</option>
          {parkingOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 如果是车位另租，显示车位租金 */}
      {value.parkingOption === "车位另租" && (
        <div>
          <label className="block font-medium mb-1">
            一个车位大概多少钱？
          </label>
          <select
            className="w-full border rounded p-2"
            value={value.parkingRentPrice || ""}
            onChange={(e) => update({ parkingRentPrice: e.target.value })}
          >
            <option value="">请选择价格</option>
            {parkingRentOptions.map((price) => (
              <option key={price} value={String(price)}>
                {formatNumber(price)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 偏向的种族 - 多选 */}
      {renderMultiSelect(
        "偏向的种族",
        "preferredRaces",
        raceOptions,
        "请选择偏向的种族（可多选）"
      )}

      {/* 接受的租期 - 多选 */}
      {renderMultiSelect(
        "接受的租期",
        "acceptedLeaseTerms",
        leaseTermOptions,
        "请选择接受的租期（可多选）"
      )}

      {/* 入住日期 */}
      <div>
        <label className="block font-medium mb-1">几时开始可以入住？</label>
        <input
          type="date"
          className="w-full border rounded p-2"
          value={value.availableFrom || ""}
          onChange={(e) => update({ availableFrom: e.target.value })}
        />
        {value.availableFrom && (
          <p className="mt-1 text-sm text-gray-600">
            在 {value.availableFrom} 就可以开始入住了
          </p>
        )}
      </div>

      {/* 下面是你普通表单里的 4 个输入框 */}
      <ExtraSpacesSelector
        value={value.extraSpaces || []}
        onChange={(v) => update({ extraSpaces: v })}
      />
      <FurnitureSelector
        value={value.furniture || []}
        onChange={(v) => update({ furniture: v })}
      />
      <FacilitiesSelector
        value={value.facilities || []}
        onChange={(v) => update({ facilities: v })}
      />
      <div className="mb-2">
        <label className="block font-medium mb-1">
          你的产业步行能到达公共交通吗？
        </label>
        <TransitSelector
          value={value.transit || null}
          onChange={(v) => update({ transit: v })}
        />
      </div>
    </div>
  );
}
