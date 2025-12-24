// components/uploadForms/SubsaleSecondaryMarketForm.js
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

export default function SubsaleSecondaryMarketForm({
  // from upload-property
  saleType,
  computedStatus,
  isRoomRental,

  areaData,
  setAreaData,

  singleFormData,
  setSingleFormData,

  description,
  setDescription,

  photoConfig,

  convertToSqft,
}) {
  // 这个文件只负责“展示”，不改你的结构
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

      {/* Subsale 是非项目，不走 RoomRentalForm（保持你原逻辑：RoomRental 是 rent + room） */}
      {!isRoomRental && (
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

          {/* 你原本：Subsale / Auction / Rent-to-Own / Completed Unit / Developer Unit 共用「完成年份」 */}
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
