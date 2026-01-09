// components/forms/SaleUploadForm.js
"use client";

import { useRef } from "react"; // 🔧 NEW

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

// ✅ 你现有的工具函数（完全不动）
import { convertToSqft } from "@/utils/psfUtils";

/* ================= 工具函数（不改你原设计） ================= */
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
}) {
  /* ================= PSF 计算（完全保留） ================= */

  const buildUpSqft = convertToSqft(
    areaData?.values?.buildUp,
    areaData?.units?.buildUp
  );

  const landSqft = convertToSqft(
    areaData?.values?.land,
    areaData?.units?.land
  );

  const areaSqft =
    (buildUpSqft > 0 ? buildUpSqft : 0) +
    (landSqft > 0 ? landSqft : 0);

  const priceSingle = toNumber(singleFormData?.price);
  const priceMin = toNumber(singleFormData?.priceMin);
  const priceMax = toNumber(singleFormData?.priceMax);

  const psfSingle =
    areaSqft > 0 && priceSingle > 0 ? priceSingle / areaSqft : 0;

  const psfMin =
    areaSqft > 0 && priceMin > 0 ? priceMin / areaSqft : 0;

  const psfMax =
    areaSqft > 0 && priceMax > 0 ? priceMax / areaSqft : 0;

  const showPsfRange = psfMin > 0 && psfMax > 0;
  const showPsfSingle = !showPsfRange && psfSingle > 0;

  /* ================= 🔧 NEW：Layout 图纸上传（只加，不影响 PSF） ================= */
  const layoutBlueprintInputRef = useRef(null);

  const handleLayoutBlueprintUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSingleFormData((prev) => {
      const cur = Array.isArray(prev.layoutBlueprintFiles)
        ? prev.layoutBlueprintFiles
        : [];
      return { ...prev, layoutBlueprintFiles: [...cur, ...files] };
    });

    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* 🔧 NEW：点击上传 Layout 图纸（Subsale / Auction / RTO 也有） */}
      <input
        ref={layoutBlueprintInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleLayoutBlueprintUpload}
        className="hidden"
      />

      <div
        className="w-full border rounded-lg p-3 bg-gray-50 cursor-pointer text-center"
        onClick={() => layoutBlueprintInputRef.current?.click()}
      >
        点击上传 Layout 图纸
      </div>

      <AreaSelector
  propertyCategory={singleFormData?.propertyCategory} // ✅ 关键
  initialValue={areaData}
  onChange={(val) => setAreaData(val)}
/>

      <PriceInput
        value={singleFormData.price}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, price: val }))
        }
        listingMode={saleType}
        area={{
          buildUp: buildUpSqft,
          land: landSqft,
        }}
      />

      {/* ✅ PSF 显示（完全不动） */}
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
        onChange={(patch) =>
          setSingleFormData((p) => ({ ...p, ...patch }))
        }
      />

      <CarparkCountSelector
        value={singleFormData.carpark}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, carpark: val }))
        }
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
        value={singleFormData.transit || null}
        onChange={(info) =>
          setSingleFormData((p) => ({ ...p, transit: info }))
        }
      />

      {/* Build Year（完全照你原逻辑） */}
      {saleType === "Sale" &&
        computedStatus === "New Project / Under Construction" && (
          <BuildYearSelector
            value={singleFormData.buildYear}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, buildYear: val }))
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
            value={singleFormData.buildYear}
            onChange={(val) =>
              setSingleFormData((p) => ({ ...p, buildYear: val }))
            }
            showQuarter={false}
            label="完成年份"
          />
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
        setImages={(updated) =>
          setSingleFormData((p) => ({ ...p, photos: updated }))
        }
      />
    </div>
  );
}
