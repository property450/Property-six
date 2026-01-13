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

  // ✅ 批量模式（整间出租的批量）
  if (isBatch) {
    return (
      <div className="space-y-4">
        {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
          const data = unitLayouts?.[idx] || {};

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">房型 {idx + 1}</div>

              {/* ✅ 修复：Rent 价格必须传 data.rent；onChange 回写 { rent } */}
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

        <div className="space-y-2">
          <label className="font-semibold">房源描述</label>
          <textarea
            className="border p-3 rounded-lg w-full min-h-[120px]"
            placeholder="请输入房源描述..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <ImageUpload
          config={singleFormData.photoConfig}
          images={singleFormData.photos}
          setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
        />
      </div>
    );
  }

  // ✅ 非批量：这里要严格区分【出租房间】 vs 【整间出租】
  return (
    <div className="space-y-4">
      {/* ✅✅✅ 出租房间：用 RoomRentalForm（并且传对 value/onChange 才会记住） */}
      {isRoomRental ? (
        Number(layoutCount) > 1 ? (
          <div className="space-y-4">
            {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
              const roomValue = unitLayouts?.[idx] || {};
              return (
                <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
                  <div className="text-lg font-semibold">房间 {idx + 1}</div>

                  <RoomRentalForm
                    value={roomValue}
                    onChange={(next) => {
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
          <RoomRentalForm value={singleFormData} onChange={setSingleFormData} />
        )
      ) : (
        <>
          {/* ✅✅✅ 整间出租：保持你原本整间表单（不再渲染 RoomRentalForm） */}
          <AreaSelector
            value={areaData}
            onChange={setAreaData}
            propertyCategory={propertyCategory}
          />

          {/* ✅ 修复：Rent 价格必须传 singleFormData.rent；onChange 回写 rent */}
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
        </>
      )}

      {/* ✅ 描述 + 图片：保留你原本的公共区（整间/房间都需要） */}
      <div className="space-y-2">
        <label className="font-semibold">房源描述</label>
        <textarea
          className="border p-3 rounded-lg w-full min-h-[120px]"
          placeholder="请输入房源描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ImageUpload
        config={singleFormData.photoConfig}
        images={singleFormData.photos}
        setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
      />
    </div>
  );
}
