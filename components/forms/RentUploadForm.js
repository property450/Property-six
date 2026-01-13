// components/forms/RentUploadForm.js
"use client";

import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomRentalForm from "@/components/RoomRentalForm";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import TransitSelector from "@/components/TransitSelector";

import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacingSelector from "@/components/FacingSelector";
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

  // ✅【只加这一个】给 AreaSelector 做 Land 自动切换
  propertyCategory = "",
}) {
  const isBatch = rentBatchMode === "yes";

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

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">房型 {idx + 1}</div>

              {/* ✅ 修复：Rent 价格要传 data.rent，并回传 { rent } */}
              <PriceInput
                value={data.rent}
                onChange={(rent) => updateBatchLayout(idx, { rent })}
                listingMode="Rent"
              />

              <RoomCountSelector
                value={data}
                onChange={(patch) => updateBatchLayout(idx, patch)}
              />

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

              <ImageUpload
                config={data.photoConfig}
                images={data.photos}
                setImages={(updated) => updateBatchLayout(idx, { photos: updated })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // 单表单（非批量）
  return (
    <div className="space-y-4">
      {/* ✅ 修复：出租房间 + 多房间时，显示 房间1 / 房间2 ... */}
      {isRoomRental && roomRentalMode === "multi" ? (
        <div className="space-y-4">
          {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
            const roomData = unitLayouts && unitLayouts[idx] ? unitLayouts[idx] : {};

            return (
              <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
                <div className="text-lg font-semibold">房间 {idx + 1}</div>

                <RoomRentalForm
                  isRoomRental
                  roomRentalMode="single"
                  data={roomData}
                  setData={(next) => {
                    if (!setUnitLayouts) return;
                    setUnitLayouts((prev) => {
                      const arr = Array.isArray(prev) ? [...prev] : [];
                      arr[idx] = next || {};
                      return arr;
                    });
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <RoomRentalForm
          isRoomRental={isRoomRental}
          roomRentalMode={roomRentalMode}
          data={singleFormData}
          setData={setSingleFormData}
        />
      )}

      <AreaSelector
        value={areaData}
        onChange={setAreaData}
        propertyCategory={propertyCategory}
      />

      {/* ✅ 修复：Rent 价格要传 singleFormData.rent，并回传 rent 写回去 */}
      <PriceInput
        value={singleFormData.rent}
        onChange={(rent) => setSingleFormData((p) => ({ ...p, rent }))}
        listingMode="Rent"
      />

      <RoomCountSelector
        value={singleFormData}
        onChange={(patch) => setSingleFormData((p) => ({ ...p, ...patch }))}
      />

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

      <ImageUpload
        config={singleFormData.photoConfig}
        images={singleFormData.photos}
        setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
      />
    </div>
  );
}
