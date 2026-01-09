// components/forms/SaleUploadForm.js
"use client";

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

// ✅ 你现有的工具函数（保持不动）
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

  // ✅【只加这一个】给 AreaSelector 做 Land 自动切换
  propertyCategory = "",
}) {
  // ✅ 你原本逻辑（保持）
  const priceNum = toNumber(singleFormData?.price);

  const buildUpSqft = convertToSqft(areaData?.values?.buildUp, areaData?.units?.buildUp);
  const landSqft = convertToSqft(areaData?.values?.land, areaData?.units?.land);

  return (
    <div className="space-y-4">
      <AreaSelector
        initialValue={areaData}
        onChange={(val) => setAreaData(val)}
        propertyCategory={propertyCategory}
      />

      <PriceInput
        value={singleFormData?.price || ""}
        onChange={(val) => setSingleFormData((p) => ({ ...p, price: val }))}
        listingMode={saleType}
        area={{
          buildUp: buildUpSqft,
          land: landSqft,
        }}
      />

      <RoomCountSelector
        value={{
          bedrooms: photoConfig?.bedrooms,
          bathrooms: photoConfig?.bathrooms,
          kitchens: photoConfig?.kitchens,
          livingRooms: photoConfig?.livingRooms,
        }}
        onChange={(patch) => setSingleFormData((p) => ({ ...p, ...patch }))}
      />

      <CarparkCountSelector
        value={singleFormData?.carparks}
        onChange={(val) => setSingleFormData((p) => ({ ...p, carparks: val }))}
      />

      <CarparkLevelSelector
        value={singleFormData?.carparkLevel}
        onChange={(val) => setSingleFormData((p) => ({ ...p, carparkLevel: val }))}
      />

      <FacingSelector
        value={singleFormData?.facing}
        onChange={(val) => setSingleFormData((p) => ({ ...p, facing: val }))}
      />

      <ExtraSpacesSelector
        value={singleFormData?.extraSpaces}
        onChange={(val) => setSingleFormData((p) => ({ ...p, extraSpaces: val }))}
      />

      <FurnitureSelector
        value={singleFormData?.furniture}
        onChange={(val) => setSingleFormData((p) => ({ ...p, furniture: val }))}
      />

      <FacilitiesSelector
        value={singleFormData?.facilities}
        onChange={(val) => setSingleFormData((p) => ({ ...p, facilities: val }))}
      />

      <TransitSelector
        value={singleFormData?.transit}
        onChange={(val) => setSingleFormData((p) => ({ ...p, transit: val }))}
      />

      {/* ✅ 你原本：New Project 有预计完成年份 + 季度 */}
      {saleType === "Sale" && computedStatus === "New Project / Under Construction" && (
        <BuildYearSelector
          value={singleFormData?.estimatedYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, estimatedYear: val }))}
          quarter={singleFormData?.quarter}
          onQuarterChange={(val) => setSingleFormData((p) => ({ ...p, quarter: val }))}
          showQuarter
          label="预计交付时间"
        />
      )}

      {/* ✅ 你原本：Completed / Subsale / Auction / RTO 有完成年份 */}
      {saleType === "Sale" &&
        [
          "Completed Unit / Developer Unit",
          "Subsale / Secondary Market",
          "Auction Property",
          "Rent-to-Own Scheme",
        ].includes(computedStatus) && (
          <BuildYearSelector
            value={singleFormData?.completedYear}
            onChange={(val) => setSingleFormData((p) => ({ ...p, completedYear: val }))}
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

      <ImageUpload
        config={photoConfig}
        images={singleFormData?.photos}
        setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
      />
    </div>
  );
}
