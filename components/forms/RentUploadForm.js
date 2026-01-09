// components/forms/RentUploadForm.js
"use client";

import { useEffect } from "react";

import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomRentalForm from "@/components/RoomRentalForm";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import TransitSelector from "@/components/TransitSelector";
import FacingSelector from "@/components/FacingSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";

export default function RentUploadForm({
  saleType,
  computedStatus,

  isRoomRental,
  roomRentalMode,

  singleFormData,
  setSingleFormData,
  areaData,
  setAreaData,
  description,
  setDescription,

  rentBatchMode = "no",
  layoutCount = 1,
  unitLayouts = [],
  setUnitLayouts,

  // ✅ 新增：为了 AreaSelector 自动切换
  propertyCategory,
}) {
  // ✅✅✅ 关键：房间出租时，不允许进入 batch 渲染
  const isBatch = rentBatchMode === "yes" && !isRoomRental;

  const roomCount = Math.max(1, Math.min(20, Number(layoutCount) || 1));

  useEffect(() => {
    if (!isRoomRental) {
      setUnitLayouts?.([]);
      return;
    }

    if (roomCount <= 1) {
      setUnitLayouts?.([]);
      return;
    }

    setUnitLayouts?.((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: roomCount }).map((_, i) => prevArr[i] || {});
    });
  }, [isRoomRental, roomCount, setUnitLayouts]);

  const updateBatchLayout = (idx, patch) => {
    if (!setUnitLayouts) return;
    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr[idx] = { ...(arr[idx] || {}), ...(patch || {}) };
      return arr;
    });
  };

  if (isBatch) {
    return (
      <div className="space-y-4">
        {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
          const data = unitLayouts?.[idx] || {};
          const localArea = data.areaData || {
            types: ["buildUp"],
            units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
            values: { buildUp: "", land: "" },
          };

          const title = `房型 ${idx + 1}`;

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">{title}</div>

              <AreaSelector
                value={localArea}
                onChange={(val) => updateBatchLayout(idx, { areaData: val })}
                propertyCategory={propertyCategory}
              />

              <PriceInput value={data} onChange={(next) => updateBatchLayout(idx, next)} />

              <div className="space-y-3">
                <CarparkCountSelector
                  value={data.carparks}
                  onChange={(val) => updateBatchLayout(idx, { carparks: val })}
                />
                <CarparkLevelSelector
                  value={data.carparkLevel}
                  onChange={(val) => updateBatchLayout(idx, { carparkLevel: val })}
                />
                <FacingSelector
                  value={data.facing}
                  onChange={(val) => updateBatchLayout(idx, { facing: val })}
                />
              </div>

              <div className="space-y-3">
                <ExtraSpacesSelector
                  value={data.extraSpaces}
                  onChange={(val) => updateBatchLayout(idx, { extraSpaces: val })}
                />
                <FurnitureSelector
                  value={data.furniture}
                  onChange={(val) => updateBatchLayout(idx, { furniture: val })}
                />
                <FacilitiesSelector
                  value={data.facilities}
                  onChange={(val) => updateBatchLayout(idx, { facilities: val })}
                />
                <TransitSelector
                  value={data.transit}
                  onChange={(val) => updateBatchLayout(idx, { transit: val })}
                />
                <BuildYearSelector
                  value={data.completedYear}
                  onChange={(val) => updateBatchLayout(idx, { completedYear: val })}
                  label="完成年份"
                />
              </div>

              <ImageUpload
                config={data.photoConfig}
                images={data.images}
                setImages={(val) => updateBatchLayout(idx, { images: val })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoomRentalForm
        isRoomRental={isRoomRental}
        roomRentalMode={roomRentalMode}
        data={singleFormData}
        setData={setSingleFormData}
      />

      <AreaSelector
        value={areaData}
        onChange={setAreaData}
        propertyCategory={propertyCategory}
      />

      <PriceInput value={singleFormData} onChange={setSingleFormData} listingMode="Rent" />

      <div className="space-y-3">
        <CarparkCountSelector
          value={singleFormData.carparks}
          onChange={(val) => setSingleFormData((p) => ({ ...p, carparks: val }))}
        />
        <CarparkLevelSelector
          value={singleFormData.carparkLevel}
          onChange={(val) => setSingleFormData((p) => ({ ...p, carparkLevel: val }))}
        />
        <FacingSelector
          value={singleFormData.facing}
          onChange={(val) => setSingleFormData((p) => ({ ...p, facing: val }))}
        />
      </div>

      <div className="space-y-3">
        <ExtraSpacesSelector
          value={singleFormData.extraSpaces}
          onChange={(val) => setSingleFormData((p) => ({ ...p, extraSpaces: val }))}
        />
        <FurnitureSelector
          value={singleFormData.furniture}
          onChange={(val) => setSingleFormData((p) => ({ ...p, furniture: val }))}
        />
        <FacilitiesSelector
          value={singleFormData.facilities}
          onChange={(val) => setSingleFormData((p) => ({ ...p, facilities: val }))}
        />
        <TransitSelector
          value={singleFormData.transit}
          onChange={(val) => setSingleFormData((p) => ({ ...p, transit: val }))}
        />
        <BuildYearSelector
          value={singleFormData.completedYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, completedYear: val }))}
          label="完成年份"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">房源描述</div>
        <textarea
          className="border rounded w-full p-3"
          rows={4}
          placeholder="请输入房源描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ImageUpload
        config={singleFormData.photoConfig}
        images={singleFormData.images}
        setImages={(val) => setSingleFormData((p) => ({ ...p, images: val }))}
      />
    </div>
  );
}
