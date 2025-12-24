//components/UnitLayoutForm.js
"use client";
import { useState, useEffect, useRef } from "react";

import PriceInput from "./PriceInput";
import CarparkCountSelector from "./CarparkCountSelector";
import BuildYearSelector from "./BuildYearSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import CarparkLevelSelector from "./CarparkLevelSelector";
import RoomCountSelector from "./RoomCountSelector";
import AreaSelector from "./AreaSelector";
import ImageUpload from "./ImageUpload";
import TransitSelector from "./TransitSelector";

import { CATEGORY_OPTIONS } from "../constants/propertyCategories";
import { NEED_STOREYS_CATEGORY } from "../constants/propertyRules";
import { parseSubtypeToArray, toArray } from "../utils/arrayUtils";
import { getPsfText } from "../utils/psfUtils";
import { normalizeTransitToSelector, normalizeTransitFromSelector } from "../utils/transitUtils";
import { getPhotoLabelsFromConfig } from "../utils/imageLabelUtils";
import useOutsideClick from "../hooks/useOutsideClick";

export default function UnitLayoutForm({ index, data, onChange }) {
  const layout = data || {};
  const unitDropdownRef = useRef(null);

  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  useOutsideClick(unitDropdownRef, () => setUnitDropdownOpen(false), unitDropdownOpen);

  // 交通 selector 的受控值（保持你原本思路：normalize）
  const [transitValue, setTransitValue] = useState(() => normalizeTransitToSelector(layout));

  useEffect(() => {
    setTransitValue(normalizeTransitToSelector(layout));
  }, [layout?.walkToTransit, layout?.transitLines, layout?.transitStations, layout?.transitNotes]);

  const updateLayout = (patch, meta) => {
    const updated = { ...layout, ...patch };
    onChange?.(updated, meta);
  };

  const category = layout.category || "";
  const subType = parseSubtypeToArray(layout.subType);
  const isNeedStoreys = NEED_STOREYS_CATEGORY.has(category);

  const psfText = getPsfText(layout.area, layout.price);

  // 图片上传标签
  const photoLabels = getPhotoLabelsFromConfig({
    bedroomCount: layout.bedroomCount,
    bathroomCount: layout.bathroomCount,
    carparkCount: layout.carparkCount,
    storeRoomCount: layout.storeRoomCount,
    extraSpaces: toArray(layout.extraSpaces),
    facilities: toArray(layout.facilities),
    furniture: toArray(layout.furniture),
    facing: toArray(layout.facing),
  });

  return (
    <div className="border rounded p-4 mb-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg">房型 {index + 1}</div>
        <div className="text-sm text-gray-500">{layout.layoutTitle || ""}</div>
      </div>

      {/* Layout Title */}
      <div className="mb-3">
        <label className="font-semibold block mb-1">Layout 标题（可选）</label>
        <input
          className="w-full border rounded p-2"
          value={layout.layoutTitle || ""}
          onChange={(e) => updateLayout({ layoutTitle: e.target.value })}
          placeholder="例如：Type A / 3R2B"
        />
      </div>

      {/* Category */}
      <div className="mb-3">
        <label className="font-semibold block mb-1">Property Category</label>
        <select
          className="w-full border rounded p-2"
          value={category}
          onChange={(e) => updateLayout({ category: e.target.value }, { commonField: "category" })}
        >
          <option value="">请选择</option>
          {Object.keys(CATEGORY_OPTIONS).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* SubType */}
      <div className="mb-3" ref={unitDropdownRef}>
        <label className="font-semibold block mb-1">Property SubType（可多选）</label>

        <button
          type="button"
          className="w-full border rounded p-2 text-left"
          onClick={() => setUnitDropdownOpen((v) => !v)}
        >
          {subType.length ? subType.join(", ") : "请选择（可多选）"}
        </button>

        {unitDropdownOpen && (
          <div className="border rounded mt-2 p-2 max-h-56 overflow-auto bg-white">
            {(CATEGORY_OPTIONS[category] || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={subType.includes(opt)}
                  onChange={() => {
                    const next = subType.includes(opt)
                      ? subType.filter((x) => x !== opt)
                      : [...subType, opt];
                    updateLayout({ subType: next }, { commonField: "subType" });
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Storeys */}
      {isNeedStoreys && (
        <div className="mb-3">
          <label className="font-semibold block mb-1">楼层数 / Storeys</label>
          <input
            className="w-full border rounded p-2"
            value={layout.storeys || ""}
            onChange={(e) => updateLayout({ storeys: e.target.value }, { commonField: "storeys" })}
            placeholder="例如：2"
          />
        </div>
      )}

      {/* Area */}
      <div className="mb-3">
        <AreaSelector
          value={layout.area}
          onChange={(v) => updateLayout({ area: v })}
        />
        {psfText && (
          <div className="text-sm mt-1 text-gray-700">{psfText}</div>
        )}
      </div>

      {/* Price */}
      <div className="mb-3">
        <PriceInput
          value={layout.price}
          onChange={(v) => updateLayout({ price: v })}
        />
      </div>

      {/* Room counts */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <RoomCountSelector
          label="房间数量 / Bedroom"
          value={layout.bedroomCount}
          onChange={(v) => updateLayout({ bedroomCount: v })}
        />
        <RoomCountSelector
          label="浴室数量 / Bathroom"
          value={layout.bathroomCount}
          onChange={(v) => updateLayout({ bathroomCount: v })}
        />
        <CarparkCountSelector
          value={layout.carparkCount}
          onChange={(v) => updateLayout({ carparkCount: v })}
        />
        <RoomCountSelector
          label="储藏室数量 / Store Room"
          value={layout.storeRoomCount}
          onChange={(v) => updateLayout({ storeRoomCount: v })}
        />
      </div>

      {/* Carpark Level */}
      <div className="mb-3">
        <CarparkLevelSelector
          value={layout.carparkLevel}
          onChange={(v) => updateLayout({ carparkLevel: v })}
        />
      </div>

      {/* Extra spaces / furniture / facilities / facing */}
      <div className="mb-3">
        <ExtraSpacesSelector
          value={layout.extraSpaces}
          onChange={(v) => updateLayout({ extraSpaces: v }, { commonField: "extraSpaces" })}
        />
      </div>

      <div className="mb-3">
        <FurnitureSelector
          value={layout.furniture}
          onChange={(v) => updateLayout({ furniture: v }, { commonField: "furniture" })}
        />
      </div>

      <div className="mb-3">
        <FacilitiesSelector
          value={layout.facilities}
          onChange={(v) => updateLayout({ facilities: v }, { commonField: "facilities" })}
        />
      </div>

      <div className="mb-3">
        <FacingSelector
          value={layout.facing}
          onChange={(v) => updateLayout({ facing: v }, { commonField: "facing" })}
        />
      </div>

      {/* Build year */}
      <div className="mb-3">
        <BuildYearSelector
          value={layout.buildYear}
          onChange={(v) => updateLayout({ buildYear: v })}
        />
      </div>

      {/* Transit */}
      <div className="mb-3">
        <TransitSelector
          value={transitValue}
          onChange={(v) => {
            setTransitValue(v);
            const next = normalizeTransitFromSelector(layout, v);
            updateLayout(next, { commonField: "walkToTransit" });
          }}
        />
      </div>

      {/* Images */}
      <div className="mb-3">
        <ImageUpload
          config={{
            bedroomCount: layout.bedroomCount,
            bathroomCount: layout.bathroomCount,
            carparkCount: layout.carparkCount,
            storeRoomCount: layout.storeRoomCount,
            extraSpaces: layout.extraSpaces,
            facilities: layout.facilities,
            furniture: layout.furniture,
            facing: layout.facing,
            labels: photoLabels,
          }}
          images={layout.images}
          setImages={(imgs) => updateLayout({ images: imgs })}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="font-semibold block mb-1">房源描述 / Description</label>
        <textarea
          className="w-full border rounded p-2 min-h-[90px]"
          value={layout.description || ""}
          onChange={(e) => updateLayout({ description: e.target.value })}
          placeholder="写一些卖点..."
        />
      </div>
    </div>
  );
}
