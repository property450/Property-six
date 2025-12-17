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
import FloorCountSelector from "@/components/FloorCountSelector";
import RoomRentalForm from "@/components/RoomRentalForm";

// Homestay / Hotel 通用表单
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

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

// 给「批量 Rent 项目」在外面统一选 Category / Sub Type 用
const LAYOUT_CATEGORY_OPTIONS = {
  "Bungalow / Villa": [
    "Bungalow",
    "Link Bungalow",
    "Twin Villa",
    "Zero-Lot Bungalow",
    "Bungalow land",
  ],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Flat",
    "Service Residence",
  ],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terraced House", "Townhouse"],
  "Business Property": [
    "Hotel / Resort",
    "Hostel / Dormitory",
    "Boutique Hotel",
    "Office",
    "Office Suite",
    "Business Suite",
    "Retail Shop",
    "Retail Space",
    "Retail Office",
    "Shop",
    "Shop / Office",
    "Sofo",
    "Soho",
    "Sovo",
    "Commercial Bungalow",
    "Commercial Semi-Detached House",
    "Mall / Commercial Complex",
    "School / University",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Government Office",
    "Community Hall / Public Utilities",
  ],
  "Industrial Property": [
    "Factory",
    "Cluster Factory",
    "Semi-D Factory",
    "Detached Factory",
    "Terrace Factory",
    "Warehouse",
    "Showroom cum Warehouse",
    "Light Industrial",
    "Heavy Industrial",
  ],
  Land: [
    "Agricultural Land",
    "Industrial Land",
    "Commercial Land",
    "Residential Land",
    "Oil Palm Estate",
    "Rubber Plantation",
    "Fruit Orchard",
    "Paddy Field",
    "Vacant Agricultural Land",
  ],
};

// -------------------- 默认 AreaSelector 值 --------------------
const defaultAreaData = {
  types: ["buildUp"],
  units: { buildUp: "square feet", land: "square feet" },
  values: { buildUp: "", land: "" },
};

// -------------------- 房间表单默认对象 --------------------
function makeDefaultRoomForm() {
  return {
    price: "",
    areaData: JSON.parse(JSON.stringify(defaultAreaData)),
    roomData: {}, // 给 RoomRentalForm 的 value（它会自己 merge defaultValue）
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
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

  // ✅ 来自 TypeSelector：整间 / 房间出租
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole | room
  // ✅ 来自 TypeSelector：single / multi
  const [roomCountMode, setRoomCountMode] = useState("single"); // single | multi
  // ✅ 来自 TypeSelector：2~10
  const [roomCount, setRoomCount] = useState("2");

  // 批量 Rent 项目：统一的 Property Category / Sub Type
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 项目类房源的 layout 列表
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 普通单一房源的表单数据（整间出租/出售）
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
    storeys: "",
    transit: null,
  });

  // ✅ 整间出租/出售 的 areaData
  const [areaData, setAreaData] = useState(JSON.parse(JSON.stringify(defaultAreaData)));

  // ✅ 房间出租：房间表单数组（每个房间都有自己的 area + price + roomData）
  const [roomForms, setRoomForms] = useState([makeDefaultRoomForm()]);

  const [availability, setAvailability] = useState({});
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

  // ---------- Rent 批量项目的判定 ----------
  const isBulkRentProject = String(saleType || "").toLowerCase() === "rent" && rentBatchMode === "yes";

  // 批量 Rent 时，强制当成 Completed Unit / Developer Unit 来走项目流程
  const computedStatus = isBulkRentProject ? "Completed Unit / Developer Unit" : propertyStatus;

  // 当前是否是「项目类」房源
  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Under Construction") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  // ✅ 是否「只出租房间」
  const isRoomRental =
    String(saleType || "").toLowerCase() === "rent" && roomRentalMode === "room" && !isProject;

  // 当不再是项目类时，清空 layouts
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // ✅ 根据 roomCountMode / roomCount 自动生成房间表单数量
  useEffect(() => {
    if (!isRoomRental) return;

    const targetCount =
      roomCountMode === "multi" ? Math.min(10, Math.max(2, parseInt(roomCount || "2", 10))) : 1;

    setRoomForms((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.length === targetCount) return list;

      const next = [...list];
      while (next.length < targetCount) next.push(makeDefaultRoomForm());
      while (next.length > targetCount) next.pop();
      return next;
    });
  }, [isRoomRental, roomCountMode, roomCount]);

  // 根据单一房源的配置生成图片上传配置
  const photoConfig = {
    bedrooms: singleFormData.bedrooms || "",
    bathrooms: singleFormData.bathrooms || "",
    kitchens: singleFormData.kitchens || "",
    livingRooms: singleFormData.livingRooms || "",
    carpark: singleFormData.carpark || "",
    extraSpaces: singleFormData.extraSpaces || [],
    facilities: singleFormData.facilities || [],
    furniture: singleFormData.furniture || [],
    orientation: singleFormData.facing || "",
    transit: singleFormData.transit || null,
  };

  // ---------- 提交 ----------
  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      // ✅ unit_layouts 组装：
      // - 项目：unitLayouts
      // - 非项目整间： [singleFormData]
      // - 非项目房间出租：每个房间一份（包含自己的 price + areaData + roomData），并合并共享字段（extra/facilities/furniture/transit...）
      let unitLayoutsPayload = [];

      if (isProject && unitLayouts.length > 0) {
        unitLayoutsPayload = unitLayouts;
      } else if (isRoomRental) {
        unitLayoutsPayload = roomForms.map((rf) => ({
          // 共享字段（你说要放在“偏向种族”下面的那些）
          extraSpaces: singleFormData.extraSpaces || [],
          furniture: singleFormData.furniture || [],
          facilities: singleFormData.facilities || [],
          transit: singleFormData.transit || null,

          // 每个房间自己的 price + area
          price: rf.price || "",
          area: rf.areaData || JSON.parse(JSON.stringify(defaultAreaData)),

          // RoomRentalForm 自己的字段
          ...(rf.roomData || {}),
        }));
      } else {
        unitLayoutsPayload = [singleFormData];
      }

      const { error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            unit_layouts: JSON.stringify(unitLayoutsPayload),

            // ✅ 主表 price：整间出租用 singleFormData.price；房间出租就不强塞（避免误导）
            price: !isRoomRental ? (singleFormData.price || undefined) : undefined,

            address,
            lat: latitude,
            lng: longitude,
            user_id: user.id,
            type,
            sale_type: saleType || null,
            property_status: computedStatus || null,
            build_year: singleFormData.buildYear,

            bedrooms: singleFormData.bedrooms,
            bathrooms: singleFormData.bathrooms,
            carpark: singleFormData.carpark,
            store: singleFormData.store,

            // ✅ 主表 area：整间出租用 areaData；房间出租每房间有自己的
            area: !isRoomRental ? JSON.stringify(areaData) : JSON.stringify({}),

            facilities: JSON.stringify(singleFormData.facilities || []),
            furniture: JSON.stringify(singleFormData.furniture || []),
            facing: singleFormData.facing,
            transit: JSON.stringify(singleFormData.transit || {}),
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
  const isHotel = saleTypeNorm.includes("hotel");

  // ---------- JSX ----------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      {/* 地址搜索 */}
      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      {/* Sale / Rent / Homestay / Hotel / Category 等 */}
      <TypeSelector
        value={type}
        onChange={setType}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
        onFormChange={(formData) => {
          const newStatus = formData?.propertyStatus || "";
          const newSaleType = formData?.saleType || "";
          const newStoreys = formData?.storeys;

          // ✅ 来自 TypeSelector
          const newRoomRentalMode = formData?.roomRentalMode || "whole";
          const newRoomCountMode = formData?.roomCountMode || "single";
          const newRoomCount = formData?.roomCount || "2";

          setSaleType(newSaleType);
          setRoomRentalMode(newRoomRentalMode);
          setRoomCountMode(newRoomCountMode);
          setRoomCount(newRoomCount);

          setPropertyStatus((prev) => (prev === newStatus ? prev : newStatus));

          if (typeof newStoreys !== "undefined") {
            setSingleFormData((prev) => ({ ...prev, storeys: newStoreys }));
          }
        }}
      />

      {/* ========= Homestay / Hotel 统一用 HotelUploadForm ========= */}
      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {isProject ? (
            <>
              {/* ⭐ 批量 Rent 项目：先统一选一次 Category / Sub Type */}
              {isBulkRentProject && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Property Category（整个项目）
                    </label>
                    <select
                      value={projectCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setProjectCategory(cat);
                        setProjectSubType("");

                        setUnitLayouts((prev) =>
                          (Array.isArray(prev) ? prev : []).map((layout) => ({
                            ...layout,
                            propertyCategory: cat,
                            subType: "",
                          }))
                        );
                      }}
                      className="mt-1 block w-full border rounded-lg p-2"
                    >
                      <option value="">请选择类别</option>
                      {Object.keys(LAYOUT_CATEGORY_OPTIONS).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {projectCategory && LAYOUT_CATEGORY_OPTIONS[projectCategory] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sub Type（整个项目）
                      </label>
                      <select
                        value={projectSubType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjectSubType(val);

                          setUnitLayouts((prev) =>
                            (Array.isArray(prev) ? prev : []).map((layout) => ({
                              ...layout,
                              subType: val,
                            }))
                          );
                        }}
                        className="mt-1 block w-full border rounded-lg p-2"
                      >
                        <option value="">请选择具体类型</option>
                        {LAYOUT_CATEGORY_OPTIONS[projectCategory].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

       // New Project：从第一个房型复制到其它房型的字段
const PROJECT_COPY_FIELDS = [
  "extraSpaces",
  "furniture",
  "facilities",
  "transit",
];


              <UnitTypeSelector
  propertyStatus={computedStatus}
  layouts={unitLayouts}
  onChange={(newLayouts) => {
    setUnitLayouts((prev) => {
      const oldList = Array.isArray(prev) ? prev : [];
      const nextList = Array.isArray(newLayouts) ? newLayouts : [];

      // 👉 取“当前最新的第一个房型”作为模板
      const template = oldList[0] || {};

      const merged = nextList.map((incoming, index) => {
        // 已存在的房型 → 保留自己的值
        if (oldList[index]) {
          return {
            ...oldList[index],
            ...incoming,
          };
        }

        // 新增的房型（index > 0）
        if (index > 0 && template) {
          const copiedFields = {};
          PROJECT_COPY_FIELDS.forEach((key) => {
            if (template[key] !== undefined) {
              copiedFields[key] = deepClone(template[key]);
            }
          });

          return {
            ...incoming,
            ...copiedFields,
          };
        }

        // index === 0（第一个）
        return {
          ...incoming,
        };
      });

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
                      projectCategory={projectCategory}
                      projectSubType={projectSubType}
                      lockCategory={isBulkRentProject}
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
            /* ------------ 普通非项目房源（整间 / 房间出租） ------------ */
            <div className="space-y-4 mt-6">
              {/* ✅ 房间出租：每个房间自己的 Area + Price（你要的） */}
              {isRoomRental ? (
                <div className="space-y-6">
                  {roomForms.map((rf, idx) => {
                    const buildUpSqft = convertToSqft(
                      rf.areaData?.values?.buildUp,
                      rf.areaData?.units?.buildUp
                    );
                    const landSqft = convertToSqft(
                      rf.areaData?.values?.land,
                      rf.areaData?.units?.land
                    );
                    const totalAreaSqft = (buildUpSqft || 0) + (landSqft || 0);

                    const priceNum = Number(String(rf.price || "").replace(/,/g, ""));
                    const psf =
                      totalAreaSqft > 0 && Number.isFinite(priceNum) && priceNum > 0
                        ? priceNum / totalAreaSqft
                        : null;

                    return (
                      <div key={idx} className="border rounded-xl p-4 bg-white space-y-3">
                        <h3 className="text-lg font-semibold">房间 {idx + 1}</h3>

                        <AreaSelector
                          onChange={(data) => {
                            setRoomForms((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], areaData: data };
                              return next;
                            });
                          }}
                          initialValue={rf.areaData}
                        />

                        <PriceInput
                          value={rf.price}
                          onChange={(val) => {
                            setRoomForms((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], price: val };
                              return next;
                            });
                          }}
                          listingMode={saleType}
                          area={{
                            buildUp: buildUpSqft,
                            land: landSqft,
                          }}
                        />

                        {psf !== null && (
                          <p className="text-sm text-gray-600 mt-1">
                            每平方英尺: RM{" "}
                            {psf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                         )}

                        <RoomRentalForm
                          value={rf.roomData}
                          onChange={(nextRoomData) => {
                            setRoomForms((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], roomData: nextRoomData };
                              return next;
                            });
                          }}
                          extraSection={
                            <div className="space-y-4 mt-3">
                              <ExtraSpacesSelector
                                value={singleFormData.extraSpaces || []}
                                onChange={(val) =>
                                  setSingleFormData((prev) => ({ ...prev, extraSpaces: val }))
                                }
                              />

                            <FurnitureSelector
                                value={singleFormData.furniture || []}
                                onChange={(val) =>
                                  setSingleFormData((prev) => ({ ...prev, furniture: val }))
                                }
                              />

                              <FacilitiesSelector
                                value={singleFormData.facilities || []}
                                onChange={(val) =>
                                  setSingleFormData((prev) => ({ ...prev, facilities: val }))
                                }
                              />

                              <TransitSelector
                                value={singleFormData.transit || null}
                                onChange={(info) =>
                                  setSingleFormData((prev) => ({ ...prev, transit: info }))
                                }
                              />
                            </div>
}
/>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ✅ 整间出租/出售：原本表单保留 */
                <>
                  <AreaSelector onChange={(data) => setAreaData(data)} initialValue={areaData} />

                  <PriceInput
                    value={singleFormData.price}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, price: val }))}
                    listingMode={saleType}
                    area={{
                      buildUp: convertToSqft(areaData.values.buildUp, areaData.units.buildUp),
                      land: convertToSqft(areaData.values.land, areaData.units.land),
                    }}
/>

                  {/* 每平方英尺 RM 计算 */}
                  {(() => {
                    try {
                      const buildUpSqft = convertToSqft(areaData.values.buildUp, areaData.units.buildUp);
                      const landSqft = convertToSqft(areaData.values.land, areaData.units.land);
                      const totalAreaSqft = (buildUpSqft || 0) + (landSqft || 0);

                      const priceVal = singleFormData.price;
                      if (!totalAreaSqft || !priceVal) return null;

                      const priceNum = Number(String(priceVal).replace(/,/g, ""));
                      if (!priceNum || !isFinite(priceNum)) return null;

                      const psf = priceNum / totalAreaSqft;

                    return (
                        <p className="text-sm text-gray-600 mt-1">
                          每平方英尺: RM{" "}
                          {psf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}

                  <RoomCountSelector
                    value={{
                      bedrooms: singleFormData.bedrooms,
                      bathrooms: singleFormData.bathrooms,
                      kitchens: singleFormData.kitchens,
                      livingRooms: singleFormData.livingRooms,
                    }}
                    onChange={(patch) => setSingleFormData((prev) => ({ ...prev, ...patch }))}
                  />

<CarparkCountSelector
                    value={singleFormData.carpark}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, carpark: val }))}
                    mode="single"
                  />

                  <CarparkLevelSelector
                    value={singleFormData.carparkPosition}
                    onChange={(val) =>
                      setSingleFormData((prev) => ({ ...prev, carparkPosition: val }))
                    }
                    mode="single"
                  />

                  <ExtraSpacesSelector
                    value={singleFormData.extraSpaces || []}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, extraSpaces: val }))}
                  />

<FacingSelector
                    value={singleFormData.facing}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, facing: val }))}
                  />

                  <FurnitureSelector
                    value={singleFormData.furniture}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, furniture: val }))}
                  />

                  {!isProject && shouldShowFloorSelector(type, saleType, rentBatchMode) && (
                    <FloorCountSelector
                      value={singleFormData.storeys}
                      onChange={(v) => setSingleFormData((prev) => ({ ...prev, storeys: v }))}
                    />
                  )}

                  <FacilitiesSelector
                    value={singleFormData.facilities}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, facilities: val }))}
                  />

                      <TransitSelector
                    value={singleFormData.transit || null}
                    onChange={(info) => setSingleFormData((prev) => ({ ...prev, transit: info }))}
                  />

                  {/* 建成年份 / 预计完成年份：只在 Sale 时显示 */}
                  {saleType === "Sale" &&
                    computedStatus === "New Project / Under Construction" && (
                      <BuildYearSelector
                        value={singleFormData.buildYear}
                        onChange={(val) => setSingleFormData((prev) => ({ ...prev, buildYear: val }))}
                        quarter={singleFormData.quarter}
                        onQuarterChange={(val) => setSingleFormData((prev) => ({ ...prev, quarter: val }))}
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
                        onChange={(val) => setSingleFormData((prev) => ({ ...prev, buildYear: val }))}
                        quarter={undefined}
                        onQuarterChange={() => {}}
                        showQuarter={false}
                        label="完成年份"
                      />
                    )}
                </>
              )}

{/* 房源描述（整间 / 单间都要有） */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
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

{/* 非项目类时的图片上传（房间出租也可以继续用这个；你现在逻辑是跟着 singleFormData.photos） */}
          {!isProject && (
            <ImageUpload
              config={photoConfig}
              images={singleFormData.photos}
              setImages={(updated) => setSingleFormData((prev) => ({ ...prev, photos: updated }))}
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
