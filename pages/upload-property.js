// pages/upload-property.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";
import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FacingSelector from "@/components/FacingSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";
import TransitSelector from "@/components/TransitSelector";
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";
import FloorCountSelector from "@/components/FloorCountSelector";

// Homestay / Hotel 统一表单
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

// Rent + landed / business / industrial + 单一房源 时，显示「有多少层」
function shouldShowFloorSelector(type, saleType, rentBatchMode) {
  if (!type) return false;
  if (saleType !== "Rent") return false;
  if (rentBatchMode === "yes") return false; // 批量项目在 layout 里自己处理

  const prefixes = [
    "Bungalow / Villa",
    "Semi-Detached House",
    "Terrace / Link House",
    "Business Property",
    "Industrial Property",
  ];

  return prefixes.some((p) => type.startsWith(p));
}

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [type, setType] = useState(""); // 最终类型（含 Sub Type）
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel
  const [propertyStatus, setPropertyStatus] = useState(""); // New Project / Completed Unit / ...
  const [rentBatchMode, setRentBatchMode] = useState("no"); // "no" | "yes"

  // 项目类房源的 layout 列表
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 普通单一房源的数据
  const [singleFormData, setSingleFormData] = useState({
    price: "",
    buildUp: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    store: "",
    facilities: [],
    furniture: [],
    extraSpaces: [],
    facing: "",
    photos: [],
    layoutPhotos: [],
    buildYear: "",
    quarter: "",
    carparkPosition: "",
    storeys: "", // 单一房源的层数
  });

  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  const [availability, setAvailability] = useState({});
  const [transitInfo, setTransitInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------- 地图 / 地址 ----------
  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  // ---------- 面积换算 ----------
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (
      u.includes("square meter") ||
      u.includes("sq m") ||
      u.includes("square metres") ||
      u.includes("sqm")
    ) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认 sqft
  };

  const handleAreaChange = (data) => {
    setAreaData(data);
  };

  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(singleFormData.layoutPhotos || []), ...files];
    setSingleFormData((prev) => ({ ...prev, layoutPhotos: newPhotos }));
  };

  // ---------- Rent 批量项目 / 整栋出租 判定 ----------
  const isRent = saleType === "Rent";
  const typeStr = type || "";
  const isBusinessCategory = typeStr.startsWith("Business Property");
  const isBusinessCategoryRent = isRent && isBusinessCategory;

  // 「不是，要分开出租」 = yes = 批量项目
  const isBulkRentProject = isRent && rentBatchMode === "yes";

  // 「是的，整间/整栋出租」 = no = 单一房源
  const isBusinessRentWhole = isBusinessCategoryRent && rentBatchMode === "no";

  // 批量 Rent 时，强制当成 Completed Unit / Developer Unit 来走项目流程
  const computedStatus = isBulkRentProject
    ? "Completed Unit / Developer Unit"
    : propertyStatus;

  // 当前是否是「项目类」房源（New Project / Completed Unit，包括批量租的项目）
  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Under Construction") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  // 当不再是项目类时，清空 layouts
  useEffect(() => {
    if (!isProject) {
      setUnitLayouts([]);
    }
  }, [isProject]);

  // 单一房源的图片上传配置
  const basePhotoConfig = {
    bedrooms: singleFormData.bedrooms || "",
    bathrooms: singleFormData.bathrooms || "",
    kitchens: singleFormData.kitchens || "",
    livingRooms: singleFormData.livingRooms || "",
    carpark: singleFormData.carpark || "",
    extraSpaces: singleFormData.extraSpaces || [],
    facilities: singleFormData.facilities || [],
    furniture: singleFormData.furniture || [],
    orientation: singleFormData.facing || "",
    transit: transitInfo || null,
  };

  // ✅ 整栋出租：只要每个类别一个上传框，不按数量拆很多
  const photoConfig = isBusinessRentWhole
    ? {
        ...basePhotoConfig,
        bedrooms: basePhotoConfig.bedrooms ? 1 : "",
        bathrooms: basePhotoConfig.bathrooms ? 1 : "",
        kitchens: basePhotoConfig.kitchens ? 1 : "",
        livingRooms: basePhotoConfig.livingRooms ? 1 : "",
        carpark: basePhotoConfig.carpark ? 1 : "",
        extraSpaces: (basePhotoConfig.extraSpaces || []).map((extra) => ({
          ...extra,
          count: 1,
        })),
        furniture: (basePhotoConfig.furniture || []).map((item) => ({
          ...item,
          count: 1,
        })),
      }
    : basePhotoConfig;

  // ---------- 提交 ----------
  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      const { data: propertyData, error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            unit_layouts: JSON.stringify(
              isProject && unitLayouts.length > 0
                ? unitLayouts
                : [singleFormData]
            ),
            price: singleFormData.price || undefined,
            address,
            lat: latitude,
            lng: longitude,
            user_id: user.id,
            type, // 最终类型
            sale_type: saleType || null,
            property_status: computedStatus || null,
            build_year: singleFormData.buildYear,
            bedrooms: singleFormData.bedrooms,
            bathrooms: singleFormData.bathrooms,
            carpark: singleFormData.carpark,
            store: singleFormData.store,
            area: JSON.stringify(areaData),
            facilities: JSON.stringify(singleFormData.facilities || []),
            furniture: JSON.stringify(singleFormData.furniture || []),
            facing: singleFormData.facing,
            transit: JSON.stringify(transitInfo || {}),
            availability: JSON.stringify(availability || {}),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("房源上传成功");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("上传失败，请检查控制台");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Homestay / Hotel 识别 ----------
  const saleTypeNorm = (saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel"); // 能覆盖 "Hotel / Resort"

  // ---------- JSX ----------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      {/* 地址搜索 */}
      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      {/* Sale / Rent / Category / Status */}
      <TypeSelector
        value={type}
        onChange={setType}
        // ✅ 不再把 rentBatchMode 交给 TypeSelector 控制
        onFormChange={(formData) => {
          const newStatus = formData?.propertyStatus || "";
          const newSaleType = formData?.saleType || "";
          const newStoreys = formData?.storeys;

          setSaleType(newSaleType);

          setPropertyStatus((prev) => {
            if (prev === newStatus) return prev;
            return newStatus;
          });

          if (typeof newStoreys !== "undefined") {
            setSingleFormData((prev) => ({
              ...prev,
              storeys: newStoreys,
            }));
          }
        }}
      />

      {/* ========= Rent 模式下的「是否整间/整栋出租 / 需要批量操作吗？」 ========= */}
      {saleType === "Rent" && (
        <div className="space-y-1">
          <label className="block text-sm font-medium mt-2">
            {isBusinessCategory
              ? "是否整间/整栋出租？"
              : "需要批量操作吗？"}
          </label>
          <select
            className="w-full border rounded-md p-2 text-sm"
            value={rentBatchMode}
            onChange={(e) => setRentBatchMode(e.target.value)}
          >
            <option value="no">
              {isBusinessCategory ? "是的，整间/整栋出租" : "不需要"}
            </option>
            <option value="yes">
              {isBusinessCategory ? "不是，要分开出租" : "需要"}
            </option>
          </select>
        </div>
      )}

      {/* ========= Homestay / Hotel 用独立表单 ========= */}
      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {/* ------------ 项目类房源 (New Project / Completed Unit / 批量 Rent 项目) ------------ */}
          {isProject ? (
            <>
              <UnitTypeSelector
                propertyStatus={computedStatus}
                layouts={unitLayouts}
                onChange={(newLayouts) => {
                  setUnitLayouts((prev) => {
                    const oldList = Array.isArray(prev) ? prev : [];
                    const nextList = Array.isArray(newLayouts)
                      ? newLayouts
                      : [];

                    const maxLen = Math.max(oldList.length, nextList.length);
                    const merged = [];

                    for (let i = 0; i < maxLen; i++) {
                      const oldItem = oldList[i] || {};
                      const newItem = nextList[i] || {};
                      merged[i] = { ...oldItem, ...newItem };
                    }

                    return merged;
                  });
                }}
              />

              {unitLayouts.length > 0 && (
                <div className="space-y-4 mt-4">
                  {unitLayouts.map((layout, index) => (
                    <UnitLayoutForm
                      key={index}
                      index={index}
                      data={{
                        ...layout,
                        projectType: computedStatus,
                        rentMode: isBulkRentProject ? "Rent" : saleType,
                      }}
                      onChange={(updated) => {
                        setUnitLayouts((prev) => {
                          const base = Array.isArray(prev) ? prev : [];
                          const next = [...base];
                          next[index] = updated;
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ------------ 普通非项目房源（单一房源，含 Rent 单一） ------------ */
            <div className="space-y-4 mt-6">
              <AreaSelector
                onChange={handleAreaChange}
                initialValue={areaData}
              />

              <PriceInput
                value={singleFormData.price}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, price: val }))
                }
                listingMode={saleType} // 用 Sale / Rent
                area={{
                  buildUp: convertToSqft(
                    areaData.values.buildUp,
                    areaData.units.buildUp
                  ),
                  land: convertToSqft(
                    areaData.values.land,
                    areaData.units.land
                  ),
                }}
              />

              {/* 每平方英尺 RM 计算 */}
              {(() => {
                try {
                  const buildUpSqft = convertToSqft(
                    areaData.values.buildUp,
                    areaData.units.buildUp
                  );
                  const landSqft = convertToSqft(
                    areaData.values.land,
                    areaData.units.land
                  );
                  const totalAreaSqft = (buildUpSqft || 0) + (landSqft || 0);

                  const priceVal = singleFormData.price;
                  if (!totalAreaSqft || !priceVal) return null;

                  const priceNum = Number(
                    String(priceVal).replace(/,/g, "")
                  );
                  if (!priceNum || !isFinite(priceNum)) return null;

                  const psf = priceNum / totalAreaSqft;

                  return (
                    <p className="text-sm text-gray-600 mt-1">
                      每平方英尺: RM{" "}
                      {psf.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  );
                } catch (e) {
                  return null;
                }
              })()}

              {/* ✅ Rent 👉 Business Property 👉 整栋出租：文字改成「这个property总共有多少xxx」 */}
              {(() => {
                const bedroomLabel = isBusinessRentWhole
                  ? "这个property总共有多少间卧室/房间"
                  : undefined;
                const bathroomLabel = isBusinessRentWhole
                  ? "这个property总共有多少间浴室/卫生间"
                  : undefined;
                const kitchenLabel = isBusinessRentWhole
                  ? "这个property总共有多少间厨房"
                  : undefined;
                const livingLabel = isBusinessRentWhole
                  ? "这个property总共有多少间客厅"
                  : undefined;

                return (
                  <RoomCountSelector
                    bedroomsLabel={bedroomLabel}
                    bathroomsLabel={bathroomLabel}
                    kitchensLabel={kitchenLabel}
                    livingRoomsLabel={livingLabel}
                    value={{
                      bedrooms: singleFormData.bedrooms,
                      bathrooms: singleFormData.bathrooms,
                      kitchens: singleFormData.kitchens,
                      livingRooms: singleFormData.livingRooms,
                    }}
                    onChange={(patch) =>
                      setSingleFormData((prev) => ({ ...prev, ...patch }))
                    }
                  />
                );
              })()}

              <CarparkCountSelector
                label={
                  isBusinessRentWhole
                    ? "这个property总共有多少个停车位"
                    : undefined
                }
                value={singleFormData.carpark}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, carpark: val }))
                }
                mode="single"
              />

              {/* 车位位置：整栋出租时改成「范围」模式 */}
              <CarparkLevelSelector
                value={singleFormData.carparkPosition}
                onChange={(val) =>
                  setSingleFormData((prev) => ({
                    ...prev,
                    carparkPosition: val,
                  }))
                }
                mode={isBusinessRentWhole ? "range" : "single"}
              />

              <ExtraSpacesSelector
                value={singleFormData.extraSpaces || []}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, extraSpaces: val }))
                }
              />

              <FacingSelector
                value={singleFormData.facing}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, facing: val }))
                }
              />

              <FurnitureSelector
                value={singleFormData.furniture}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, furniture: val }))
                }
              />

              {/* Rent + landed/business/industrial + 单一房源 → 有多少层 */}
              {!isProject &&
                shouldShowFloorSelector(type, saleType, rentBatchMode) && (
                  <FloorCountSelector
                    value={singleFormData.storeys}
                    onChange={(v) =>
                      setSingleFormData((prev) => ({
                        ...prev,
                        storeys: v,
                      }))
                    }
                    // ✅ Rent 👉 Business Property 👉 整栋出租：文案改成「这个property总共有多少层」
                    label={
                      isBusinessRentWhole
                        ? "这个property总共有多少层"
                        : undefined
                    }
                  />
                )}

              <FacilitiesSelector
                value={singleFormData.facilities}
                onChange={(val) =>
                  setSingleFormData((prev) => ({ ...prev, facilities: val }))
                }
              />

              <TransitSelector onChange={setTransitInfo} />

              {/* 建成年份 / 预计完成年份 */}
              {saleType === "Sale" &&
                computedStatus === "New Project / Under Construction" && (
                  <BuildYearSelector
                    value={singleFormData.buildYear}
                    onChange={(val) =>
                      setSingleFormData((prev) => ({
                        ...prev,
                        buildYear: val,
                      }))
                    }
                    quarter={singleFormData.quarter}
                    onQuarterChange={(val) =>
                      setSingleFormData((prev) => ({
                        ...prev,
                        quarter: val,
                      }))
                    }
                    showQuarter={true}
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
                      setSingleFormData((prev) => ({
                        ...prev,
                        buildYear: val,
                      }))
                    }
                    quarter={undefined}
                    onQuarterChange={() => {}}
                    showQuarter={false}
                    label="完成年份"
                  />
                )}

           {/* 房源描述 */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  房源描述
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入房源详细描述..."
                  rows={4}
                  className="w-full border rounded-lg p-2 resize-y"
                />
              </div>
            </div>
          )}

         {/* 非项目类时的图片上传 */}
          {!isProject && (
            <ImageUpload
              config={photoConfig}
              images={singleFormData.photos}
              setImages={(updated) =>
                setSingleFormData((prev) => ({ ...prev, photos: updated }))
              }
            />
          )}
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? "上传中..." : "提交房源"}
      </Button>
    </div>
  );
}
