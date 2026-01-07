// components/forms/RentUploadForm.js
"use client";

import { useEffect, useMemo, useState } from "react";

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

import { convertToSqft } from "@/utils/psfUtils";

function toPositiveInt(v) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

// ✅ 从 TypeSelector 回传的 typeForm 里，尽可能“猜中”房间数量字段名
function getRoomCountFromTypeForm(typeForm) {
  if (!typeForm) return 0;

  // 常见字段名（你项目里可能叫其中一个）
  const candidates = [
    typeForm.roomCount,
    typeForm.roomsCount,
    typeForm.roomQuantity,
    typeForm.roomsQuantity,
    typeForm.numberOfRooms,
    typeForm.roomNumber,
    typeForm.selectedRoomCount,
  ];

  for (const c of candidates) {
    const n = toPositiveInt(c);
    if (n > 0) return n;
  }

  // 如果你有 “是否只有一个房间” 这种字段
  // （例如 yes/no 或 true/false），这里也兜底为 1
  const onlyOne =
    typeForm.onlyOneRoom === true ||
    typeForm.onlyOneRoom === "yes" ||
    typeForm.onlyOneRoom === "true" ||
    typeForm.isOnlyOneRoom === true;

  if (onlyOne) return 1;

  return 0;
}

export default function RentUploadForm({
  saleType,
  computedStatus,
  isRoomRental,

  singleFormData,
  setSingleFormData,

  areaData,
  setAreaData,

  description,
  setDescription,

  photoConfig,

  // ✅ 新增：从 upload-property 传进来（不影响你原本 UI）
  typeForm,
}) {
  // ✅ 目标房间数量：来自你在 TypeSelector 里已经选好的那个数
  const targetRoomCount = useMemo(() => getRoomCountFromTypeForm(typeForm), [typeForm]);

  // ✅ 多房表单数据（每个房一份，不互相覆盖）
  const [roomForms, setRoomForms] = useState([]);

  useEffect(() => {
    if (!isRoomRental) {
      setRoomForms([]);
      return;
    }

    const n = toPositiveInt(targetRoomCount);
    if (n <= 0) {
      setRoomForms([]); // 还没选数量就先不显示
      return;
    }

    // 保留已填数据：从 6 改 5，不会丢前 5；从 5 改 6，新的一间是空的
    setRoomForms((prev) => {
      const next = Array.from({ length: n }).map((_, i) => prev[i] || {});
      return next;
    });
  }, [isRoomRental, targetRoomCount]);

  return (
    <div className="space-y-4">
      <AreaSelector initialValue={areaData} onChange={(val) => setAreaData(val)} />

      <PriceInput
        value={singleFormData.price}
        onChange={(val) => setSingleFormData((p) => ({ ...p, price: val }))}
        listingMode={saleType}
        area={{
          buildUp: convertToSqft(areaData.values.buildUp, areaData.units.buildUp),
          land: convertToSqft(areaData.values.land, areaData.units.land),
        }}
      />

      {isRoomRental ? (
        <>
          {/* ✅ 这里完全保留你的设计：只是在“你已经选好数量”后，多渲染 N 个表单 */}
          {roomForms.map((roomValue, index) => (
            <RoomRentalForm
              key={index}
              value={roomValue}
              onChange={(updated) => {
                setRoomForms((prev) => {
                  const next = [...prev];
                  next[index] = updated;
                  return next;
                });
              }}
              extraSection={
                <div className="space-y-3">
                  <ExtraSpacesSelector
                    value={roomValue.extraSpaces || []}
                    onChange={(val) =>
                      setRoomForms((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], extraSpaces: val };
                        return next;
                      })
                    }
                  />
                  <FurnitureSelector
                    value={roomValue.furniture || []}
                    onChange={(val) =>
                      setRoomForms((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], furniture: val };
                        return next;
                      })
                    }
                  />
                  <FacilitiesSelector
                    value={roomValue.facilities || []}
                    onChange={(val) =>
                      setRoomForms((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], facilities: val };
                        return next;
                      })
                    }
                  />
                  <TransitSelector
                    value={roomValue.transit || null}
                    onChange={(info) =>
                      setRoomForms((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], transit: info };
                        return next;
                      })
                    }
                  />
                </div>
              }
            />
          ))}
        </>
      ) : (
        <>
          <RoomCountSelector
            value={{
              bedrooms: singleFormData.bedrooms,
              bathrooms: singleFormData.bathrooms,
              kitchens: singleFormData.kitchens,
              livingRooms: singleFormData.livingRooms,
            }}
            onChange={(patch) => setSingleFormData((p) => ({ ...p, ...patch }))}
          />

          <CarparkCountSelector
            value={singleFormData.carpark}
            onChange={(val) => setSingleFormData((p) => ({ ...p, carpark: val }))}
            mode={
              computedStatus === "New Project / Under Construction" ||
              computedStatus === "Completed Unit / Developer Unit"
                ? "range"
                : "single"
            }
          />

          <CarparkLevelSelector
            value={singleFormData.carparkPosition}
            onChange={(val) => setSingleFormData((p) => ({ ...p, carparkPosition: val }))}
            mode="range"
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
            value={singleFormData.transit || null}
            onChange={(info) => setSingleFormData((p) => ({ ...p, transit: info }))}
          />
        </>
      )}

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
    </div>
  );
}
