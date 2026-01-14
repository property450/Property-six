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

// ✅ 只新增：Layout 图纸上传（使用 New Project 同款 BlueprintUploadSection，不动其它逻辑）
function LayoutBlueprintUploader({ value = [], onChange }) {
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...(Array.isArray(value) ? value : []), ...files];
    onChange?.(next);
  };

  return (
    <BlueprintUploadSection fileInputRef={fileInputRef} onUpload={handleUpload} />
  );
}

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

  // ======================
  // ✅ 批量（整间出租）
  // ======================
  if (isBatch) {
    return (
      <div className="space-y-4">
        {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
          const data = unitLayouts?.[idx] || {};

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">房型 {idx + 1}</div>

              <AreaSelector
                value={areaData}
                onChange={setAreaData}
                propertyCategory={propertyCategory}
              />

              <PriceInput
                value={data.rent}
                listingMode="Rent"
                areaData={areaData}
                onChange={(rent) => updateBatchLayout(idx, { rent })}
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
                onChange={(val) =>
                  updateBatchLayout(idx, { carparkLevel: val })
                }
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

              {/* ✅✅ 批量：每个房型都要 New Project 同款 Layout 图纸上传 */}
              <LayoutBlueprintUploader
                value={data.layoutPhotos}
                onChange={(next) => updateBatchLayout(idx, { layoutPhotos: next })}
              />

              {/* ✅ 原本房源照片上传（只保留这一套，不会重复） */}
              <ImageUpload
                value={data}
                onChange={(next) => updateBatchLayout(idx, next)}
                fixedLabels={["房源外观/环境"]}
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

                  {/* ✅✅ 多房间：每间都要 Layout 图纸上传 */}
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

                  {/* ✅ 原本房源照片上传（只保留这一套，不会重复） */}
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
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <RoomRentalForm value={singleFormData} onChange={setSingleFormData} />

            {/* ✅✅ 单房间：Layout 图纸上传 */}
            <LayoutBlueprintUploader
              value={singleFormData.layoutPhotos}
              onChange={(next) =>
                setSingleFormData((p) => ({ ...p, layoutPhotos: next }))
              }
            />

            {/* ✅ 原本房源照片上传（只保留这一套，不会重复） */}
            <ImageUpload
              value={singleFormData}
              onChange={setSingleFormData}
              labelsOverride={["房源照片上传"]}
            />
          </>
        )
      ) : (
        /* ===== 整间出租（非批量） ===== */
        <>
          <AreaSelector
            value={areaData}
            onChange={setAreaData}
            propertyCategory={propertyCategory}
          />

          <PriceInput
            value={singleFormData.rent}
            listingMode="Rent"
            areaData={areaData}
            onChange={(rent) => setSingleFormData((p) => ({ ...p, rent }))}
          />

          <RoomCountSelector
            value={singleFormData}
            onChange={(patch) =>
              setSingleFormData((p) => ({ ...p, ...patch }))
            }
          />

          <CarparkCountSelector
            value={singleFormData.carparks}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, carparks: val }))
            }
          />

          <CarparkLevelSelector
            value={singleFormData.carparkLevel}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, carparkLevel: val }))
            }
          />

          <FacingSelector
            value={singleFormData.facing}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, facing: val }))
            }
          />

          <ExtraSpacesSelector
            value={singleFormData.extraSpaces}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, extraSpaces: val }))
            }
          />

          <FurnitureSelector
            value={singleFormData.furniture}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, furniture: val }))
            }
          />

          <FacilitiesSelector
            value={singleFormData.facilities}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, facilities: val }))
            }
          />

          <TransitSelector
            value={singleFormData.transit}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, transit: val }))
            }
          />

          {/* ✅✅ 整间单个：Layout 图纸上传 */}
          <LayoutBlueprintUploader
            value={singleFormData.layoutPhotos}
            onChange={(next) =>
              setSingleFormData((p) => ({ ...p, layoutPhotos: next }))
            }
          />

          {/* ✅ 原本房源照片上传（只保留这一套，不会重复） */}
          <ImageUpload
            value={singleFormData}
            onChange={setSingleFormData}
            fixedLabels={["房源外观/环境"]}
          />
        </>
      )}

      <div className="space-y-2">
        <label className="font-semibold">房源描述</label>
        <textarea
          className="border p-3 rounded-lg w-full min-h-[120px]"
          placeholder="请输入房源描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
