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

/* ================= Layout 图纸上传（仅新增，不影响其它逻辑） ================= */
function LayoutBlueprintUpload({ value = [], onChange }) {
  const inputRef = useRef(null);
  const files = Array.isArray(value) ? value : [];

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    onChange?.([...(files || []), ...picked]);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Layout 图纸上传</div>
          <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
        </div>

        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
        >
          上传 Layout 图纸
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={addFiles}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div className="text-sm text-gray-800 break-all">
                {f?.name || `文件 ${idx + 1}`}
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => removeAt(idx)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
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

              {/* ✅ 原本就有：Layout 图纸上传（批量每个房型都有） */}
              <LayoutBlueprintUpload
                value={data.layoutPhotos}
                onChange={(val) =>
                  updateBatchLayout(idx, { layoutPhotos: val })
                }
              />

              {/* ✅ 整间出租（批量）固定加一格：房源外观/环境 */}
              <ImageUpload
                value={data}
                onChange={(next) => updateBatchLayout(idx, next)}
                fixedLabels={["房源外观/环境"]}
              />

              {/* ✅✅✅ 只新增：Layout 图纸上传（像 New Project / Completed Unit 那种用 ImageUpload） */}
              <div className="mt-4 border rounded-lg p-4 bg-white">
                <div className="font-medium">Layout 图纸上传</div>
                <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
                <div className="mt-3">
                  <ImageUpload
                    config={{ id: `rent_layout_floorplans_batch_${idx + 1}`, multiple: true }}
                    images={data.layoutFloorPlans || {}}
                    setImages={(updated) =>
                      updateBatchLayout(idx, { layoutFloorPlans: updated })
                    }
                  />
                </div>
              </div>
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

  return (
    <div className="space-y-4">
      {isRoomRental ? (
        Number(layoutCount) > 1 ? (
          <div className="space-y-4">
            {Array.from({ length: Number(layoutCount) || 0 }).map((_, idx) => {
              const roomValue = unitLayouts?.[idx] || {};

              return (
                <div
                  key={idx}
                  className="border rounded-lg p-4 space-y-4 bg-white"
                >
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

                  {/* ✅ 原本就有：Layout 图纸上传（多房间每间都有） */}
                  <LayoutBlueprintUpload
                    value={roomValue.layoutPhotos}
                    onChange={(val) => {
                      if (!setUnitLayouts) return;
                      setUnitLayouts((prev) => {
                        const arr = Array.isArray(prev) ? [...prev] : [];
                        arr[idx] = { ...(arr[idx] || {}), layoutPhotos: val };
                        return arr;
                      });
                    }}
                  />

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

                  {/* ✅✅✅ 只新增：Layout 图纸上传（像 New Project / Completed Unit 那种用 ImageUpload） */}
                  <div className="mt-4 border rounded-lg p-4 bg-white">
                    <div className="font-medium">Layout 图纸上传</div>
                    <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
                    <div className="mt-3">
                      <ImageUpload
                        config={{ id: `rent_layout_floorplans_room_${idx + 1}`, multiple: true }}
                        images={roomValue.layoutFloorPlans || {}}
                        setImages={(updated) => {
                          if (!setUnitLayouts) return;
                          setUnitLayouts((prev) => {
                            const arr = Array.isArray(prev) ? [...prev] : [];
                            arr[idx] = { ...(arr[idx] || {}), layoutFloorPlans: updated };
                            return arr;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <RoomRentalForm value={singleFormData} onChange={setSingleFormData} />

            {/* ✅ 原本就有：Layout 图纸上传（单房间） */}
            <LayoutBlueprintUpload
              value={singleFormData.layoutPhotos}
              onChange={(val) =>
                setSingleFormData((p) => ({ ...p, layoutPhotos: val }))
              }
            />

            <ImageUpload
              value={singleFormData}
              onChange={setSingleFormData}
              labelsOverride={["房源照片上传"]}
            />

            {/* ✅✅✅ 只新增：Layout 图纸上传（像 New Project / Completed Unit 那种用 ImageUpload） */}
            <div className="mt-4 border rounded-lg p-4 bg-white">
              <div className="font-medium">Layout 图纸上传</div>
              <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
              <div className="mt-3">
                <ImageUpload
                  config={{ id: "rent_layout_floorplans_room_single", multiple: true }}
                  images={singleFormData.layoutFloorPlans || {}}
                  setImages={(updated) =>
                    setSingleFormData((p) => ({ ...p, layoutFloorPlans: updated }))
                  }
                />
              </div>
            </div>
          </>
        )
      ) : (
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

          {/* ✅ 原本就有：Layout 图纸上传（整间单个） */}
          <LayoutBlueprintUpload
            value={singleFormData.layoutPhotos}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, layoutPhotos: val }))
            }
          />

          {/* ✅ 整间出租（单个）固定加一格：房源外观/环境 */}
          <ImageUpload
            value={singleFormData}
            onChange={setSingleFormData}
            fixedLabels={["房源外观/环境"]}
          />

          {/* ✅✅✅ 只新增：Layout 图纸上传（像 New Project / Completed Unit 那种用 ImageUpload） */}
          <div className="mt-4 border rounded-lg p-4 bg-white">
            <div className="font-medium">Layout 图纸上传</div>
            <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
            <div className="mt-3">
              <ImageUpload
                config={{ id: "rent_layout_floorplans_single", multiple: true }}
                images={singleFormData.layoutFloorPlans || {}}
                setImages={(updated) =>
                  setSingleFormData((p) => ({ ...p, layoutFloorPlans: updated }))
                }
              />
            </div>
          </div>
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
