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

// ✅ 更强的“只有一个房间”识别（TypeSelector 很可能不会清空 roomCount）
function isTruthyFlag(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return v === true || s === "true" || s === "yes" || s === "y" || s === "1";
}
function isFalsyFlag(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return v === false || s === "false" || s === "no" || s === "n" || s === "0";
}

// ✅ 从 typeForm 里读“是否只有一个房间”
function getOnlyOneFromTypeForm(typeForm) {
  if (!typeForm) return null;

  // 常见字段名（多加几个，避免你那边命名不同）
  const candidates = [
    typeForm.onlyOneRoom,
    typeForm.isOnlyOneRoom,
    typeForm.singleRoom,
    typeForm.isSingleRoom,
    typeForm.oneRoomOnly,
    typeForm.isOneRoomOnly,
    typeForm.onlyOne,
  ];

  for (const c of candidates) {
    if (isTruthyFlag(c)) return true;
    if (isFalsyFlag(c)) return false;
  }

  // 有些 UI 会存成中文/句子
  const txt =
    String(typeForm.onlyOneRoomText || typeForm.roomOnlyText || typeForm.roomModeText || "")
      .trim()
      .toLowerCase();

  if (txt.includes("只有一个") || txt.includes("only one") || txt.includes("single")) return true;
  if (txt.includes("多个") || txt.includes("many") || txt.includes("multiple")) return false;

  return null;
}

// ✅ 从 typeForm 里读“房间数量”
function getRoomCountFromTypeForm(typeForm) {
  if (!typeForm) return 0;

  const candidates = [
    typeForm.roomCount,
    typeForm.roomsCount,
    typeForm.roomQuantity,
    typeForm.roomsQuantity,
    typeForm.numberOfRooms,
    typeForm.roomNumber,
    typeForm.selectedRoomCount,
    typeForm.totalRooms,
    typeForm.rooms,
  ];

  for (const c of candidates) {
    const n = toPositiveInt(c);
    if (n > 0) return n;
  }

  return 0;
}

function makeDefaultAreaData() {
  return {
    types: ["buildUp", "land"],
    values: { buildUp: "", land: "" },
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
  };
}

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
function roomTitle(i) {
  if (i < 10) return `第${CN_NUM[i]}间房`;
  return `第${i + 1}间房`;
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

  // ✅ 从 upload-property.js 传进来（TypeSelector 的 form）
  typeForm,
}) {
  // ✅ 关键：只要侦测到“只有一个房间”，就强制 count=1
  const onlyOne = useMemo(() => getOnlyOneFromTypeForm(typeForm), [typeForm]);
  const rawCount = useMemo(() => getRoomCountFromTypeForm(typeForm), [typeForm]);

  const targetRoomCount = useMemo(() => {
    if (onlyOne === true) return 1;
    return rawCount; // onlyOne === false 或 null 时，才用数量
  }, [onlyOne, rawCount]);

  const [roomForms, setRoomForms] = useState([]);

  useEffect(() => {
    if (!isRoomRental) {
      setRoomForms([]);
      return;
    }

    const n = toPositiveInt(targetRoomCount);
    if (n <= 0) {
      setRoomForms([]);
      return;
    }

    setRoomForms((prev) => {
      // ✅ 切换到“只有一个房间”时：保留第一间，丢掉其它
      if (n === 1) {
        const first = prev?.[0];
        return [
          first || {
            areaData: makeDefaultAreaData(),
            form: {
              price: "",
              extraSpaces: [],
              furniture: [],
              facilities: [],
              transit: null,
            },
          },
        ];
      }

      // 多房：保留已有，缺的补空
      const next = Array.from({ length: n }).map((_, idx) => {
        return (
          prev[idx] || {
            areaData: makeDefaultAreaData(),
            form: {
              price: "",
              extraSpaces: [],
              furniture: [],
              facilities: [],
              transit: null,
            },
          }
        );
      });

      // 保险：旧数据结构不完整时补齐
      return next.map((x) => ({
        areaData: x?.areaData || makeDefaultAreaData(),
        form: x?.form || {},
      }));
    });
  }, [isRoomRental, targetRoomCount]);

  const patchRoom = (index, patch) => {
    setRoomForms((prev) => {
      const next = [...prev];
      const cur = next[index] || { areaData: makeDefaultAreaData(), form: {} };
      next[index] = { ...cur, ...patch };
      return next;
    });
  };

  const patchRoomForm = (index, patch) => {
    setRoomForms((prev) => {
      const next = [...prev];
      const cur = next[index] || { areaData: makeDefaultAreaData(), form: {} };
      next[index] = { ...cur, form: { ...(cur.form || {}), ...(patch || {}) } };
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ✅ 房间出租：每间房都有自己的 Area + Price + RoomRentalForm */}
      {isRoomRental ? (
        <>
          {roomForms.map((room, index) => {
            const localArea = room.areaData || makeDefaultAreaData();
            const localForm = room.form || {};

            return (
              <div key={index} className="space-y-4 border rounded-lg p-4 bg-white">
                <div className="text-lg font-semibold">{roomTitle(index)}</div>

                <AreaSelector
                  initialValue={localArea}
                  onChange={(val) => patchRoom(index, { areaData: val })}
                />

                <PriceInput
                  value={localForm.price || ""}
                  onChange={(val) => patchRoomForm(index, { price: val })}
                  listingMode={saleType}
                  area={{
                    buildUp: convertToSqft(localArea.values?.buildUp, localArea.units?.buildUp),
                    land: convertToSqft(localArea.values?.land, localArea.units?.land),
                  }}
                />

                <RoomRentalForm
                  value={localForm}
                  onChange={(nextForm) => patchRoomForm(index, nextForm)}
                  extraSection={
                    <div className="space-y-3">
                      <ExtraSpacesSelector
                        value={localForm.extraSpaces || []}
                        onChange={(val) => patchRoomForm(index, { extraSpaces: val })}
                      />
                      <FurnitureSelector
                        value={localForm.furniture || []}
                        onChange={(val) => patchRoomForm(index, { furniture: val })}
                      />
                      <FacilitiesSelector
                        value={localForm.facilities || []}
                        onChange={(val) => patchRoomForm(index, { facilities: val })}
                      />
                      <TransitSelector
                        value={localForm.transit || null}
                        onChange={(info) => patchRoomForm(index, { transit: info })}
                      />
                    </div>
                  }
                />
              </div>
            );
          })}
        </>
      ) : (
        <>
          {/* ✅ 整间出租：保持你原本的完全不动 */}
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
