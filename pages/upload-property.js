// pages/upload-property.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { useUser } from "@supabase/auth-helpers-react";

import TypeSelector from "@/components/TypeSelector";

// 你的表单组件（保持你原本）
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

// 地图地址输入（保持你原本）
const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), { ssr: false });

/* =========================
   工具函数（你原本）
========================= */
function safeJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function isNonEmpty(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function hasAnyValue(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => isNonEmpty(v));
}

function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

/* =========================
   ✅✅✅ 新增：只保留最后保存的表单，其它清空（增强：清 price_min/max + 年份字段）
========================= */
function buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }) {
  const out = {};

  // 只保留对应模式的表单列
  if (saleTypeNorm !== "homestay") {
    out.homestay_form = null;
  }
  if (saleTypeNorm !== "hotel/resort" && saleTypeNorm !== "hotel") {
    out.hotel_resort_form = null;
  }

  // 日历字段只给 Homestay/Hotel
  if (saleTypeNorm !== "homestay" && saleTypeNorm !== "hotel/resort" && saleTypeNorm !== "hotel") {
    out.availability = null;
    out.calendar_prices = null;
  }

  // Rent cleanup
  if (saleTypeNorm !== "rent") {
    out.room_rental_mode = null;
    out.roomRentalMode = null;
    out.rentBatchMode = null;
  } else {
    if (String(roomRentalMode || "").toLowerCase() === "room") {
      // room 模式下可清 whole 的字段（你原本逻辑）
    } else {
      // whole 模式下可清 room 的字段（你原本逻辑）
    }
  }

  // Sale/Rent 以外清空 Project 字段（避免污染）
  if (saleTypeNorm !== "sale") {
    out.projectCategory = null;
    out.projectSubType = null;
  }

  return out;
}

function buildCleanupPayloadByActiveForm(activeFormKey) {
  const out = {};

  // 最终规则：只保留最后保存的那个表单，其它都清空
  if (activeFormKey !== "homestay") out.homestay_form = null;
  if (activeFormKey !== "hotel") out.hotel_resort_form = null;

  if (activeFormKey !== "homestay" && activeFormKey !== "hotel") {
    out.availability = null;
    out.calendar_prices = null;
  }

  // Project 字段只给 New/Completed
  if (activeFormKey !== "sale_new_project" && activeFormKey !== "sale_completed_unit") {
    out.projectCategory = null;
    out.projectSubType = null;
  }

  // ✅ 价格 range 只给 New Project / Completed Unit：否则清掉，避免卡片用到旧数据
  if (activeFormKey !== "sale_new_project" && activeFormKey !== "sale_completed_unit") {
    out.price_min = null;
    out.price_max = null;
    out.priceMin = null;
    out.priceMax = null;
  }

  // ✅ 完成年份/预计完成年份：只在 Sale 对应模式才保留，否则清掉（避免从旧表单“串台”）
  if (activeFormKey !== "sale_new_project") {
    out.expected_year = null;
    out.expectedYear = null;
    out.expectedCompletedYear = null;
  }
  if (
    activeFormKey !== "sale_completed_unit" &&
    activeFormKey !== "sale_subsale" &&
    activeFormKey !== "sale_auction" &&
    activeFormKey !== "sale_rent_to_own"
  ) {
    out.built_year = null;
    out.completedYear = null;
    out.completed_year = null;
  }

  return out;
}

/* =========================
   ✅✅✅ 你原本的拆分函数（保留）
========================= */
function buildHomestayFormFromSingle(singleFormData) {
  const s = singleFormData || {};
  const out = {
    homestayType: s.homestayType ?? "",
    category: s.category ?? s.homestayCategory ?? s.propertyCategory ?? "",
    finalType: s.finalType ?? s.homestaySubType ?? s.subType ?? "",
    storeys: s.storeys ?? s.homestayStoreys ?? "",
    subtype: s.subtype ?? s.homestaySubtype ?? s.propertySubtype ?? [],
  };
  return hasAnyValue(out) ? out : null;
}

function buildHotelFormFromSingle(singleFormData) {
  const s = singleFormData || {};
  const out = {
    hotelResortType: s.hotelResortType ?? s.hotel_resort_type ?? "",
    roomLayouts: s.roomLayouts ?? s.room_layouts ?? null,
    facilityImages: s.facilityImages ?? s.facility_images ?? {},
    roomCount: s.roomCount ?? s.room_count ?? null,
  };
  return hasAnyValue(out) ? out : null;
}

/* =========================
   ✅ 价格同步：增强（同时写 price_min/price_max，避免卡片读到旧值）
========================= */
function pickPriceColumnsFromSingle(singleFormData) {
  const s = singleFormData || {};
  const out = {};

  // 兼容多种 key（你原本/历史版本）
  const price = s.price ?? s.salePrice ?? s.rentPrice ?? s.rent ?? s.rental ?? undefined;

  const priceMin = s.priceMin ?? s.price_min ?? s.minPrice ?? s.min_price ?? undefined;
  const priceMax = s.priceMax ?? s.price_max ?? s.maxPrice ?? s.max_price ?? undefined;

  if (price !== undefined) out.price = price;
  if (priceMin !== undefined) out.priceMin = priceMin;
  if (priceMax !== undefined) out.priceMax = priceMax;

  // ✅ 同步 snake_case（卖家后台卡片优先读 price_min/price_max）
  if (priceMin !== undefined) out.price_min = priceMin;
  if (priceMax !== undefined) out.price_max = priceMax;

  // ✅ 保留你原本可能还在写的字段
  if (s.rentPrice !== undefined) out.rentPrice = s.rentPrice;
  if (s.salePrice !== undefined) out.salePrice = s.salePrice;

  return out;
}

// ✅ 把完成年份/预计完成年份同步到顶层列（卖家后台卡片读取用）
function pickYearColumnsFromSingle(singleFormData, activeFormKey) {
  const s = singleFormData || {};
  const out = {};

  const completedYear =
    s.completedYear ?? s.completed_year ?? s.built_year ?? s.builtYear ?? s.completed ?? undefined;

  const expectedYear =
    s.expectedCompletedYear ?? s.expectedCompleted ?? s.expected_year ?? s.expectedYear ?? undefined;

  // 完成年份：Subsale/Auction/Rent-to-own/Completed Unit
  if (
    activeFormKey === "sale_completed_unit" ||
    activeFormKey === "sale_subsale" ||
    activeFormKey === "sale_auction" ||
    activeFormKey === "sale_rent_to_own"
  ) {
    if (completedYear !== undefined) {
      out.built_year = completedYear;
      out.completedYear = completedYear;
    } else {
      out.built_year = null;
      out.completedYear = null;
    }
  } else {
    out.built_year = null;
    out.completedYear = null;
  }

  // 预计完成年份：New Project
  if (activeFormKey === "sale_new_project") {
    if (expectedYear !== undefined) {
      out.expected_year = expectedYear;
      out.expectedCompletedYear = expectedYear;
    } else {
      out.expected_year = null;
      out.expectedCompletedYear = null;
    }
  } else {
    out.expected_year = null;
    out.expectedCompletedYear = null;
  }

  return out;
}

/* =========================
   页面
========================= */
export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const { edit, id } = router.query;
  const isEditMode = String(edit) === "1";
  const editId = id ? String(id) : "";

  // ===== 你原本的 state（保持）=====
  const [loading, setLoading] = useState(false);

  const [saleType, setSaleType] = useState("Sale");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [propertyUsage, setPropertyUsage] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [affordable, setAffordable] = useState("");
  const [affordableType, setAffordableType] = useState("");
  const [tenureType, setTenureType] = useState("");

  const [category, setCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertySubtypes, setPropertySubtypes] = useState([]);

  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [rentBatchMode, setRentBatchMode] = useState("no");

  const [layoutCount, setLayoutCount] = useState(1);
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [typeValue, setTypeValue] = useState("");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  const [typeForm, setTypeForm] = useState({});
  const [singleFormData, setSingleFormData] = useState({});
  const [addressObj, setAddressObj] = useState({});

  // ===== activeFormKey（你原本逻辑）=====
  const saleTypeNorm = String(saleType || "").trim().toLowerCase();
  const computedStatus = propertyStatus || typeForm?.propertyStatus || typeForm?.property_status || "";

  const getActiveFormKey = ({ saleTypeNorm, computedStatus, roomRentalMode }) => {
    if (saleTypeNorm === "sale") {
      const s = String(computedStatus || "").toLowerCase();
      if (s.includes("new project")) return "sale_new_project";
      if (s.includes("completed")) return "sale_completed_unit";
      if (s.includes("auction")) return "sale_auction";
      if (s.includes("rent-to-own")) return "sale_rent_to_own";
      return "sale_subsale";
    }
    if (saleTypeNorm === "rent") {
      return String(roomRentalMode || "").toLowerCase() === "room" ? "rent_room" : "rent_whole";
    }
    if (saleTypeNorm === "homestay") return "homestay";
    if (saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel" || saleTypeNorm === "hotelresort") return "hotel";
    return "unknown";
  };

  const activeFormKey = getActiveFormKey({ saleTypeNorm, computedStatus, roomRentalMode });

  // ===== 编辑读取（保持你原本）=====
  useEffect(() => {
    const fetchForEdit = async () => {
      if (!isEditMode || !editId || !user?.id) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        // 你原本回填逻辑（保持）
        const tf = safeJson(data?.type_form_v2) || safeJson(data?.typeForm) || safeJson(data?.type_form) || null;
        const sfd =
          safeJson(data?.single_form_data_v2) ||
          safeJson(data?.singleFormData) ||
          safeJson(data?.single_form_data) ||
          null;

        const address = {
          address: data?.address || "",
          lat: data?.lat,
          lng: data?.lng,
        };

        setTypeForm(tf || {});
        setSingleFormData(sfd || {});
        setAddressObj(address || {});

        // 你原本顶层 state 回填（保持）
        if (tf?.saleType) setSaleType(tf.saleType);
        if (tf?.propertyStatus) setPropertyStatus(tf.propertyStatus);
        if (tf?.propertyUsage) setPropertyUsage(tf.propertyUsage);
        if (tf?.propertyTitle) setPropertyTitle(tf.propertyTitle);
        if (tf?.affordable) setAffordable(tf.affordable);
        if (tf?.affordableType) setAffordableType(tf.affordableType);
        if (tf?.tenureType) setTenureType(tf.tenureType);

        if (tf?.category) setCategory(tf.category);
        if (tf?.subType) setSubType(tf.subType);
        if (tf?.storeys) setStoreys(tf.storeys);
        if (Array.isArray(tf?.propertySubtypes)) setPropertySubtypes(tf.propertySubtypes);

        if (tf?.roomRentalMode) setRoomRentalMode(tf.roomRentalMode);
        if (tf?.rentBatchMode) setRentBatchMode(tf.rentBatchMode);

        if (Array.isArray(safeJson(data?.unit_layouts) || data?.unit_layouts)) {
          setUnitLayouts(safeJson(data?.unit_layouts) || data?.unit_layouts);
        } else {
          setUnitLayouts([]);
        }

        if (data?.type) setTypeValue(data.type);

        // Project fields
        if (data?.projectCategory) setProjectCategory(data.projectCategory);
        if (data?.projectSubType) setProjectSubType(data.projectSubType);
      } catch (e) {
        console.error(e);
        toast.error("读取编辑数据失败（请看 Console）");
      } finally {
        setLoading(false);
      }
    };

    fetchForEdit();
  }, [isEditMode, editId, user?.id]);

  // ===== 保存（✅关键修复在这里：清空/同步顶层字段）=====
  const handleSubmit = useCallback(async () => {
    try {
      if (!user?.id) {
        toast.error("请先登录");
        return;
      }

      setLoading(true);

      // 你原本 cleaned（保持）
      const cleanedTypeForm = {
        ...typeForm,
        saleType,
        propertyStatus: computedStatus,
        propertyUsage,
        propertyTitle,
        affordable,
        affordableType,
        tenureType,
        category,
        subType,
        storeys,
        propertySubtypes,
        roomRentalMode,
        rentBatchMode,
      };

      const cleanedSingleFormData = singleFormData || {};

      // ✅✅✅ cleanup：只保留当前 activeFormKey 的数据
      const cleanup = {
        ...buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }),
        ...buildCleanupPayloadByActiveForm(activeFormKey),
      };

      // ✅✅✅ 只在对应模式才生成对应的 form column
      const homestay_form = activeFormKey === "homestay" ? buildHomestayFormFromSingle(cleanedSingleFormData) : null;
      const hotel_resort_form = activeFormKey === "hotel" ? buildHotelFormFromSingle(cleanedSingleFormData) : null;

      // ✅✅✅ 日历字段：只在 Homestay / Hotel 保存（否则强制清空）
      const availability =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.availability ?? cleanedSingleFormData?.availability_data ?? null
          : null;

      const calendar_prices =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.calendar_prices ?? cleanedSingleFormData?.calendarPrices ?? null
          : null;

      // ✅ 价格同步：确保卖家后台卡片价格永远显示最新（增强：避免覆盖 cleanup）
      const priceColsRaw = pickPriceColumnsFromSingle(cleanedSingleFormData);
      const priceCols = { ...(priceColsRaw || {}) };

      // ✅ 非 Project 不允许带 range 列，避免覆盖 cleanup 的 null
      if (activeFormKey !== "sale_new_project" && activeFormKey !== "sale_completed_unit") {
        delete priceCols.priceMin;
        delete priceCols.priceMax;
        delete priceCols.price_min;
        delete priceCols.price_max;
      }

      // ✅ 年份同步（完成年份/预计完成年份）到顶层列，卡片读的是 built_year/expected_year
      const yearCols = pickYearColumnsFromSingle(cleanedSingleFormData, activeFormKey);

      const payload = {
        ...cleanup,

        // ✅ 价格同步
        ...priceCols,

        // ✅ 年份同步（完成年份/预计完成年份）
        ...yearCols,

        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,
        listing_mode: activeFormKey,

        type: typeValue,

        type_form_v2: cleanedTypeForm || null,
        single_form_data_v2: cleanedSingleFormData || {},

        // 兼容列（你原本保留的，不动）
        typeForm: cleanedTypeForm || null,
        type_form: cleanedTypeForm || null,

        roomRentalMode,
        rentBatchMode,

        // ✅ Project fields（只在 New Project / Completed Unit 保存）
        projectCategory:
          activeFormKey === "sale_new_project" || activeFormKey === "sale_completed_unit" ? projectCategory : null,
        projectSubType:
          activeFormKey === "sale_new_project" || activeFormKey === "sale_completed_unit" ? projectSubType : null,

        // ✅ 表单列（只保留最终保存那个）
        homestay_form,
        hotel_resort_form,

        availability,
        calendar_prices,

        updated_at: new Date().toISOString(),
      };

      // ✅ insert / update（保留你之前那个“缺 column 自动删 key 重试”逻辑）
      let res;
      let lastError = null;

      const payloadToWrite = { ...payload };

      for (let attempt = 0; attempt < 6; attempt++) {
        if (isEditMode && editId) {
          res = await supabase
            .from("properties")
            .update(payloadToWrite)
            .eq("id", editId)
            .eq("user_id", user.id)
            .select("*");
        } else {
          res = await supabase.from("properties").insert(payloadToWrite).select("*");
        }

        const { error } = res || {};
        if (!error) {
          lastError = null;
          break;
        }

        lastError = error;

        const missing = extractMissingColumnName(error);
        if (missing) {
          if (Object.prototype.hasOwnProperty.call(payloadToWrite, missing)) {
            delete payloadToWrite[missing];
            continue;
          }

          const camelToSnake = missing.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
          const snakeToCamel = missing.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

          if (Object.prototype.hasOwnProperty.call(payloadToWrite, camelToSnake)) {
            delete payloadToWrite[camelToSnake];
            continue;
          }
          if (Object.prototype.hasOwnProperty.call(payloadToWrite, snakeToCamel)) {
            delete payloadToWrite[snakeToCamel];
            continue;
          }
        }

        break;
      }

      if (lastError) {
        const missing = extractMissingColumnName(lastError);
        if (missing) {
          toast.error("Supabase 缺少 column: " + missing);
          alert(
            "Supabase 缺少 column: " +
              missing +
              "\n\n我已经在代码里自动移除这个字段后重试。\n如果还提示，说明还有其它字段也缺。"
          );
        } else {
          toast.error("提交失败（请看 Console）");
          alert("提交失败（请看 Console 报错）");
        }
        throw lastError;
      }

      toast.success(isEditMode ? "保存修改成功" : "发布成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    isEditMode,
    editId,
    router,

    saleType,
    saleTypeNorm,
    computedStatus,

    typeForm,
    singleFormData,
    addressObj,

    propertyStatus,
    propertyUsage,
    propertyTitle,
    affordable,
    affordableType,
    tenureType,

    category,
    subType,
    storeys,
    propertySubtypes,

    roomRentalMode,
    rentBatchMode,

    activeFormKey,
    typeValue,

    projectCategory,
    projectSubType,
  ]);

  /* =========================
     UI（保持你原本：这里只做最简单示例，你项目里原本怎么写就照旧）
  ========================= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {isEditMode ? "保存修改" : "发布房源"}
        </button>
      </div>

      <TypeSelector
        saleType={saleType}
        setSaleType={setSaleType}
        propertyStatus={propertyStatus}
        setPropertyStatus={setPropertyStatus}
        propertyUsage={propertyUsage}
        setPropertyUsage={setPropertyUsage}
        propertyTitle={propertyTitle}
        setPropertyTitle={setPropertyTitle}
        affordable={affordable}
        setAffordable={setAffordable}
        affordableType={affordableType}
        setAffordableType={setAffordableType}
        tenureType={tenureType}
        setTenureType={setTenureType}
        category={category}
        setCategory={setCategory}
        subType={subType}
        setSubType={setSubType}
        storeys={storeys}
        setStoreys={setStoreys}
        propertySubtypes={propertySubtypes}
        setPropertySubtypes={setPropertySubtypes}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
        layoutCount={layoutCount}
        setLayoutCount={setLayoutCount}
        typeValue={typeValue}
        setTypeValue={setTypeValue}
        initialForm={typeForm}
      />

      {/* 地址 */}
      <div className="space-y-2">
        <div className="font-semibold">地址</div>
        <AddressSearchInput
          value={addressObj?.address || ""}
          onChange={(address, latLng) => {
            setAddressObj((prev) => ({
              ...(prev || {}),
              address,
              lat: latLng?.lat,
              lng: latLng?.lng,
            }));
          }}
        />
      </div>

      {/* 表单切换（保持你原本逻辑） */}
      {saleTypeNorm === "sale" && (
        <SaleUploadForm
          typeForm={typeForm}
          setTypeForm={setTypeForm}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          shouldShowProjectTrustSection={false}
        />
      )}

      {saleTypeNorm === "rent" && (
        <RentUploadForm
          typeForm={typeForm}
          setTypeForm={setTypeForm}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          roomRentalMode={roomRentalMode}
          rentBatchMode={rentBatchMode}
        />
      )}

      {saleTypeNorm === "homestay" && (
        <HomestayUploadForm
          typeForm={typeForm}
          setTypeForm={setTypeForm}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
        />
      )}

      {(saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel" || saleTypeNorm === "hotelresort") && (
        <HotelUploadForm
          typeForm={typeForm}
          setTypeForm={setTypeForm}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
        />
      )}
    </div>
  );
      }
     
