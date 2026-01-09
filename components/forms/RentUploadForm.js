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

import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacingSelector from "@/components/FacingSelector";
import ImageUpload from "@/components/ImageUpload";

export default function RentUploadForm({
  saleType,
  computedStatus,

  singleFormData,
  setSingleFormData,

  isRoomRental,
  setIsRoomRental,

  hasMultipleRooms,
  setHasMultipleRooms,

  batchMode,
  setBatchMode,

  batchLayouts,
  setBatchLayouts,

  areaData,
  setAreaData,

  description,
  setDescription,

  photoConfig,

  updateBatchLayout,
}) {
  useEffect(() => {
    // 防止切换成房间出租时还保留 batch
    if (isRoomRental) {
      setBatchMode("No");
    }
  }, [isRoomRental, setBatchMode]);

  const isBatch = String(batchMode || "").toLowerCase() === "yes";

  const renderBatchLayouts = () => {
    return (
      <div className="space-y-4">
        {batchLayouts.map((data, idx) => {
          const title = `屋型 ${idx + 1}`;
          const localArea = data?.areaData || { types: ["buildUp"], units: {}, values: {} };

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">{title}</div>

              <AreaSelector
                propertyCategory={data?.propertyCategory}
                initialValue={localArea}
                onChange={(val) => updateBatchLayout(idx, { areaData: val })}
              />

              <PriceInput value={data} onChange={(next) => updateBatchLayout(idx, next)} />

              <div className="space-y-3">
                <RoomCountSelector
                  value={data.rooms}
                  onChange={(val) => updateBatchLayout(idx, { rooms: val })}
                />

                <CarparkCountSelector
                  value={data.carpark}
                  onChange={(val) => updateBatchLayout(idx, { carpark: val })}
                  mode="single"
                />

                <CarparkLevelSelector
                  value={data.carparkPosition}
                  onChange={(val) => updateBatchLayout(idx, { carparkPosition: val })}
                  mode="range"
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
                  value={data.transit || null}
                  onChange={(info) => updateBatchLayout(idx, { transit: info })}
                />
              </div>

              <ImageUpload
                config={photoConfig}
                images={data.photos}
                setImages={(updated) => updateBatchLayout(idx, { photos: updated })}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 你的房间出租 / 多房间 / 批量操作选择区（保持原样） */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="font-medium">是否只是出租房间？</div>
          <select
            className="w-full border rounded-lg p-2 bg-white"
            value={isRoomRental ? "Yes" : "No"}
            onChange={(e) => setIsRoomRental(e.target.value === "Yes")}
          >
            <option value="No">否</option>
            <option value="Yes">是</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="font-medium">是否只有一个房间？</div>
          <select
            className="w-full border rounded-lg p-2 bg-white"
            value={hasMultipleRooms ? "No" : "Yes"}
            onChange={(e) => setHasMultipleRooms(e.target.value === "No")}
            disabled={!isRoomRental}
          >
            <option value="Yes">是</option>
            <option value="No">否</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="font-medium">需要批量操作吗？</div>
          <select
            className="w-full border rounded-lg p-2 bg-white"
            value={batchMode || "No"}
            onChange={(e) => setBatchMode(e.target.value)}
            disabled={isRoomRental}
          >
            <option value="No">否</option>
            <option value="Yes">是</option>
          </select>
        </div>
      </div>

      {/* 批量操作 */}
      {isBatch ? (
        renderBatchLayouts()
      ) : (
        <>
          {/* 房间出租表单 */}
          {isRoomRental ? (
            <RoomRentalForm
              value={singleFormData}
              onChange={(next) => setSingleFormData((p) => ({ ...p, ...next }))}
            />
          ) : (
            <>
              {/* ✅ 关键：普通 rent 的 AreaSelector 传 propertyCategory + initialValue */}
              <AreaSelector
                propertyCategory={singleFormData?.propertyCategory}
                initialValue={areaData}
                onChange={setAreaData}
              />

              <PriceInput
                value={singleFormData}
                onChange={(next) => setSingleFormData((p) => ({ ...p, ...next }))}
                extraSection={
                  <div className="space-y-3">
                    <RoomCountSelector
                      value={singleFormData.rooms}
                      onChange={(val) => setSingleFormData((p) => ({ ...p, rooms: val }))}
                    />

                    <CarparkCountSelector
                      value={singleFormData.carpark}
                      onChange={(val) => setSingleFormData((p) => ({ ...p, carpark: val }))}
                      mode="single"
                    />

                    <CarparkLevelSelector
                      value={singleFormData.carparkPosition}
                      onChange={(val) =>
                        setSingleFormData((p) => ({ ...p, carparkPosition: val }))
                      }
                      mode="range"
                    />

                    <FacingSelector
                      value={singleFormData.facing}
                      onChange={(val) => setSingleFormData((p) => ({ ...p, facing: val }))}
                    />

                    <ExtraSpacesSelector
                      value={singleFormData.extraSpaces}
                      onChange={(val) =>
                        setSingleFormData((p) => ({ ...p, extraSpaces: val }))
                      }
                    />

                    <FurnitureSelector
                      value={singleFormData.furniture}
                      onChange={(val) => setSingleFormData((p) => ({ ...p, furniture: val }))}
                    />

                    <FacilitiesSelector
                      value={singleFormData.facilities}
                      onChange={(val) =>
                        setSingleFormData((p) => ({ ...p, facilities: val }))
                      }
                    />

                    <TransitSelector
                      value={singleFormData.transit || null}
                      onChange={(info) => setSingleFormData((p) => ({ ...p, transit: info }))}
                    />
                  </div>
                }
              />

              <div>
                <label className="block font-medium mb-1">房源描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入房源详细描述..."
                  rows={4}
                  className="w-full border rounded-lg p-2 resize-y"
                />
              </div>

              <ImageUpload
                config={photoConfig}
                images={singleFormData.photos}
                setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
