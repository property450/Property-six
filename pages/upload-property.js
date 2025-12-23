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
import RoomRentalForm from "@/components/RoomRentalForm";

// Homestay / Hotel
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

// 批量 Rent 项目：统一 Category / Sub Type（你原本就有）
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

// ✅ 你要复制/脱钩的 common 字段（只做这四个）
const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

// 深拷贝，避免引用共享导致“改一个影响全部”
function cloneDeep(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

// 只提取 common 字段
function pickCommon(layout) {
  const o = layout || {};
  return {
    extraSpaces: Array.isArray(o.extraSpaces) ? o.extraSpaces : [],
    furniture: Array.isArray(o.furniture) ? o.furniture : [],
    facilities: Array.isArray(o.facilities) ? o.facilities : [],
    transit: o.transit ?? null,
  };
}

// 用于判断 common 是否变化
function commonHash(layout) {
  try {
    return JSON.stringify(pickCommon(layout));
  } catch {
    return String(Date.now());
  }
}

// ✅【关键修复】把 UnitTypeSelector onChange 的返回值，统一变成 layouts 数组
function normalizeLayoutsFromUnitTypeSelector(payload) {
  // 1) 已经是数组 -> 直接返回
  if (Array.isArray(payload)) return payload;

  // 2) 可能直接回传数字（选择了几个房型）
  if (typeof payload === "number") {
    const n = Math.max(0, Math.floor(payload));
    return Array.from({ length: n }, () => ({}));
  }

  // 3) 可能回传字符串数字
  if (typeof payload === "string" && /^\d+$/.test(payload.trim())) {
    const n = Math.max(0, Math.floor(Number(payload.trim())));
    return Array.from({ length: n }, () => ({}));
  }

  // 4) 可能是对象：{ count: 3 } / { layoutCount: 3 } / { unitCount: 3 }
  if (payload && typeof payload === "object") {
    // 常见字段优先：layouts / unitLayouts
    if (Array.isArray(payload.layouts)) return payload.layouts;
    if (Array.isArray(payload.unitLayouts)) return payload.unitLayouts;

    // 常见 count 字段
    const maybeCount =
      payload.count ??
      payload.layoutCount ??
      payload.unitTypeCount ??
      payload.unitCount ??
      payload.numLayouts ??
      payload.quantity;

    if (typeof maybeCount === "number") {
      const n = Math.max(0, Math.floor(maybeCount));
      return Array.from({ length: n }, () => ({}));
    }
    if (typeof maybeCount === "string" && /^\d+$/.test(maybeCount.trim())) {
      const n = Math.max(0, Math.floor(Number(maybeCount.trim())));
      return Array.from({ length: n }, () => ({}));
    }
  }

  // 5) 不认识的格式 -> 返回空
  return [];
}

// 面积单位转换（你原本就有）
const convertToSqft = (val, unit) => {
  const num = parseFloat(String(val || "").replace(/,/g, ""));
  if (isNaN(num) || num <= 0) return 0;
  const u = (unit || "").toString().toLowerCase();
  if (
    u.includes("square meter") ||
    u.includes("sq m") ||
    u.includes("square metres") ||
    u.includes("sqm")
  )
    return num * 10.7639;
  if (u.includes("acre")) return num * 43560;
  if (u.includes("hectare")) return num * 107639;
  return num;
};

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // 基础信息
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 顶层描述
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // 来自 TypeSelector 的值
  const [type, setType] = useState("");
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel...
  const [propertyStatus, setPropertyStatus] = useState(""); // New Project / Under Construction ...
  const [usage, setUsage] = useState(""); // (可选) 用途 / Usage
  const [rentBatchMode, setRentBatchMode] = useState("no"); // "no" | "yes"
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // "whole" | "room"

  // 批量 Rent 项目：统一 Category/SubType
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 项目 layouts（New Project / Completed Unit / Rent batch etc 都在这里）
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 非项目（单一房源）数据（你原本就有）
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

  // AreaSelector 数据
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  // availability（你原本就有）
  const [availability, setAvailability] = useState({});

  const [loading, setLoading] = useState(false);

  // 登录检查
  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <>正在检查登录状态...</>;

  // 地址选择
  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  // -----------------------------
  // 判定项目/模式（尽量不动你逻辑）
  // -----------------------------
  const saleTypeNorm = (saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isBulkRentProject =
    String(saleType || "").toLowerCase() === "rent" && rentBatchMode === "yes";
  const computedStatus = isBulkRentProject
    ? "Completed Unit / Developer Unit"
    : propertyStatus;

  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Under Construction") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  const isRoomRental =
    String(saleType || "").toLowerCase() === "rent" &&
    roomRentalMode === "room";

    // ✅ 只在 Sale + New Project 启用“Layout1 同步/脱钩”
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    String(computedStatus || "").includes("New Project");

  // 不再是项目类时清空 layouts（保留你原本行为）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // ✅ 关键：当 Layout1(common)变化时，同步给仍在继承的 layout
  // 图片上传 config（非项目）
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

  // -----------------------------
  // 提交
  // -----------------------------
  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("请填写完整信息");
      return;
    }
    setLoading(true);
    try {
      const unitLayoutsToSave =
        isProject && unitLayouts.length > 0 ? unitLayouts : [singleFormData];

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

  // -----------------------------
  // 渲染
  // -----------------------------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      {/* 标题 */}
      <input
        className="w-full border rounded-lg p-2"
        placeholder="房源标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* 地址 */}
      <div className="space-y-2">
        <label className="font-medium">地址</label>
        <AddressSearchInput onSelect={handleLocationSelect} />
        {address ? (
          <div className="text-sm text-gray-600">已选择：{address}</div>
        ) : null}
      </div>

      {/* TypeSelector：你项目的入口 */}
      <TypeSelector
        value={type}
        onChange={(newValue) => setType(newValue)}
        onFormChange={(formData) => {
          if (!formData || typeof formData !== "object") return;

          // ✅ 重要：只更新「TypeSelector 明确回传的字段」
          // 这样不会因为某次回传缺少字段而把你已选择的值清空，导致“选了又跳回请选择/不记住”
          if (Object.prototype.hasOwnProperty.call(formData, "saleType")) {
            setSaleType(formData.saleType || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "propertyStatus")) {
            setPropertyStatus(formData.propertyStatus || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "usage")) {
            setUsage(formData.usage || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "propertyCategory")) {
            setProjectCategory(formData.propertyCategory || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "subType")) {
            setProjectSubType(formData.subType || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "rentBatchMode")) {
            setRentBatchMode(formData.rentBatchMode || "no");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "roomRentalMode")) {
            setRoomRentalMode(formData.roomRentalMode || "whole");
          }
        }}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={(val) => setRentBatchMode(val)}
      />

      {/* Homestay / Hotel 你原本的表单保持 */}
      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {/* -----------------------------
              项目模式（New Project / Completed Unit / Developer Unit）
             ----------------------------- */}
          {isProject ? (
            <>
              {/* Bulk Rent 项目：统一 Category/SubType（你原本就有） */}
              {isBulkRentProject && (
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                  <div>
                    <label className="font-medium">
                      Property Category（整个项目）
                    </label>
                    <select
                      value={projectCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setProjectCategory(cat);
                        setProjectSubType("");

                        // 同步到已存在 layouts（不破坏其它字段）
                        setUnitLayouts((prev) =>
                          (Array.isArray(prev) ? prev : []).map((l) => ({
                            ...l,
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
                      <label className="font-medium">
                        Sub Type（整个项目）
                      </label>
                      <select
                        value={projectSubType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProjectSubType(val);

                          setUnitLayouts((prev) =>
                            (Array.isArray(prev) ? prev : []).map((l) => ({
                              ...l,
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

              {/* ✅ 选择房型数量 -> 生成对应 UnitLayoutForm（关键修复在这里） */}
              <UnitTypeSelector
                propertyStatus={computedStatus}
                onChange={(payload) => {
                  const normalized = normalizeLayoutsFromUnitTypeSelector(payload);

                  setUnitLayouts((prev) => {
                    const oldList = Array.isArray(prev) ? prev : [];
                    const nextList = normalized; // ✅ 现在保证是数组

                    // ✅ 关键修复：如果房型数量没有变化，不重建 layouts，避免覆盖用户勾选状态
                    if (oldList.length === nextList.length) {
                      return prev;
                    }


                    // 以 nextList 的长度为准，避免旧残留导致“数量不对/不生成”
                    const merged = nextList.map((incoming, idx) => {
                      const oldItem = oldList[idx] || {};
                      // bulk rent：强制写入 category/subType
                      const withProjectType =
                        isBulkRentProject && projectCategory
                          ? {
                              propertyCategory: projectCategory,
                              subType: projectSubType || oldItem.subType || "",
                            }
                          : {};

                      // ✅ index0 永远不继承
                      // ✅ index>0 默认继承 true（除非旧的已经脱钩）
                      const inherit =
                        idx === 0
                          ? false
                          : typeof oldItem._inheritCommon === "boolean"
                          ? oldItem._inheritCommon
                          : true;

                      return {
                        ...oldItem,
                        ...incoming,
                        ...withProjectType,
                        _inheritCommon: inherit,
                      };
                    });

                    // ✅ 新增 layouts 时：立刻复制一次 layout0 的 common 给仍继承的
                    if (enableProjectAutoCopy && merged.length > 1) {
                      const common0 = pickCommon(merged[0] || {});
                      return merged.map((l, idx) => {
                        if (idx === 0) return l;
                        if (l._inheritCommon === false) return l;
                        return { ...l, ...cloneDeep(common0) };
                      });
                    }

                    return merged;
                  });
                }}
              />

              {/* 渲染 layouts（你原本就有，我只把 key 改成稳定 index，避免 id 不存在导致渲染异常） */}
              {unitLayouts.length > 0 && (
                <div className="space-y-4 mt-4">
                  {unitLayouts.map((layout, index) => (
                    <UnitLayoutForm
                      key={index}
                      index={index}
                      data={layout}
                      projectCategory={projectCategory}
                      projectSubType={projectSubType}
                      lockCategory={isBulkRentProject} // bulk rent 锁定 category/subType
                      enableCommonCopy={enableProjectAutoCopy}
                      onChange={(updated, meta) => {
                        setUnitLayouts((prev) => {
                          const base = Array.isArray(prev) ? prev : [];
                          const next = [...base];

                          const prevLayout = base[index] || {};
                          const updatedLayout = { ...prevLayout, ...updated };

                          // 初始化 inherit flag
                          if (index === 0) updatedLayout._inheritCommon = false;
                          if (
                            index > 0 &&
                            typeof updatedLayout._inheritCommon !== "boolean"
                          ) {
                            updatedLayout._inheritCommon =
                              typeof prevLayout._inheritCommon === "boolean"
                                ? prevLayout._inheritCommon
                                : true;
                          }

                          // ✅ 更精准：如果子表单明确告诉我们改的是 common 字段，直接脱钩/同步
                          const commonKeys = new Set(["extraSpaces", "furniture", "facilities", "transit"]);
                          if (enableProjectAutoCopy && meta?.commonField && commonKeys.has(meta.commonField)) {
                            if (index > 0) {
                              updatedLayout._inheritCommon = false; // 子 layout 改 common -> 脱钩
                            }
                          }
                          if (enableProjectAutoCopy && meta?.inheritToggle && index > 0) {
                            // 勾回“同步 Layout1”时：立刻把 Layout1 的 common 复制回来
                            if (updatedLayout._inheritCommon !== false) {
                              const common0 = pickCommon(base[0] || {});
                              Object.assign(updatedLayout, cloneDeep(common0));
                            }
                          }
                          // ✅ index>0：只要你改了 common（四个字段），立刻脱钩（但“点勾同步/脱钩”不走这里）
                          if (enableProjectAutoCopy && index > 0 && !meta?.inheritToggle) {
                            const prevH = commonHash(prevLayout);
                            const nextH = commonHash(updatedLayout);
                            if (prevH !== nextH) {
                              updatedLayout._inheritCommon = false;
                            }
                          }

                          next[index] = updatedLayout;

                          // ✅ index==0：改了 common，就同步到仍继承的 layout
                          if (enableProjectAutoCopy && index === 0) {
                            const prevH = commonHash(prevLayout);
                            const nextH = commonHash(updatedLayout);
                            if (prevH !== nextH) {
                              const common0 = pickCommon(updatedLayout);
                              for (let i = 1; i < next.length; i++) {
                                const li = next[i] || {};
                                if (li._inheritCommon !== false) {
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
            /* -----------------------------
               非项目：你原本的单一房源 / 房间出租逻辑（保留）
             ----------------------------- */
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
                  buildUp: convertToSqft(
                    areaData.values.buildUp,
                    areaData.units.buildUp
                  ),
                  land: convertToSqft(areaData.values.land, areaData.units.land),
                }}
              />

              {isRoomRental ? (
                <RoomRentalForm
                  value={singleFormData}
                  onChange={(next) =>
                    setSingleFormData((p) => ({ ...p, ...next }))
                  }
                  extraSection={
                    <div className="space-y-3">
                      <ExtraSpacesSelector
                        value={singleFormData.extraSpaces}
                        onChange={(val) =>
                          setSingleFormData((p) => ({
                            ...p,
                            extraSpaces: val,
                          }))
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
                    </div>
                  }
                />
              ) : (
                <>
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

                  {/* BuildYear 保留你原本的条件 */}
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

              {!isProject && (
                <ImageUpload
                  config={photoConfig}
                  images={singleFormData.photos}
                  setImages={(updated) =>
                    setSingleFormData((p) => ({ ...p, photos: updated }))
                  }
                />
              )}
            </div>
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
