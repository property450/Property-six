"use client";

import { useRef } from "react";

import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacingSelector from "@/components/FacingSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import TransitSelector from "@/components/TransitSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";

import { convertToSqft } from "@/utils/psfUtils";

/* ================= 工具函数（保持你原设计） ================= */
function toNumber(v) {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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
            <div
              key={idx}
              className="flex items-center justify-between border rounded-lg px-3 py-2"
            >
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

export default function SaleUploadForm({
  saleType,
  computedStatus,

  singleFormData,
  setSingleFormData,

  areaData,
  setAreaData,

  description,
  setDescription,

  photoConfig,

  propertyCategory = "",
}) {
  const buildUpSqft = convertToSqft(
    areaData?.values?.buildUp,
    areaData?.units?.buildUp
  );

  const landSqft = convertToSqft(areaData?.values?.land, areaData?.units?.land);

  const areaSqft =
    (buildUpSqft > 0 ? buildUpSqft : 0) + (landSqft > 0 ? landSqft : 0);

  const priceSingle = toNumber(singleFormData?.price);
  const priceMin = toNumber(singleFormData?.priceMin);
  const priceMax = toNumber(singleFormData?.priceMax);

  const psfSingle =
    areaSqft > 0 && priceSingle > 0 ? priceSingle / areaSqft : 0;
  const psfMin = areaSqft > 0 && priceMin > 0 ? priceMin / areaSqft : 0;
  const psfMax = areaSqft > 0 && priceMax > 0 ? priceMax / areaSqft : 0;

  const showPsfRange = psfMin > 0 && psfMax > 0;
  const showPsfSingle = !showPsfRange && psfSingle > 0;

  const photoConfigComputed = {
    bedrooms: singleFormData?.bedrooms ?? "",
    bathrooms: singleFormData?.bathrooms ?? "",
    kitchens: singleFormData?.kitchens ?? "",
    livingRooms: singleFormData?.livingRooms ?? "",
    carpark: singleFormData?.carparks ?? singleFormData?.carpark ?? "",
    store: singleFormData?.store ?? "",
    extraSpaces: Array.isArray(singleFormData?.extraSpaces)
      ? singleFormData.extraSpaces
      : [],
    furniture: Array.isArray(singleFormData?.furniture)
      ? singleFormData.furniture
      : [],
    facilities: Array.isArray(singleFormData?.facilities)
      ? singleFormData.facilities
      : [],
    orientation: singleFormData?.facing ?? singleFormData?.orientation ?? [],
    fixedLabels: ["房源外观/环境"],
  };

  return (
    <div className="space-y-4">
      <AreaSelector
        initialValue={areaData}
        onChange={(val) => setAreaData(val)}
        propertyCategory={propertyCategory}
      />

      <PriceInput
        value={singleFormData.price}
        onChange={(val) => setSingleFormData((p) => ({ ...p, price: val }))}
        listingMode={saleType}
        area={{
          buildUp: buildUpSqft,
          land: landSqft,
        }}
      />

      {showPsfRange && (
        <div className="text-sm text-gray-600 mt-1">
          每平方英尺: RM {formatMoney(psfMin)} ~ RM {formatMoney(psfMax)}
        </div>
      )}

      {showPsfSingle && (
        <div className="text-sm text-gray-600 mt-1">
          每平方英尺: RM {formatMoney(psfSingle)}
        </div>
      )}

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
        value={singleFormData.carparks}
        onChange={(val) => setSingleFormData((p) => ({ ...p, carparks: val }))}
      />

      <CarparkLevelSelector
        value={singleFormData.carparkLevel}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, carparkLevel: val }))
        }
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
        value={singleFormData.transit}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, transit: val }))
        }
      />

      {saleType === "Sale" &&
        computedStatus === "New Project / Under Construction" && (
          <BuildYearSelector
            value={singleFormData.estimatedYear}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, estimatedYear: val }))
            }
            quarter={singleFormData.quarter}
            onQuarterChange={(val) =>
              setSingleFormData((p) => ({ ...p, quarter: val }))
            }
            showQuarter
            label="预计交付时间"
          />
        )}

      {saleType === "Sale" &&
        [
          "Completed Unit / Developer Unit",
          "Subsale / Secondary Market",
          "Auction Property",
          "Rent-to-Own Scheme",
        ].includes(computedStatus) && (
          <BuildYearSelector
            value={singleFormData.completedYear}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, completedYear: val }))
            }
            label="完成年份"
          />
        )}

      <div className="space-y-2">
        <div className="text-sm font-semibold">房源描述</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请输入房源详细描述..."
          rows={4}
          className="w-full border rounded-lg p-2 resize-y"
        />
      </div>

      {/* ✅ 只新增：Layout 图纸上传 */}
      <LayoutBlueprintUpload
        value={singleFormData.layoutPhotos}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, layoutPhotos: val }))
        }
      />

      <ImageUpload
        config={photoConfigComputed}
        images={singleFormData.photos}
        setImages={(updated) =>
          setSingleFormData((p) => ({ ...p, photos: updated }))
        }
      />
    </div>
  );
          }
