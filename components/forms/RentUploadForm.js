// components/forms/RentUploadForm.js
"use client";

import { useEffect, useState } from "react";

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
}) {
  // ✅ 新增（只为 Room Rental 多房）
  const [roomCount, setRoomCount] = useState(0);
  const [roomForms, setRoomForms] = useState([]);

  // ✅ 当选择房间数量后，生成对应数量的 RoomRentalForm
  useEffect(() => {
    if (!isRoomRental) {
      setRoomForms([]);
      setRoomCount(0);
      return;
    }

    const n = Number(roomCount || 0);
    if (!Number.isFinite(n) || n <= 0) {
      setRoomForms([]);
      return;
    }

    // 保留已填写的数据
    setRoomForms((prev) => {
      const next = Array.from({ length: n }).map((_, idx) => {
        return prev[idx] ? prev[idx] : {};
      });
      return next;
    });
  }, [isRoomRental, roomCount]);

  return (
    <div className="space-y-4">
      {/* ===== 原本的 Area / Price（不动） ===== */}
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

      {/* ===== 房间出租 ===== */}
      {isRoomRental ? (
        <>
          {/* ✅ 你原本就有的「选择房间数量」 */}
          <RoomCountSelector
            label="选择房间数量"
            value={roomCount}
            onChange={setRoomCount}
          />

          {/* ✅ 核心修复：根据数量 render 多个 RoomRentalForm */}
          {roomForms.map((roomValue, index) => (
            <div key={index} className="space-y-2">
              <div className="font-semibold">房间 {index + 1}</div>

              <RoomRentalForm
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
            </div>
          ))}
        </>
      ) : (
        /* ===== 原本的整间出租（完全不动） ===== */
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
            value={singleFormData.transit || null}
            onChange={(info) =>
              setSingleFormData((p) => ({ ...p, transit: info }))
            }
          />
        </>
      )}

      {/* ===== 描述 / 图片（不动） ===== */}
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
        setImages={(updated) =>
          setSingleFormData((p) => ({ ...p, photos: updated }))
        }
      />
    </div>
  );
}
