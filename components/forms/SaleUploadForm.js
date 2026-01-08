// components/forms/SaleUploadForm.js
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

// ✅ 这里导入的 convertToSqft 现在在 psfUtils.js 里有导出了
import { convertToSqft } from "@/utils/psfUtils";

// ✅ 复用 UnitLayoutForm 同款的「点击上传 Layout 图纸」区块（不改你设计）
function BlueprintUploadSection({ fileInputRef, onUpload }) {
  return (
    <div className="mb-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={onUpload}
        className="hidden"
      />

      <div
        className="w-full border rounded-lg p-3 bg-gray-50 cursor-pointer text-center"
        onClick={() => fileInputRef.current?.click()}
      >
        点击上传 Layout 图纸
      </div>
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
}) {
  const fileInputRef = useRef(null);

  // ✅ 单一表单也支持上传 Layout 图纸（跟 UnitLayoutForm 一样：把 File 存进 state）
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSingleFormData((p) => {
      const current = Array.isArray(p.layoutPhotos) ? p.layoutPhotos : [];
      return { ...p, layoutPhotos: [...current, ...files] };
    });
  };

  return (
    <div className="space-y-4">
      {/* ✅ Subsale / Auction / Rent-to-Own 也有同款「点击上传 Layout 图纸」 */}
      <BlueprintUploadSection fileInputRef={fileInputRef} onUpload={handleLayoutUpload} />

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

      {/* BuildYear 保留你原本的条件 */}
      {saleType === "Sale" && computedStatus === "New Project / Under Construction" && (
        <BuildYearSelector
          value={singleFormData.buildYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, buildYear: val }))}
          quarter={singleFormData.quarter}
          onQuarterChange={(val) => setSingleFormData((p) => ({ ...p, quarter: val }))}
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
            onChange={(val) => setSingleFormData((p) => ({ ...p, buildYear: val }))}
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
        setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
      />
    </div>
  );
}
