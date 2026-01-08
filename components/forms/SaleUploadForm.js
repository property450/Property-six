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

// ✅ 你现有的工具函数
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
  /* ================= PSF 计算（已修正为你要的逻辑） ================= */

  const buildUpSqft = convertToSqft(
    areaData?.values?.buildUp,
    areaData?.units?.buildUp
  );

  const landSqft = convertToSqft(
    areaData?.values?.land,
    areaData?.units?.land
  );

  /**
   * ✅ PSF 面积逻辑（重点）
   * - 两个都有 → 相加
   * - 只有一个 → 用那个
   * - 都没有 → 0
   */
  const areaSqft =
    (buildUpSqft > 0 ? buildUpSqft : 0) +
    (landSqft > 0 ? landSqft : 0);

  // 单价（你现在用的字段）
  const priceSingle = toNumber(singleFormData?.price);

  // 预留区间价（不破坏你以后扩展）
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

  return (
    <div className="space-y-4">
      <AreaSelector
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

      {/* ✅ PSF 显示（所有 Sale 模式一致） */}
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
