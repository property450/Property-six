// pages/upload-property.js
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// 给「批量 Rent 项目」在外面统一选 Category / Sub Type 用
const LAYOUT_CATEGORY_OPTIONS = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
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

// ✅ New Project：从第一个房型复制到其它房型的字段
const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

function cloneDeep(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

function pickCommon(layout) {
  const o = layout || {};
  return {
    extraSpaces: Array.isArray(o.extraSpaces) ? o.extraSpaces : [],
    furniture: Array.isArray(o.furniture) ? o.furniture : [],
    facilities: Array.isArray(o.facilities) ? o.facilities : [],
    transit: o.transit || null,
  };
}

function commonChanged(a, b) {
  try {
    return JSON.stringify(pickCommon(a)) !== JSON.stringify(pickCommon(b));
  } catch {
    return true;
  }
}

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();
  const fileInputRef = useRef(null);

  // ✅ hooks 一定要在 return 之前
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [type, setType] = useState("");
  const [saleType, setSaleType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no"); // no | yes
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole | room

  // ✅ “是否只有一个房间 / 房间数量” 从 TypeSelector 回传
  const [roomCountMode, setRoomCountMode] = useState("single"); // single | multi
  const [roomCount, setRoomCount] = useState("2"); // "2" ~ "10"

  // 批量 Rent 项目：统一 Category/SubType
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 项目 layouts
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 单一房源（整间出租/出售）用
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

  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  // ✅ 多房间出租：每个房间一份数据
  const defaultRoomArea = {
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  };

  const [roomUnits, setRoomUnits] = useState([
    {
      areaData: defaultRoomArea,
      price: "",
      roomForm: {}, // RoomRentalForm 的内容
    },
  ]);

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

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

    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num;
  };

  // ---------- Rent 批量项目判定 ----------
  const isBulkRentProject = String(saleType || "").toLowerCase() === "rent" && rentBatchMode === "yes";
  const computedStatus = isBulkRentProject ? "Completed Unit / Developer Unit" : propertyStatus;

  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Under Construction") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  const isRoomRental = String(saleType || "").toLowerCase() === "rent" && roomRentalMode === "room";

  // ✅ 仅 Sale + New Project 启用复制逻辑
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" && computedStatus === "New Project / Under Construction";

  // 当不再是项目类时，清空 layouts
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // ✅ 当房间出租模式 multi + roomCount 改变时，生成对应数量的 roomUnits
  useEffect(() => {
    if (!isRoomRental) return;

    // single: 固定 1 个
    if (roomCountMode === "single") {
      setRoomUnits((prev) => {
        const first = prev?.[0] || { areaData: defaultRoomArea, price: "", roomForm: {} };
        return [first];
      });
      return;
    }

    // multi: 2~10
    const n = Math.min(10, Math.max(2, Number(roomCount || 2)));
    setRoomUnits((prev) => {
      const old = Array.isArray(prev) ? prev : [];
      const next = [];

      for (let i = 0; i < n; i++) {
        if (old[i]) next.push(old[i]);
        else next.push({ areaData: defaultRoomArea, price: "", roomForm: {} });
      }
      return next;
    });
  }, [isRoomRental, roomCountMode, roomCount]);

  // 根据单一房源生成图片上传配置
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
      // ✅ unit_layouts: 项目用 unitLayouts；非项目且房间出租 multi 用 roomUnits；否则 singleFormData
      const unitLayoutsToSave = (() => {
        if (isProject && unitLayouts.length > 0) return unitLayouts;
        if (isRoomRental) {
          // 多房间也存进去（每个房间一条）
          return roomUnits.map((r) => ({
            ...r.roomForm,
            price: r.price,
            area: r.areaData,
          }));
        }
        return [singleFormData];
      })();

      const { error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            unit_layouts: JSON.stringify(unitLayoutsToSave),
            price: singleFormData.price || undefined,
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
            area: JSON.stringify(areaData),
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

  // ✅ 计算 psf（房间出租 multi 用）
  const calcPsf = (price, a) => {
    try {
      const buildUpSqft = convertToSqft(a?.values?.buildUp, a?.units?.buildUp);
      const landSqft = convertToSqft(a?.values?.land, a?.units?.land);
      const totalAreaSqft = (buildUpSqft || 0) + (landSqft || 0);
      if (!totalAreaSqft) return null;

      const priceNum = Number(String(price || "").replace(/,/g, ""));
      if (!priceNum || !isFinite(priceNum)) return null;

      return priceNum / totalAreaSqft;
    } catch {
      return null;
    }
  };

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
          const newRoomRentalMode = formData?.roomRentalMode || "whole";

          setSaleType(newSaleType);
          setPropertyStatus((prev) => (prev === newStatus ? prev : newStatus));
          setRoomRentalMode(newRoomRentalMode);

          // ✅ 接住你新增的
          setRoomCountMode(formData?.roomCountMode || "single");
          setRoomCount(formData?.roomCount || "2");

          if (typeof newStoreys !== "undefined") {
            setSingleFormData((prev) => ({ ...prev, storeys: newStoreys }));
          }
        }}
      />

      {/* Homestay / Hotel */}
      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {/* ===================== 项目类（New Project / Completed Unit 等）===================== */}
          {isProject ? (
            <>
              {/* ⭐ 批量 Rent 项目：先统一选一次 Category / Sub Type */}
              {isBulkRentProject && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Category（整个项目）</label>
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
                      <label className="block text-sm font-medium text-gray-700">Sub Type（整个项目）</label>
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

              {/* 这个项目有多少个房型/layout？ */}
              <UnitTypeSelector
                propertyStatus={computedStatus}
                layouts={unitLayouts}
                onChange={(newLayouts) => {
                  setUnitLayouts((prev) => {
                    const oldList = Array.isArray(prev) ? prev : [];
                    const nextList = Array.isArray(newLayouts) ? newLayouts : [];

                    const maxLen = Math.max(oldList.length, nextList.length);
                    const merged = [];

                    for (let i = 0; i < maxLen; i++) {
                      const oldItem = oldList[i] || {};
                      const newItem = nextList[i] || {};

                      const withProjectType =
                        isBulkRentProject && projectCategory
                          ? {
                              propertyCategory: projectCategory,
                              subType: projectSubType || oldItem.subType || "",
                            }
                          : {};

                      const inheritFlag =
                        i === 0
                          ? false
                          : typeof oldItem._inheritCommon === "boolean"
                          ? oldItem._inheritCommon
                          : true;

                      merged[i] = {
                        ...oldItem,
                        ...newItem,
                        ...withProjectType,
                        _inheritCommon: inheritFlag,
                      };
                    }

                    // ✅ 新增 layout 时：把 layout0 的 common 复制到其它 inheritCommon=true 的 layout
                    if (enableProjectAutoCopy && merged.length > 1) {
                      const base0 = merged[0] || {};
                      const common0 = pickCommon(base0);

                      return merged.map((l, idx) => {
                        if (idx === 0) return l;
                        if (l?._inheritCommon !== true) return l;
                        return { ...l, ...cloneDeep(common0) };
                      });
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
                      projectCategory={projectCategory}
                      projectSubType={projectSubType}
                      lockCategory={isBulkRentProject}
                      onChange={(updated) => {
                        setUnitLayouts((prev) => {
                          const base = Array.isArray(prev) ? prev : [];
                          const next = [...base];

                          const prevLayout = base[index] || {};
                          const updatedLayout = { ...prevLayout, ...updated };

                          // ✅ index>0：用户改了 common 字段 => 立刻脱钩（不再继承）
                          if (index > 0 && enableProjectAutoCopy) {
                            if (commonChanged(prevLayout, updatedLayout)) {
                              updatedLayout._inheritCommon = false;
                            } else if (typeof updatedLayout._inheritCommon !== "boolean") {
                              updatedLayout._inheritCommon =
                                typeof prevLayout._inheritCommon === "boolean" ? prevLayout._inheritCommon : true;
                            }
                          } else if (index === 0) {
                            updatedLayout._inheritCommon = false;
                          }

                          next[index] = updatedLayout;

                          // ✅ index===0：第一个 layout 改 common 字段 => 同步给其它仍在继承的 layouts
                          if (index === 0 && enableProjectAutoCopy) {
                            if (commonChanged(prevLayout, updatedLayout)) {
                              const common0 = pickCommon(updatedLayout);
                              for (let i = 1; i < next.length; i++) {
                                const li = next[i] || {};
                                if (li._inheritCommon === true) {
                                  next[i] = { ...li, ...cloneDeep(common0) };
                                }
                              }
                            }
                          }

                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (

            /* ===================== 非项目类（整间 / 房间出租）===================== */
            <div className="space-y-6 mt-6">
              {/* --------- Rent：只出租房间 --------- */}
              {isRoomRental ? (
                <div className="space-y-6">
                  {roomUnits.map((room, idx) => {
                    const psf = calcPsf(room.price, room.areaData);

                    return (
                      <div key={idx} className="border rounded-xl p-4 bg-white space-y-4">
                        <div className="font-bold">房间 {idx + 1}</div>

                        {/* ✅ 每个房间自己的面积 */}
                        <AreaSelector
                          onChange={(data) => {
                            setRoomUnits((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], areaData: data };
                              return next;
                            });
                          }}
                          initialValue={room.areaData || defaultRoomArea}
                        />

                        {/* ✅ 每个房间自己的价格 */}
                        <PriceInput
                          value={room.price || ""}
                          onChange={(val) => {
                            setRoomUnits((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], price: val };
                              return next;
                            });
                          }}
                          listingMode={saleType}
                          area={{
                            buildUp: convertToSqft(room.areaData?.values?.buildUp, room.areaData?.units?.buildUp),
                            land: convertToSqft(room.areaData?.values?.land, room.areaData?.units?.land),
                          }}
                        />

                       {/* 每平方英尺 */}
                        {psf ? (
                          <p className="text-sm text-gray-600 mt-1">
                            每平方英尺: RM {psf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        ) : null}

                        {/* 房间表单 */}
                        <RoomRentalForm
                          value={room.roomForm || {}}
                          onChange={(nextForm) => {
                            setRoomUnits((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], roomForm: nextForm };
                              return next;
                            });
                          }}
                          extraSection={
                            <div className="space-y-4 mt-3">
                              {/* ✅ 你要放在偏向种族下面的四个 */}
                              <ExtraSpacesSelector
                               value={room.roomForm?.extraSpaces || []}
                                onChange={(val) => {
                                  setRoomUnits((prev) => {
                                    const next = [...prev];
                                    const cur = next[idx];
                                    next[idx] = {
                                      ...cur,
                                      roomForm: { ...(cur.roomForm || {}), extraSpaces: val },
                                    };
                                    return next;
                                  });
                                }}
                              />

                              <FurnitureSelector
                                value={room.roomForm?.furniture || []}
                                onChange={(val) => {
                                  setRoomUnits((prev) => {
                                    const next = [...prev];
                                    const cur = next[idx];
                                    next[idx] = {
                                      ...cur,
                                      roomForm: { ...(cur.roomForm || {}), furniture: val },
                                    };
                                    return next;
                                  });
                                }}
                              />

                              <FacilitiesSelector
                                value={room.roomForm?.facilities || []}
                                onChange={(val) => {
                                  setRoomUnits((prev) => {
                                    const next = [...prev];
                                    const cur = next[idx];
                                    next[idx] = {
                                      ...cur,
                                      roomForm: { ...(cur.roomForm || {}), facilities: val },
                                    };
                                    return next;
                                    });
                                }}
                              />

                              <TransitSelector
                                value={room.roomForm?.transit || null}
                                onChange={(info) => {
                                  setRoomUnits((prev) => {
                                    const next = [...prev];
                                    const cur = next[idx];
                                    next[idx] = {
                                      ...cur,
                                      roomForm: { ...(cur.roomForm || {}), transit: info },
                                    };
                                    return next;
                                  });
                                }}
                              />
                            </div>
                          }
                        />
</div>
                    );
                  })}
                </div>
              ) : (
                /* --------- 整间出租/出售：原本表单要保留 --------- */
                <div className="space-y-4">
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

{/* 常见字段（你原本整间表单的输入都要在这里） */}
                  <RoomCountSelector
                    value={{
                      bedrooms: singleFormData.bedrooms,
                      bathrooms: singleFormData.bathrooms,
                      kitchens: singleFormData.kitchens,
                      livingRooms: singleFormData.livingRooms,
                      store: singleFormData.store,
                    }}
                    onChange={(patch) => setSingleFormData((prev) => ({ ...prev, ...patch }))}
                  />

                  <CarparkCountSelector
                    value={singleFormData.carpark}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, carpark: val }))}
                  />

                  <CarparkLevelSelector
                    value={singleFormData.carparkPosition || ""}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, carparkPosition: val }))}
                  />

<FacingSelector
                    value={singleFormData.facing || ""}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, facing: val }))}
                  />

                  <ExtraSpacesSelector
                    value={singleFormData.extraSpaces || []}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, extraSpaces: val }))}
                  />

                  <FurnitureSelector
                    value={singleFormData.furniture || []}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, furniture: val }))}
                  />

                  <FacilitiesSelector
                    value={singleFormData.facilities || []}
                    onChange={(val) => setSingleFormData((prev) => ({ ...prev, facilities: val }))}
                  />

<TransitSelector
                    value={singleFormData.transit || null}
                    onChange={(info) => setSingleFormData((prev) => ({ ...prev, transit: info }))}
                  />

                  {/* Sale 才显示 BuildYearSelector（你原本的逻辑） */}
                  {saleType === "Sale" && computedStatus === "New Project / Under Construction" && (
                    <BuildYearSelector
                      value={singleFormData.buildYear}
                      onChange={(val) => setSingleFormData((prev) => ({ ...prev, buildYear: val }))}
                      quarter={singleFormData.quarter}
                      onQuarterChange={(val) => setSingleFormData((prev) => ({ ...prev, quarter: val }))}
                      showQuarter
                      label="预计交付时间"
                    />
                  )}

{saleType === "Sale" &&
                    ["Completed Unit / Developer Unit", "Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(
                      computedStatus
                    ) && (
                      <BuildYearSelector
                        value={singleFormData.buildYear}
                        onChange={(val) => setSingleFormData((prev) => ({ ...prev, buildYear: val }))}
                        showQuarter={false}
                        label="完成年份"
                      />
                    )}
                </div>
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

          {/* 非项目类时的图片上传（整间用 singleFormData.photos；房间出租 multi 如果你之后要每房间上传图，我们再加） */}
          {!isProject && !isRoomRental && (
            <ImageUpload
              config={photoConfig}
              images={singleFormData.photos}
              setImages={(updated) => setSingleFormData((prev) => ({ ...prev, photos: updated }))}
            />
          )}
        </>
      )}

<Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full">
        {loading ? "上传中..." : "提交房源"}
      </Button>
    </div>
  );
}
