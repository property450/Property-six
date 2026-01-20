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
import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";
import ListingTrustSection from "@/components/trust/ListingTrustSection";

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

      {/* ✅✅ 只新增这一块：New Project 同款「点击上传 Layout 图纸」 */}
      <LayoutBlueprintUploader
        value={singleFormData.layoutPhotos}
        onChange={(next) =>
          setSingleFormData((p) => ({ ...p, layoutPhotos: next }))
        }
      />

      {/* ✅ 原本房源照片上传（只保留这一套，不会重复） */}
      <ImageUpload
        config={photoConfigComputed}
        images={singleFormData.photos}
        setImages={(updated) =>
          setSingleFormData((p) => ({ ...p, photos: updated }))
        }
      />

          <ListingTrustSection
  mode={
    computedStatus === "New Project / Under Construction"
      ? "new_project"
      : computedStatus === "Completed Unit / Developer Unit"
      ? "completed_unit"
      : "sale"
  }
  value={formData?.trustSection || {}}
  onChange={(next) =>
    setFormData((prev) => ({ ...(prev || {}), trustSection: next }))
  }
/>
    </div>
  );
}
