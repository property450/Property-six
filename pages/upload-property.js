// pages/upload-property.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import ListingTrustSection from "@/components/trust/ListingTrustSection";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

const pickCommon = (l) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit ?? null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

function isJsonLikeString(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function safeParseMaybeJson(v) {
  if (v == null) return v;
  if (typeof v === "string" && isJsonLikeString(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function stableJson(obj) {
  const seen = new WeakSet();

  const sortDeep = (v) => {
    if (v === null || v === undefined) return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortDeep);

    if (typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);
      const out = {};
      Object.keys(v)
        .sort()
        .forEach((k) => {
          const val = v[k];
          if (val === undefined) return;
          if (typeof val === "function") return;
          out[k] = sortDeep(val);
        });
      return out;
    }
    return v;
  };

  try {
    return JSON.stringify(sortDeep(obj ?? null));
  } catch {
    return "";
  }
}

// ✅ 判断“有没有内容”（避免 {} 抢优先级）
function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

// ✅ 从多个候选里选“非空”的
function pickPreferNonEmpty(a, b, fallback) {
  if (hasAnyValue(a)) return a;
  if (hasAnyValue(b)) return b;
  return fallback;
}

function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

/* =========================
   ✅✅✅ 下面这些是你这份(31)里本来就有的工具函数（保持）
========================= */

// ✅：把拆出去的 homestay_form/hotel_resort_form 合并回 singleFormData
function mergeFormsIntoSingle(single, homestayFormRaw, hotelFormRaw) {
  const s = { ...(single || {}) };

  const homestayForm = safeParseMaybeJson(homestayFormRaw);
  const hotelForm = safeParseMaybeJson(hotelFormRaw);

  if (homestayForm && typeof homestayForm === "object") {
    s.homestay_form = homestayForm;
    // 也把常用 key 直接合并回顶层（按你旧表单习惯）
    for (const k of Object.keys(homestayForm)) {
      if (s[k] === undefined) s[k] = homestayForm[k];
    }
  }

  if (hotelForm && typeof hotelForm === "object") {
    s.hotel_resort_form = hotelForm;
    for (const k of Object.keys(hotelForm)) {
      if (s[k] === undefined) s[k] = hotelForm[k];
    }
  }

  return s;
}

// ✅✅✅：从 singleFormData 生成 homestay_form
function buildHomestayFormFromSingle(single) {
  const s = single || {};
  const out = {};

  // 你表单常用字段（尽量宽松收集）
  const keys = [
    "availability",
    "availability_data",
    "calendar_prices",
    "calendarPrices",
    "checkInTime",
    "checkOutTime",
    "minNights",
    "maxGuests",
    "petsAllowed",
    "houseRules",
    "cleaningFee",
    "securityDeposit",
    "extraCharges",
    "parkingInfo",
    "wifiInfo",
  ];

  for (const k of keys) {
    if (s[k] !== undefined) out[k] = s[k];
  }

  // 兜底：如果你之前有把整块存在 homestay_form
  if (s.homestay_form && typeof s.homestay_form === "object") {
    Object.assign(out, s.homestay_form);
  }

  return out;
}

// ✅✅✅：从 singleFormData 生成 hotel_resort_form
function buildHotelFormFromSingle(single) {
  const s = single || {};
  const out = {};

  const keys = [
    "availability",
    "availability_data",
    "calendar_prices",
    "calendarPrices",
    "checkInTime",
    "checkOutTime",
    "petsAllowed",
    "hotelRules",
    "frontDeskHours",
    "breakfastIncluded",
    "parkingInfo",
    "wifiInfo",
    "amenities",
  ];

  for (const k of keys) {
    if (s[k] !== undefined) out[k] = s[k];
  }

  if (s.hotel_resort_form && typeof s.hotel_resort_form === "object") {
    Object.assign(out, s.hotel_resort_form);
  }

  return out;
}

/** ✅✅✅ 保存前：按模式清理 singleFormData（你原本有） */
function stripSingleFormDataByMode({ saleTypeNorm }, singleFormData) {
  const s = { ...(singleFormData || {}) };

  if (saleTypeNorm !== "homestay") {
    delete s.availability;
    delete s.availability_data;
    delete s.calendar_prices;
    delete s.calendarPrices;
    delete s.checkInTime;
    delete s.checkOutTime;
  }
  if (saleTypeNorm !== "hotel/resort" && saleTypeNorm !== "hotel") {
    // hotel 特有（按你旧逻辑宽松）
    delete s.hotelRules;
    delete s.frontDeskHours;
    delete s.breakfastIncluded;
  }

  return s;
}

/** ✅✅✅ 保存前：按 activeFormKey 彻底清理 singleFormData（你原本有） */
function stripSingleFormDataByActiveForm(activeFormKey, singleFormData) {
  const s = { ...(singleFormData || {}) };

  // 这里是你(31)里原本的 allowlist/清理逻辑（保持它原来的结构）
  const base = new Set([
    "trustSection",
    "title",
    "price",
    "priceMin",
    "priceMax",
    "bedrooms",
    "bathrooms",
    "carparks",
    "storeys",
    "category",
    "subType",
    "subtype",
    "propertyTitle",
    "usage",
    "tenure",
    "affordable",
    "affordableType",
    "completionYear",
    "completionQuarter",
    "nearTransit",
    "transit",
    "images",
    "layoutImages",
    "outsideImages",
    "description",
    "notes",
    "psf",
    "psfValue",
    "area",
    "buildUp",
    "landArea",
    "areaData",
    "roomRental",
    "roomRentalMode",
    "roomCountMode",
    "roomCount",
    "rentBatchMode",
    "layoutCount",
  ]);

  const keepSaleExtra = new Set([
    "saleType",
    "propertyStatus",
    "auctionDate",
    "propertyUsage",
    "propertyStatusLabel",
  ]);
  const keepRentWholeExtra = new Set(["rentPrice", "rentDeposit", "rentTerm"]);
  const keepRentRoomExtra = new Set(["roomPrice", "roomDeposit", "roomTerm"]);

  const keepHomestayExtra = new Set([
    "availability",
    "availability_data",
    "calendar_prices",
    "calendarPrices",
    "checkInTime",
    "checkOutTime",
    "minNights",
    "maxGuests",
    "petsAllowed",
    "houseRules",
    "cleaningFee",
    "securityDeposit",
    "extraCharges",
    "parkingInfo",
    "wifiInfo",
    "homestay_form",
  ]);

  const keepHotelExtra = new Set([
    "availability",
    "availability_data",
    "calendar_prices",
    "calendarPrices",
    "checkInTime",
    "checkOutTime",
    "petsAllowed",
    "hotelRules",
    "frontDeskHours",
    "breakfastIncluded",
    "parkingInfo",
    "wifiInfo",
    "amenities",
    "hotel_resort_form",
  ]);

  let allow = new Set([...base]);

  if (
    activeFormKey === "sale_new_project" ||
    activeFormKey === "sale_completed_unit" ||
    activeFormKey === "sale_subsale" ||
    activeFormKey === "sale_auction" ||
    activeFormKey === "sale_rent_to_own"
  ) {
    allow = new Set([...allow, ...keepSaleExtra]);
  }

  if (activeFormKey === "rent_whole") {
    allow = new Set([...allow, ...keepRentWholeExtra]);
  }

  if (activeFormKey === "rent_room") {
    allow = new Set([...allow, ...keepRentRoomExtra]);
  }

  if (activeFormKey === "homestay") {
    allow = new Set([...allow, ...keepHomestayExtra]);
  }

  if (activeFormKey === "hotel") {
    allow = new Set([...allow, ...keepHotelExtra]);
  }

  for (const k of Object.keys(s)) {
    if (!allow.has(k)) delete s[k];
  }

  return s;
}

/** ✅✅✅ 新增：按 activeFormKey 彻底清理 typeForm（特别是 finalType 污染） */
function stripTypeFormByActiveForm(activeFormKey, typeForm) {
  const tf = { ...(typeForm || {}) };

  // 你给我的例子：type_form_v2 里面有 finalType:"Hotel / Resort"
  // 但你最后保存的是 Sale Subsale，所以必须清掉 finalType 这种会导致 my-profile 判断错误的字段

  if (activeFormKey.startsWith("sale_") || activeFormKey.startsWith("rent_")) {
    delete tf.finalType;
    delete tf.hotelResortType;
    delete tf.homestayType;
  }

  if (activeFormKey === "homestay") {
    delete tf.hotelResortType;
  }
  if (activeFormKey === "hotel") {
    delete tf.homestayType;
  }

  return tf;
}

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

  // Rent room/whole cleanup（按你原本思路）
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

  return out;
}

// ✅ 价格同步：尽量统一你表里可能用到的列名
function pickPriceColumnsFromSingle(singleFormData) {
  const s = singleFormData || {};

  const out = {};

  // 统一覆盖：price / priceMin / priceMax / rentPrice
  if (s.price !== undefined) out.price = s.price;
  if (s.priceMin !== undefined) out.priceMin = s.priceMin;
  if (s.priceMax !== undefined) out.priceMax = s.priceMax;

  if (s.rentPrice !== undefined) out.rentPrice = s.rentPrice;

  // 你原本可能还有其它 price key
  if (s.salePrice !== undefined) out.salePrice = s.salePrice;

  return out;
}

/* =========================
   下面开始是你原本的 state / effect / render（我不动 UI/文字）
========================= */

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [saleType, setSaleType] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // rent only
  const [rentBatchMode, setRentBatchMode] = useState("no"); // rent only

  const [typeForm, setTypeForm] = useState({});
  const [typeSelectorInitialForm, setTypeSelectorInitialForm] = useState({});

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [unitLayouts, setUnitLayouts] = useState([]);

  // ✅ Project only (New Project / Completed Unit)
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  const [addressObj, setAddressObj] = useState(null);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;

  const [editHydrated, setEditHydrated] = useState(false);

  // ===== 你的原本逻辑（这里我尽量不改） =====
  const saleTypeNorm = String(saleType || "").trim().toLowerCase();

  const computedStatus = propertyStatus || typeForm?.propertyStatus || typeForm?.property_status || "";

  const isHomestay = saleTypeNorm === "homestay";
  const isHotel = saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel" || saleTypeNorm === "hotelresort";
  const isProject =
    saleTypeNorm === "sale" &&
    (String(computedStatus || "").toLowerCase().includes("new project") ||
      String(computedStatus || "").toLowerCase().includes("completed"));

  const shouldShowProjectTrustSection = isProject && Array.isArray(unitLayouts) && unitLayouts.length > 0;

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

  // ===== 编辑读取回填 =====
  useEffect(() => {
    const fetchForEdit = async () => {
      if (!isEditMode || !editId || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        const tf = safeParseMaybeJson(pickPreferNonEmpty(data.type_form_v2, data.typeForm, {})) || {};
        const sfd = safeParseMaybeJson(pickPreferNonEmpty(data.single_form_data_v2, data.singleFormData, {})) || {};

        // ✅ 把拆出去的 homestay_form/hotel_resort_form 合并回 singleFormData（避免回填丢）
        const mergedSingle = mergeFormsIntoSingle(sfd, data.homestay_form, data.hotel_resort_form);

        setSaleType(data.saleType || data.sale_type || "");
        setPropertyStatus(data.propertyStatus || data.property_status || data.propertystatus || "");
        setRoomRentalMode(data.roomRentalMode || data.room_rental_mode || data.roomrentalmode || "whole");

        if (data.address || data.lat || data.lng || data.latitude || data.longitude) {
          setAddressObj({
            address: data.address || "",
            lat: data.lat ?? data.latitude ?? null,
            lng: data.lng ?? data.longitude ?? null,
          });
        }

        setTypeValue(data.type || "");
        setRentBatchMode(data.rentBatchMode || data.rent_batch_mode || "no");

        setTypeForm(tf);
        setTypeSelectorInitialForm(tf);

        setSingleFormData(mergedSingle);

        setAreaData(
          safeParseMaybeJson(
            pickPreferNonEmpty(data.areaData, data.area_data, {
              types: ["buildUp"],
              units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
              values: { buildUp: "", land: "" },
            })
          )
        );

        const ul = safeParseMaybeJson(pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []));
        setUnitLayouts(Array.isArray(ul) ? ul : []);

        // ✅ Project fields 回填（如果有）
        if (typeof data.projectCategory === "string") setProjectCategory(data.projectCategory);
        if (typeof data.projectSubType === "string") setProjectSubType(data.projectSubType);

        setDescription(data.description || "");

        setEditHydrated(true);
      } catch (e) {
        console.error(e);
        toast.error("读取房源失败");
        alert("读取房源失败（请看 Console 报错）");
        setEditHydrated(true);
      }
    };

    fetchForEdit();
  }, [isEditMode, editId, user]);

  const mustLogin = !user;
  const mustPickSaleType = !saleType;
  const mustPickAddress = !addressObj?.lat || !addressObj?.lng;

  const handleSubmit = async () => {
    if (mustLogin) {
      toast.error("请先登录");
      alert("请先登录（你现在 user 还是 null）");
      return;
    }
    if (mustPickSaleType) {
      toast.error("请选择 Sale / Rent / Homestay / Hotel");
      alert("请选择 Sale / Rent / Homestay / Hotel（你现在 saleType 还是空）");
      return;
    }
    if (mustPickAddress) {
      toast.error("请选择地址");
      alert("请选择地址（你现在 lat/lng 还是空）");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const activeFormKey = getActiveFormKey({ saleTypeNorm, computedStatus, roomRentalMode });

      // ✅✅✅ 1) 保存前：严格按“当前表单”清理 singleFormData（其它表单 key 全删掉）
      const cleanedSingleFormData = stripSingleFormDataByActiveForm(
        activeFormKey,
        stripSingleFormDataByMode({ saleTypeNorm }, singleFormData || {})
      );

      // ✅✅✅ 1.5) 保存前：严格按“当前表单”清理 typeForm（尤其是 finalType=Hotel/Resort 这种污染）
      const cleanedTypeForm = stripTypeFormByActiveForm(activeFormKey, typeForm || {});

      // ✅✅✅ 2) 保存前：清空其它表单 column（最终规则：只保留最后保存的那个表单）
      const cleanup = {
        ...buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }),
        ...buildCleanupPayloadByActiveForm(activeFormKey),
      };

      // ✅✅✅ 3) 只在对应模式才生成对应的 form column
      const homestay_form = activeFormKey === "homestay" ? buildHomestayFormFromSingle(cleanedSingleFormData) : null;
      const hotel_resort_form = activeFormKey === "hotel" ? buildHotelFormFromSingle(cleanedSingleFormData) : null;

      // ✅✅✅ 4) 日历字段：只在 Homestay / Hotel 保存（否则强制清空）
      const availability =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.availability ?? cleanedSingleFormData?.availability_data ?? null
          : null;

      const calendar_prices =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.calendar_prices ?? cleanedSingleFormData?.calendarPrices ?? null
          : null;

      const effectiveUnitLayouts =
        activeFormKey === "sale_new_project" ||
        activeFormKey === "sale_completed_unit" ||
        (activeFormKey === "rent_whole" && rentBatchMode === "yes") ||
        (activeFormKey === "rent_room" &&
          (typeForm?.roomCountMode === "multi" || Number(typeForm?.roomCount) > 1))
          ? unitLayouts
          : [];

      // ✅ 价格同步：确保卖家后台卡片价格永远显示最新
      const priceCols = pickPriceColumnsFromSingle(cleanedSingleFormData);

      const payload = {
        ...cleanup,

        // ✅ 价格同步
        ...priceCols,

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

        unitLayouts: effectiveUnitLayouts,
        unit_layouts: effectiveUnitLayouts,

        singleFormData: cleanedSingleFormData || {},
        single_form_data: cleanedSingleFormData || {},

        areaData,
        area_data: areaData,

        description,

        homestay_form,
        hotel_resort_form,
        availability,
        calendar_prices,

        updated_at: new Date().toISOString(),
      };

      // ✅ insert / update（最小修复：遇到缺少 column 就自动删掉该字段并重试，不影响你原本逻辑）
let res;
let lastError = null;

// 用副本，不动你原本 payload
const payloadToWrite = { ...payload };

// 最多重试 6 次：每次删掉一个 Supabase 报缺少的 column
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
    // ✅ Supabase 报哪个 column 不存在，就从 payload 顶层删哪个 key，然后继续重试
    if (Object.prototype.hasOwnProperty.call(payloadToWrite, missing)) {
      delete payloadToWrite[missing];
      continue;
    }

    // ✅ 兼容：有时同一个字段你会同时写 camelCase & snake_case
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

  // 不是 “缺少 column” 的错误就不重试
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
    toast.error("提交失败");
    alert("提交失败（请看 Console 报错）");
  }
  throw lastError;
}


      toast.success(isEditMode ? "保存成功" : "提交成功");
      alert(isEditMode ? "保存成功" : "提交成功");

      if (isEditMode) {
        router.push("/my-profile");
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error(e);
      toast.error("提交失败");
      alert("提交失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error("请先登录");
      alert("请先登录");
      return;
    }
    if (!isEditMode) return;

    const ok = confirm("确定要删除这个房源吗？此操作不可恢复。");
    if (!ok) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("房源已删除");
      alert("房源已删除");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTypeFormChange = useCallback((patch) => {
    setTypeForm((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <AddressSearchInput value={addressObj} onChange={setAddressObj} />

      {/* ✅✅✅ 关键修复：TypeSelector 必须绑定父层 saleType/propertyStatus/roomRentalMode/rentBatchMode */}
      <TypeSelector
        saleType={saleType}
        setSaleType={setSaleType}
        typeValue={typeValue}
        setTypeValue={setTypeValue}
        propertyStatus={propertyStatus}
        setPropertyStatus={setPropertyStatus}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        initialForm={typeSelectorInitialForm}
      />

      {/* 下面按你原本的选择渲染不同表单（保持不动） */}
      <div className="mt-6">
        {(!isEditMode || editHydrated) &&
          (isHomestay ? (
            <HomestayUploadForm
              typeForm={typeForm}
              setTypeForm={setTypeForm}
              singleFormData={singleFormData}
              setSingleFormData={setSingleFormData}
              areaData={areaData}
              setAreaData={setAreaData}
            />
          ) : isHotel ? (
            <HotelUploadForm
              typeForm={typeForm}
              setTypeForm={setTypeForm}
              singleFormData={singleFormData}
              setSingleFormData={setSingleFormData}
              areaData={areaData}
              setAreaData={setAreaData}
            />
          ) : isProject ? (
            <>
              <ProjectUploadForm
                saleType={saleType}
                computedStatus={computedStatus}
                isBulkRentProject={false}
                projectCategory={projectCategory}
                setProjectCategory={setProjectCategory}
                projectSubType={projectSubType}
                setProjectSubType={setProjectSubType}
                unitLayouts={unitLayouts}
                setUnitLayouts={setUnitLayouts}
                enableProjectAutoCopy={computedStatus === "New Project / Under Construction"}
                pickCommon={pickCommon}
                commonHash={commonHash}
              />

              {/* ✅ Project 才显示一次 Trust Section（避免 Sale/Rent 重复） */}
              {shouldShowProjectTrustSection && (
                <ListingTrustSection
                  mode={computedStatus === "New Project / Under Construction" ? "new_project" : "completed_unit"}
                  value={singleFormData?.trustSection || {}}
                  onChange={(next) => setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))}
                />
              )}
            </>
          ) : saleTypeNorm === "rent" ? (
            <RentUploadForm
              typeForm={typeForm}
              setTypeForm={setTypeForm}
              singleFormData={singleFormData}
              setSingleFormData={setSingleFormData}
              areaData={areaData}
              setAreaData={setAreaData}
              unitLayouts={unitLayouts}
              setUnitLayouts={setUnitLayouts}
              roomRentalMode={roomRentalMode}
              rentBatchMode={rentBatchMode}
            />
          ) : saleTypeNorm === "sale" ? (
            <SaleUploadForm
              typeForm={typeForm}
              setTypeForm={setTypeForm}
              singleFormData={singleFormData}
              setSingleFormData={setSingleFormData}
              areaData={areaData}
              setAreaData={setAreaData}
              unitLayouts={unitLayouts}
              setUnitLayouts={setUnitLayouts}
              rentBatchMode={rentBatchMode}
            />
          ) : null)}
      </div>

      <div className="mt-6 flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting}>
          {isEditMode ? "保存修改" : "提交"}
        </Button>

        {isEditMode && (
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
            删除
          </Button>
        )}
      </div>
    </div>
  );
}
