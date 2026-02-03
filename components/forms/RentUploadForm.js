"use client";

import { useRef } from "react";

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
import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";
import ListingTrustSection from "@/components/trust/ListingTrustSection";

// ✅ 只新增：Layout 图纸上传（使用 New Project 同款 BlueprintUploadSection，不动其它逻辑）
function LayoutBlueprintUploader({ value = [], onChange }) {
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...(Array.isArray(value) ? value : []), ...files];
    onChange?.(next);
  };

  return <BlueprintUploadSection fileInputRef={fileInputRef} onUpload={handleUpload} />;
}

// ✅ 只新增：复用同一段“房源描述”输入框（不改变状态结构）
function DescriptionField({ description, setDescription }) {
  return (
    <div className="space-y-2">
      <label className="font-semibold">房源描述</label>
      <textarea
        className="border p-3 rounded-lg w-full min-h-[120px]"
        placeholder="请输入房源描述..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </div>
  );
}

export default function RentUploadForm({
  saleType,
  computedStatus,

  // ✅ 兼容：有些父层会传 isRoomRental，有些只传 roomRentalMode
  isRoomRental,
  roomRentalMode,

  // ✅✅✅ 关键：你的 TypeSelector 会把 roomCount/layoutCount 写进 typeForm
  typeForm,

  singleFormData,
  setSingleFormData,

  areaData,
  setAreaData,

  description,
  setDescription,

  rentBatchMode = "no",

  // ✅ 兼容旧参数：父层可能会传 layoutCount
  layoutCount = 1,

  unitLayouts = [],
  setUnitLayouts,

  propertyCategory = "",
}) {
  // ✅✅✅ 只补：房间/整租分支渲染需要一个稳定判断（优先用 isRoomRental，否则用 roomRentalMode）
  const isRoomRentalFinal =
    typeof isRoomRental === "boolean"
      ? isRoomRental
      : String(roomRentalMode || "").toLowerCase() === "room";

  const isBatch = rentBatchMode === "yes";

  // ✅✅✅ 只加：批量显示保护条件（批量只能用于“整间出租”，房间出租时禁止进入批量分支）
  const shouldShowBatch = isBatch && !isRoomRentalFinal;

  // ✅✅✅ ✅关键修复：数量逻辑用回你原本设计（来自 typeForm）
  // 房间出租：只有 roomCountMode === "multi" 才用 roomCount，否则就是 1
  const roomCountMode = String(typeForm?.roomCountMode || "single");
  const roomCountFromType = Number(typeForm?.roomCount || 1);
  const roomFormsCount = isRoomRentalFinal && roomCountMode === "multi" ? Math.max(1, roomCountFromType) : 1;

  // 整租批量：layoutCount 来自 typeForm.layoutCount（2~20），否则 fallback 旧的 layoutCount
  const layoutCountFromType = Number(typeForm?.layoutCount || layoutCount || 2);
  const batchLayoutsCount = Math.max(2, layoutCountFromType);

  const updateBatchLayout = (idx, patch) => {
    if (!setUnitLayouts) return;
    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr[idx] = { ...(arr[idx] || {}), ...(patch || {}) };
      return arr;
    });
  };

  // ======================
  // ✅ 批量（整间出租）
  // ======================
  if (shouldShowBatch) {
    return (
      <div className="space-y-4">
        {Array.from({ length: batchLayoutsCount }).map((_, idx) => {
          const data = unitLayouts?.[idx] || {};

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">房型 {idx + 1}</div>

              <AreaSelector value={areaData} onChange={setAreaData} propertyCategory={propertyCategory} />

              <PriceInput
                value={data.rent}
                listingMode="Rent"
                areaData={areaData}
                onChange={(rent) => updateBatchLayout(idx, { rent })}
              />

              <RoomCountSelector value={data} onChange={(patch) => updateBatchLayout(idx, patch)} />

              <CarparkCountSelector
                value={data.carparks}
                onChange={(val) => updateBatchLayout(idx, { carparks: val })}
              />

              <CarparkLevelSelector
                value={data.carparkLevel}
                onChange={(val) => updateBatchLayout(idx, { carparkLevel: val })}
              />

              <FacingSelector value={data.facing} onChange={(val) => updateBatchLayout(idx, { facing: val })} />

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

              <TransitSelector value={data.transit} onChange={(val) => updateBatchLayout(idx, { transit: val })} />

              {/* ✅✅ 每个房型都有 Layout 图纸上传 */}
              <LayoutBlueprintUploader
                value={data.layoutPhotos}
                onChange={(val) => updateBatchLayout(idx, { layoutPhotos: val })}
              />

              {/* ✅ 原本房源照片上传（保留） */}
              <ImageUpload value={data} onChange={(next) => updateBatchLayout(idx, next)} fixedLabels={["房源外观/环境"]} />

              {/* ✅✅ 房源描述 */}
              <DescriptionField description={description} setDescription={setDescription} />

              {/* ✅✅✅ 修复：formData -> singleFormData / setFormData -> setSingleFormData */}
              <ListingTrustSection
                mode="rent"
                value={singleFormData?.trustSection || {}}
                onChange={(next) =>
                  setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))
                }
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ======================
  // ✅ 非批量
  // 1) 出租房间
  // 2) 整间出租
  // ======================
  return (
    <div className="space-y-4">
      {/* ===== 出租房间 ===== */}
      {isRoomRentalFinal ? (
        roomFormsCount > 1 ? (
          <div className="space-y-4">
            {Array.from({ length: roomFormsCount }).map((_, idx) => {
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

                  {/* ✅✅ 每间房也有 Layout 图纸上传 */}
                  <LayoutBlueprintUploader
                    value={roomValue.layoutPhotos}
                    onChange={(next) => {
                      if (!setUnitLayouts) return;
                      setUnitLayouts((prev) => {
                        const arr = Array.isArray(prev) ? [...prev] : [];
                        arr[idx] = { ...(arr[idx] || {}), layoutPhotos: next };
                        return arr;
                      });
                    }}
                  />

                  {/* ✅ 原本房源照片上传（保留） */}
                  <ImageUpload
                    value={roomValue}
                    onChange={(next) => {
                      if (!setUnitLayouts) return;
                      setUnitLayouts((prev) => {
                        const arr = Array.isArray(prev) ? [...prev] : [];
                        arr[idx] = next || {};
                        return arr;
                      });
                    }}
                    labelsOverride={["房源照片上传"]}
                  />

                  <DescriptionField description={description} setDescription={setDescription} />
                </div>
              );
            })}

            {/* ✅ 房间模式下：Trust 只出现一次（不重复） */}
            <ListingTrustSection
              mode="rent"
              value={singleFormData?.trustSection || {}}
              onChange={(next) =>
                setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))
              }
            />
          </div>
        ) : (
          <>
            <RoomRentalForm value={singleFormData} onChange={setSingleFormData} />

            <LayoutBlueprintUploader
              value={singleFormData.layoutPhotos}
              onChange={(next) => setSingleFormData((p) => ({ ...p, layoutPhotos: next }))}
            />

            <ImageUpload value={singleFormData} onChange={setSingleFormData} labelsOverride={["房源照片上传"]} />

            <DescriptionField description={description} setDescription={setDescription} />

            <ListingTrustSection
              mode="rent"
              value={singleFormData?.trustSection || {}}
              onChange={(next) =>
                setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))
              }
            />
          </>
        )
      ) : (
        /* ===== 整间出租（非批量） ===== */
        <>
          <AreaSelector value={areaData} onChange={setAreaData} propertyCategory={propertyCategory} />

          <PriceInput
            value={singleFormData.rent}
            listingMode="Rent"
            areaData={areaData}
            onChange={(rent) => setSingleFormData((p) => ({ ...p, rent }))}
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

          <FacingSelector value={singleFormData.facing} onChange={(val) => setSingleFormData((p) => ({ ...p, facing: val }))} />

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

          <TransitSelector value={singleFormData.transit} onChange={(val) => setSingleFormData((p) => ({ ...p, transit: val }))} />

          <LayoutBlueprintUploader
            value={singleFormData.layoutPhotos}
            onChange={(next) => setSingleFormData((p) => ({ ...p, layoutPhotos: next }))}
          />

          <ImageUpload value={singleFormData} onChange={setSingleFormData} fixedLabels={["房源外观/环境"]} />

          <DescriptionField description={description} setDescription={setDescription} />

          <ListingTrustSection
            mode="rent"
            value={singleFormData?.trustSection || {}}
            onChange={(next) =>
              setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))
            }
          />
        </>
      )}
    </div>
  );
}
