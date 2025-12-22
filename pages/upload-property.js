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

// 鎵归噺 Rent 椤圭洰锛氱粺涓€ Category / Sub Type
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

// 鉁� 浣犺澶嶅埗/鑴遍挬鐨� common 瀛楁锛堝彧鍋氳繖鍥涗釜锛�
const COMMON_KEYS = ["extraSpaces", "furniture", "facilities", "transit"];

// 娣辨嫹璐濓紝閬垮厤寮曠敤鍏变韩瀵艰嚧鈥滄敼涓€涓奖鍝嶅叏閮ㄢ€�
function cloneDeep(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

// 鍙彁鍙� common 瀛楁
function pickCommon(layout) {
  const o = layout || {};
  return {
    extraSpaces: Array.isArray(o.extraSpaces) ? o.extraSpaces : [],
    furniture: Array.isArray(o.furniture) ? o.furniture : [],
    facilities: Array.isArray(o.facilities) ? o.facilities : [],
    transit: o.transit ?? null,
  };
}

// 鐢ㄤ簬鍒ゆ柇 common 鏄惁鍙樺寲
function commonHash(layout) {
  try {
    return JSON.stringify(pickCommon(layout));
  } catch {
    return String(Date.now());
  }
}

// 鉁呫€愬叧閿慨澶嶃€戞妸 UnitTypeSelector onChange 鐨勮繑鍥炲€硷紝缁熶竴鍙樻垚 layouts 鏁扮粍
function normalizeLayoutsFromUnitTypeSelector(payload) {
  // 1) 宸茬粡鏄暟缁� -> 鐩存帴杩斿洖
  if (Array.isArray(payload)) return payload;

  // 2) 鍙兘鐩存帴鍥炰紶鏁板瓧锛堥€夋嫨浜嗗嚑涓埧鍨嬶級
  if (typeof payload === "number") {
    const n = Math.max(0, Math.floor(payload));
    return Array.from({ length: n }, () => ({}));
  }

  // 3) 鍙兘鍥炰紶瀛楃涓叉暟瀛�
  if (typeof payload === "string" && /^\d+$/.test(payload.trim())) {
    const n = Math.max(0, Math.floor(Number(payload.trim())));
    return Array.from({ length: n }, () => ({}));
  }

  // 4) 鍙兘鏄璞★細{ count: 3 } / { layoutCount: 3 } / { unitCount: 3 }
  if (payload && typeof payload === "object") {
    // 甯歌瀛楁浼樺厛锛歭ayouts / unitLayouts
    if (Array.isArray(payload.layouts)) return payload.layouts;
    if (Array.isArray(payload.unitLayouts)) return payload.unitLayouts;

    // 甯歌 count 瀛楁
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

  // 5) 涓嶈璇嗙殑鏍煎紡 -> 杩斿洖绌�
  return [];
}

// 闈㈢Н鍗曚綅杞崲
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

  // 鍩虹淇℃伅
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 椤跺眰鎻忚堪
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // 鏉ヨ嚜 TypeSelector 鐨勫€�
  const [type, setType] = useState("");
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel...
  const [propertyStatus, setPropertyStatus] = useState(""); // New Project / Under Construction ...
  const [rentBatchMode, setRentBatchMode] = useState("no"); // "no" | "yes"
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // "whole" | "room"

  // 鎵归噺 Rent 椤圭洰锛氱粺涓€ Category/SubType
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 椤圭洰 layouts锛圢ew Project / Completed Unit / Rent batch etc 閮藉湪杩欓噷锛�
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 闈為」鐩紙鍗曚竴鎴挎簮锛夋暟鎹�
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

  // AreaSelector 鏁版嵁
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  // availability
  const [availability, setAvailability] = useState({});

  const [loading, setLoading] = useState(false);

  // 鐧诲綍妫€鏌�
  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <>姝ｅ湪妫€鏌ョ櫥褰曠姸鎬�...</>;

  // 鍦板潃閫夋嫨
  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  // -----------------------------
  // 鍒ゅ畾椤圭洰/妯″紡
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

  // 鉁� 鍙湪 Sale + New Project 鍚敤 鈥淟ayout1 鍚屾/鑴遍挬鈥�
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    computedStatus === "New Project / Under Construction";

  // 涓嶅啀鏄」鐩被鏃舵竻绌� layouts
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // 鉁� 鍏抽敭锛氬綋 Layout1(common)鍙樺寲鏃讹紝鍚屾缁欎粛鍦ㄧ户鎵跨殑 layout
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

  // 鍥剧墖涓婁紶 config锛堥潪椤圭洰锛�
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
  // 鎻愪氦
  // -----------------------------
  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("璇峰～鍐欏畬鏁翠俊鎭�");
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

      toast.success("鎴挎簮涓婁紶鎴愬姛");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("涓婁紶澶辫触锛岃妫€鏌ユ帶鍒跺彴");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 娓叉煋
  // -----------------------------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">涓婁紶鎴挎簮</h1>

      {/* 鏍囬 */}
      <input
        className="w-full border rounded-lg p-2"
        placeholder="鎴挎簮鏍囬"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* 鍦板潃 */}
      <div className="space-y-2">
        <label className="font-medium">鍦板潃</label>
        <AddressSearchInput onSelect={handleLocationSelect} />
        {address ? (
          <div className="text-sm text-gray-600">宸查€夋嫨锛歿address}</div>
        ) : null}
      </div>

      {/* 鉁� TypeSelector锛氭纭帴娉曪紙鍏抽敭淇锛� */}
      <TypeSelector
        onChange={(typeString) => {
          // TypeSelector 鐨� onChange 鍙細鍥炰紶瀛楃涓诧紙鏈€缁� type锛�
          setType(typeString || "");
        }}
        onFormChange={(formData) => {
          // 鉁� 杩欓噷鎵嶆槸鏁村寘鏁版嵁
          const newSaleType = formData?.saleType || "";
          const newStatus = formData?.propertyStatus || "";
          const newRentBatchMode = formData?.rentBatchMode || "no";
          const newRoomRentalMode = formData?.roomRentalMode || "whole";

          setSaleType(newSaleType);
          setRentBatchMode(newRentBatchMode);
          setRoomRentalMode(newRoomRentalMode);

          setPropertyStatus((prev) => (prev === newStatus ? prev : newStatus));
        }}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
      />

      {/* Homestay / Hotel 琛ㄥ崟淇濇寔 */}
      {isHomestay || isHotel ? (
        <HotelUploadForm />
      ) : (
        <>
          {/* -----------------------------
              椤圭洰妯″紡锛圢ew Project / Completed Unit / Developer Unit锛�
             ----------------------------- */}
          {isProject ? (
            <>
              {/* Bulk Rent 椤圭洰锛氱粺涓€ Category/SubType */}
              {isBulkRentProject && (
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                  <div>
                    <label className="font-medium">
                      Property Category锛堟暣涓」鐩級
                    </label>
                    <select
                      value={projectCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setProjectCategory(cat);
                        setProjectSubType("");

                        // 鍚屾鍒板凡瀛樺湪 layouts
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
                      <option value="">璇烽€夋嫨绫诲埆</option>
                      {Object.keys(LAYOUT_CATEGORY_OPTIONS).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {projectCategory && LAYOUT_CATEGORY_OPTIONS[projectCategory] && (
                    <div>
                      <label className="font-medium">Sub Type锛堟暣涓」鐩級</label>
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
                        <option value="">璇烽€夋嫨鍏蜂綋绫诲瀷</option>
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

              {/* 鉁� 閫夋嫨鎴垮瀷鏁伴噺 -> 鐢熸垚瀵瑰簲 UnitLayoutForm锛堝叧閿慨澶嶏細琛ラ綈 props锛� */}
              <UnitTypeSelector
                propertyStatus={computedStatus} // 鉁� 蹇呬紶锛屽惁鍒欏畠浼� return null
                layouts={unitLayouts} // 鉁� 蹇呬紶锛屽惁鍒欏畠鏃犳硶鈥滃鍑忊€濅繚鎸佸凡濉唴瀹�
                onChange={(payload) => {
                  const normalized = normalizeLayoutsFromUnitTypeSelector(payload);

                  setUnitLayouts((prev) => {
                    const oldList = Array.isArray(prev) ? prev : [];
                    const nextList = normalized; // 鉁� 鐜板湪淇濊瘉鏄暟缁�

                    const merged = nextList.map((incoming, idx) => {
                      const oldItem = oldList[idx] || {};

                      // bulk rent锛氬己鍒跺啓鍏� category/subType
                      const withProjectType =
                        isBulkRentProject && projectCategory
                          ? {
                              propertyCategory: projectCategory,
                              subType: projectSubType || oldItem.subType || "",
                            }
                          : {};

                      // 鉁� index0 姘歌繙涓嶇户鎵�
                      // 鉁� index>0 榛樿缁ф壙 true锛堥櫎闈炴棫鐨勫凡缁忚劚閽╋級
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

                    // 鉁� 鏂板 layouts 鏃讹細绔嬪埢澶嶅埗涓€娆� layout0 鐨� common 缁欎粛缁ф壙鐨�
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

              {/* 娓叉煋 layouts */}
              {unitLayouts.length > 0 && (
                <div className="space-y-4 mt-4">
                  {unitLayouts.map((layout, index) => (
                    <UnitLayoutForm
                      key={index}
                      index={index}
                      data={layout}
                      projectCategory={projectCategory}
                      projectSubType={projectSubType}
                      lockCategory={isBulkRentProject}
                      onChange={(updated, meta) => {
                        setUnitLayouts((prev) => {
                          const base = Array.isArray(prev) ? prev : [];
                          const next = [...base];

                          const prevLayout = base[index] || {};
                          const updatedLayout = { ...prevLayout, ...updated };

                          // 鍒濆鍖� inherit flag
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

                          const isCommonField =
                            !!meta?.commonField &&
                            Array.isArray(COMMON_KEYS) &&
                            COMMON_KEYS.includes(meta.commonField);

                          // 鉁� index>0锛氭敼浜� common锛堝洓涓瓧娈碉級鈫� 绔嬪埢鑴遍挬
                          if (enableProjectAutoCopy && index > 0) {
                            if (isCommonField) {
                              updatedLayout._inheritCommon = false;
                            } else {
                              // 鍏滃簳锛氬鏋滄煇浜涘湴鏂规病鏈変紶 meta锛屽氨鐢� hash 鍒ゆ柇
                              const prevH = commonHash(prevLayout);
                              const nextH = commonHash(updatedLayout);
                              if (prevH !== nextH) {
                                updatedLayout._inheritCommon = false;
                              }
                            }
                          }

                          next[index] = updatedLayout;

                          // 鉁� index==0锛氭敼浜� common 鈫� 鍚屾缁欎粛缁ф壙鐨� layout
                          if (enableProjectAutoCopy && index === 0) {
                            const shouldSync = isCommonField
                              ? true
                              : commonHash(prevLayout) !== commonHash(updatedLayout);

                            if (shouldSync) {
                              const common0 = pickCommon(updatedLayout);
                              for (let i = 1; i < next.length; i++) {
                                const li = next[i] || {};
                                if (li._inheritCommon === true) {
                                  next[i] = { ...li, ...cloneDeep(common0) };
                                }
                              }
                              // 璁╀笂闈㈢殑 effect 涓嶈閲嶅鍚屾
                              try {
                                lastCommonHashRef.current = commonHash(updatedLayout);
                              } catch {}
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
               闈為」鐩細鍗曚竴鎴挎簮 / 鎴块棿鍑虹閫昏緫
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
                  onChange={(nextData) =>
                    setSingleFormData((p) => ({ ...p, ...nextData }))
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

                  {/* BuildYear 鏉′欢淇濇寔 */}
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
                        label="棰勮浜や粯鏃堕棿"
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
                        label="瀹屾垚骞翠唤"
                      />
                    )}
                </>
              )}

              <div>
                <label className="block font-medium mb-1">鎴挎簮鎻忚堪</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="璇疯緭鍏ユ埧婧愯缁嗘弿杩�..."
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
        {loading ? "涓婁紶涓�..." : "鎻愪氦鎴挎簮"}
      </Button>
    </div>
  );
}
