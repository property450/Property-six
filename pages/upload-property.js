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

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// 批量 Rent 项目：统一 Category / Sub Type
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

// ✅ 你要复制的 common 字段
const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

function cloneDeep(v) {
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
    transit: o.transit ?? null,
  };
}

function commonHash(layout) {
  try {
    return JSON.stringify(pickCommon(layout));
  } catch {
    return String(Date.now());
  }
}

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [type, setType] = useState("");
  const [saleType, setSaleType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no"); // "no" | "yes"
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // "whole" | "room"

  // 批量 Rent 项目：统一 Category/SubType
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 项目 layouts
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 单一房源
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

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres") || u.includes("sqm")) return num * 10.7639;
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num;
  };

  const isBulkRentProject = String(saleType || "").toLowerCase() === "rent" && rentBatchMode === "yes";
  const computedStatus = isBulkRentProject ? "Completed Unit / Developer Unit" : propertyStatus;

  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Under Construction") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  const isRoomRental = String(saleType || "").toLowerCase() === "rent" && roomRentalMode === "room";

  // ✅ 只有 Sale + New Project 才启动“房型1同步”逻辑
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    computedStatus === "New Project / Under Construction";

  // 不再是项目类时清空 layouts
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // ✅ 监听 layout0 common 变化：同步给仍在继承的 layout
  const lastCommonHashRef = useRef(null);
  useEffect(() => {
    if (!enableProjectAutoCopy) return;
    if (!Array.isArray(unitLayouts) || unitLayouts.length < 2) return;

    const h = commonHash(unitLayouts[0] || {});
    if (lastCommonHashRef.current === null) {
      lastCommonHashRef.current = h;
      return;
    }
    if (lastCommonHashRef.current === h) return;

    const common0 = pickCommon(unitLayouts[0] || {});
    setUnitLayouts((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const next = [...base];
      for (let i = 1; i < next.length; i++) {
        const li = next[i] || {};
        if (li._inheritCommon === true) {
          next[i] = { ...li, ...cloneDeep(common0) };
        }
      }
      return next;
    });

    lastCommonHashRef.current = h;
  }, [enableProjectAutoCopy, unitLayouts]);

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

  const saleTypeNorm = (saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      <TypeSelector
        value={type}
        onChange={setType}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
        onFormChange={(formData) => {
          const newStatus = formData?.propertyStatus || "";
          const newSaleType = formData?.saleType || "";
          const newRoomRentalMode = formData?.roomRentalMode || "whole";

          setSaleType(newSaleType);
          setRoomRentalMode(newRoomRentalMode);
          setPropertyStatus((prev) => (prev === newStatus ? prev : newStatus));
        }}
      />

      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {isProject ? (
            <>
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
                      <label className="block text-sm font-medium text-gray-700">Sub Type（整个项目）</label>
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

              <UnitTypeSelector
                propertyStatus={computedStatus}
                layouts={unitLayouts}
                onChange={(newLayouts) => {
                  setUnitLayouts((prev) => {
                    const oldList = Array.isArray(prev) ? prev : [];
                    const nextList = Array.isArray(newLayouts) ? newLayouts : [];

                    // 只保留 nextList 的长度（避免旧的残留）
                    const merged = nextList.map((incoming, idx) => {
                      const oldItem = oldList[idx] || {};

                      const withProjectType =
                        isBulkRentProject && projectCategory
                          ? {
                              propertyCategory: projectCategory,
                              subType: projectSubType || oldItem.subType || "",
                            }
                          : {};

                      // ✅ index 0 永远不继承
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

                    // ✅ 新增 layout 时：先复制一次 layout0 的 common 给继承的
                    if (enableProjectAutoCopy && merged.length > 1) {
                      const common0 = pickCommon(merged[0] || {});
                      return merged.map((l, idx) => {
                        if (idx === 0) return l;
                        if (l._inheritCommon !== true) return l;
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

                          // 初始化 inherit flag
                          if (index === 0) updatedLayout._inheritCommon = false;
                          if (index > 0 && typeof updatedLayout._inheritCommon !== "boolean") {
                            updatedLayout._inheritCommon =
                              typeof prevLayout._inheritCommon === "boolean"
                                ? prevLayout._inheritCommon
                                : true;
                          }

                          // ✅ index>0：只要你改了 common，就脱钩
                          if (enableProjectAutoCopy && index > 0) {
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
            // 非项目（你原本的单一房源/房间出租逻辑先保留最基本可跑）
            <div className="space-y-4 mt-6">
              <AreaSelector onChange={setAreaData} initialValue={areaData} />

              <PriceInput
                value={singleFormData.price}
                onChange={(val) => setSingleFormData((p) => ({ ...p, price: val }))}
                listingMode={saleType}
                area={{
                  buildUp: convertToSqft(areaData.values.buildUp, areaData.units.buildUp),
                  land: convertToSqft(areaData.values.land, areaData.units.land),
                }}
              />

              {isRoomRental ? (
                <RoomRentalForm
                  value={singleFormData}
                  onChange={(next) => setSingleFormData((p) => ({ ...p, ...next }))}
                  extraSection={
                    <div className="space-y-4 mt-3">
                      <ExtraSpacesSelector
                        value={singleFormData.extraSpaces || []}
                        onChange={(val) => setSingleFormData((p) => ({ ...p, extraSpaces: val }))}
                      />
                      <FurnitureSelector
                        value={singleFormData.furniture || []}
                        onChange={(val) => setSingleFormData((p) => ({ ...p, furniture: val }))}
                      />
                      <FacilitiesSelector
                        value={singleFormData.facilities || []}
                        onChange={(val) => setSingleFormData((p) => ({ ...p, facilities: val }))}
                      />
                      <TransitSelector
                        value={singleFormData.transit || null}
                        onChange={(info) => setSingleFormData((p) => ({ ...p, transit: info }))}
                      />
                    </div>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <RoomCountSelector
                    value={{
                      bedrooms: singleFormData.bedrooms,
                      bathrooms: singleFormData.bathrooms,
                      kitchens: singleFormData.kitchens,
                      livingRooms: singleFormData.livingRooms,
                      store: singleFormData.store,
                    }}
                    onChange={(patch) => setSingleFormData((p) => ({ ...p, ...patch }))}
                  />

<CarparkCountSelector
                    value={singleFormData.carpark}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, carpark: val }))}
                  />

                  <CarparkLevelSelector
                    value={singleFormData.carparkPosition || ""}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, carparkPosition: val }))}
                    mode="range"
                  />

                  <FacingSelector
                    value={singleFormData.facing || ""}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, facing: val }))}
                  />

                  <ExtraSpacesSelector
                    value={singleFormData.extraSpaces || []}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, extraSpaces: val }))}
                  />

<FurnitureSelector
                    value={singleFormData.furniture || []}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, furniture: val }))}
                  />

                  <FacilitiesSelector
                    value={singleFormData.facilities || []}
                    onChange={(val) => setSingleFormData((p) => ({ ...p, facilities: val }))}
                  />

                  <TransitSelector
                    value={singleFormData.transit || null}
                    onChange={(info) => setSingleFormData((p) => ({ ...p, transit: info }))}
                  />

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
                    ["Completed Unit / Developer Unit", "Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(
                      computedStatus
                    ) && (
                      <BuildYearSelector
                        value={singleFormData.buildYear}
                        onChange={(val) => setSingleFormData((p) => ({ ...p, buildYear: val }))}
                        showQuarter={false}
                        label="完成年份"
                      />
                    )}
                </div>
              )}

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

              {!isProject && (
                <ImageUpload
                  config={photoConfig}
                  images={singleFormData.photos}
                  setImages={(updated) => setSingleFormData((p) => ({ ...p, photos: updated }))}
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
