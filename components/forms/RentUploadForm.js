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

  // room rental
  isRoomRental,
  roomRentalMode,

  // single rent form
  singleFormData,
  setSingleFormData,
  areaData,
  setAreaData,
  description,
  setDescription,

  // batch rent
  rentBatchMode = "no",
  layoutCount = 2,
  unitLayouts = [],
  setUnitLayouts,
}) {
  const isBatch = rentBatchMode === "yes";

  const updateBatchLayout = (idx, patch) => {
    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr[idx] = { ...(arr[idx] || {}), ...(patch || {}) };
      return arr;
    });
  };

  /* =========================================================
     ✅ 批量模式（你原本的，完全没动）
     ========================================================= */
  if (isBatch) {
    const n = Math.max(2, Math.min(20, Number(layoutCount) || 2));
    const rows = Array.from({ length: n }).map((_, i) => unitLayouts[i] || {});

    return (
      <div className="space-y-6">
        {rows.map((data, idx) => {
          const title = `第 ${idx + 1} 个屋型`;

          const localArea = data.areaData || {
            types: ["buildUp", "land"],
            units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
            values: { buildUp: "", land: "" },
          };

          return (
            <div key={idx} className="border rounded-lg p-4 space-y-4 bg-white">
              <div className="text-lg font-semibold">{title}</div>

              <AreaSelector
                value={localArea}
                onChange={(val) => updateBatchLayout(idx, { areaData: val })}
              />

              <PriceInput
                value={data}
                onChange={(next) => updateBatchLayout(idx, next)}
              />

              <div className="space-y-3">
                <RoomCountSelector
                  value={data.rooms}
                  onChange={(val) => updateBatchLayout(idx, { rooms: val })}
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
              </div>

              <div className="space-y-3">
                <ExtraSpacesSelector
                  value={data.extraSpaces}
                  onChange={(val) =>
                    updateBatchLayout(idx, { extraSpaces: val })
                  }
                />
                <FurnitureSelector
                  value={data.furniture}
                  onChange={(val) =>
                    updateBatchLayout(idx, { furniture: val })
                  }
                />
                <FacilitiesSelector
                  value={data.facilities}
                  onChange={(val) =>
                    updateBatchLayout(idx, { facilities: val })
                  }
                />
                <TransitSelector
                  value={data.transit}
                  onChange={(val) =>
                    updateBatchLayout(idx, { transit: val })
                  }
                />
              </div>

              <ImageUpload
                config={data.imageConfig}
                images={data.images}
                setImages={(val) =>
                  updateBatchLayout(idx, { images: val })
                }
              />
            </div>
          );
        })}
      </div>
    );
  }

  /* =========================================================
     ✅ 非批量模式
     ========================================================= */
  const n = Math.max(1, Math.min(20, Number(layoutCount) || 1));

  return (
    <div className="space-y-6">
      {isRoomRental ? (
        /* ✅ 出租房间 + 多房间：生成 房间1 / 房间2 / ... */
        Array.from({ length: n }).map((_, idx) => {
          const roomData = unitLayouts[idx] || {};
          return (
            <div key={idx} className="border rounded-lg p-4 bg-white space-y-4">
              <div className="font-bold">房间 {idx + 1}</div>

              <RoomRentalForm
                value={roomData}
                onChange={(next) =>
                  updateBatchLayout(idx, next)
                }
              />
            </div>
          );
        })
      ) : (
        /* ✅ 整租：你原本的逻辑，完全不动 */
        <>
          <AreaSelector value={areaData} onChange={setAreaData} />

          <PriceInput
            value={singleFormData}
            onChange={(next) =>
              setSingleFormData((p) => ({ ...p, ...next }))
            }
            extraSection={
              <div className="space-y-3">
                <ExtraSpacesSelector
                  value={singleFormData.extraSpaces}
                  onChange={(val) =>
                    setSingleFormData((p) => ({
                      ...p,
                      extraSpaces: val,
                    }))
                  }
                />
                <FurnitureSelector
                  value={singleFormData.furniture}
                  onChange={(val) =>
                    setSingleFormData((p) => ({
                      ...p,
                      furniture: val,
                    }))
                  }
                />
                <FacilitiesSelector
                  value={singleFormData.facilities}
                  onChange={(val) =>
                    setSingleFormData((p) => ({
                      ...p,
                      facilities: val,
                    }))
                  }
                />
                <TransitSelector
                  value={singleFormData.transit}
                  onChange={(val) =>
                    setSingleFormData((p) => ({
                      ...p,
                      transit: val,
                    }))
                  }
                />
              </div>
            }
          />

          <RoomCountSelector
            value={singleFormData.rooms}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, rooms: val }))
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
              setSingleFormData((p) => ({
                ...p,
                carparkLevel: val,
              }))
            }
          />
          <FacingSelector
            value={singleFormData.facing}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, facing: val }))
            }
          />

          <ImageUpload
            config={singleFormData.imageConfig}
            images={singleFormData.images}
            setImages={(val) =>
              setSingleFormData((p) => ({ ...p, images: val }))
            }
          />

          <div className="space-y-2">
            <label className="block font-medium">房源描述</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入房源描述"
            />
          </div>
        </>
      )}
    </div>
  );
}
