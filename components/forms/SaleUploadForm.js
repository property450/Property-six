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

import { convertToSqft } from "@/utils/psfUtils";

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

  // ✅ 新增：不改其它逻辑，只为了 AreaSelector 自动切换
  propertyCategory,
}) {
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
          buildUp: convertToSqft(areaData.values.buildUp, areaData.units.buildUp),
          land: convertToSqft(areaData.values.land, areaData.units.land),
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
        value={singleFormData.carparks}
        onChange={(val) => setSingleFormData((p) => ({ ...p, carparks: val }))}
      />

      <CarparkLevelSelector
        value={singleFormData.carparkLevel}
        onChange={(val) => setSingleFormData((p) => ({ ...p, carparkLevel: val }))}
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
        value={singleFormData.transit}
        onChange={(val) => setSingleFormData((p) => ({ ...p, transit: val }))}
      />

      {saleType === "Sale" && computedStatus === "New Project / Under Construction" && (
        <BuildYearSelector
          value={singleFormData.estimatedYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, estimatedYear: val }))}
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
            value={singleFormData.completedYear}
            onChange={(val) => setSingleFormData((p) => ({ ...p, completedYear: val }))}
            label="完成年份"
          />
        )}

      <div className="space-y-2">
        <div className="text-sm font-semibold">房源描述</div>
        <textarea
          className="border rounded w-full p-3"
          rows={4}
          placeholder="请输入房源描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ImageUpload
        config={photoConfig}
        images={singleFormData.images}
        setImages={(val) => setSingleFormData((p) => ({ ...p, images: val }))}
      />
    </div>
  );
}
