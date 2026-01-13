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

  // ✅ 只用于 AreaSelector 自动切换 Land（不传也不会影响其它逻辑）
  propertyCategory = "",
}) {
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
   * - build up 和 land area 两个都有 → 相加
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

  // ✅✅✅【关键修复】不再依赖外部传进来的 photoConfig，直接用 singleFormData 生成（恢复自动分组上传框）
  const photoConfigComputed = {
    bedrooms: singleFormData?.bedrooms ?? "",
    bathrooms: singleFormData?.bathrooms ?? "",
    kitchens: singleFormData?.kitchens ?? "",
    livingRooms: singleFormData?.livingRooms ?? "",
    // ImageUpload 用的是 carpark 字段（支持数字/字符串或 min/max）
    carpark: singleFormData?.carparks ?? singleFormData?.carpark ?? "",
    store: singleFormData?.store ?? "",
    extraSpaces: Array.isArray(singleFormData?.extraSpaces) ? singleFormData.extraSpaces : [],
    furniture: Array.isArray(singleFormData?.furniture) ? singleFormData.furniture : [],
    facilities: Array.isArray(singleFormData?.facilities) ? singleFormData.facilities : [],
    // ImageUpload 用 orientation（你 FacingSelector 存在 facing）
    orientation: singleFormData?.facing ?? singleFormData?.orientation ?? [],

    // ✅ 固定上传框（不依赖选择）
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
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, price: val }))
        }
        listingMode={saleType}
        area={{
          buildUp: buildUpSqft,
          land: landSqft,
        }}
      />

      {/* ✅ PSF 显示（所有 Sale 模式一致：New Project / Completed / Subsale / Auction / RTO 都会显示） */}
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
        value={singleFormData.carparks}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, carparks: val }))
        }
      />

      <CarparkLevelSelector
        value={singleFormData.carparkLevel}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, carparkLevel: val }))
        }
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
        value={singleFormData.transit}
        onChange={(val) =>
          setSingleFormData((p) => ({ ...p, transit: val }))
        }
      />

      {/* ✅ 你原本：New Project 有预计完成年份 + 季度 */}
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

      {/* ✅ 你原本：Completed / Subsale / Auction / RTO 有完成年份 */}
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

            <LayoutBlueprintUpload
  value={singleFormData.layoutPhotos}
  onChange={(val) => setSingleFormData((p) => ({ ...p, layoutPhotos: val }))}
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
