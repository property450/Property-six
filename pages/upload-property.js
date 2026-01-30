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

const PROTECTED_KEYS = new Set([
  "typeForm",
  "type_form",
  "singleFormData",
  "single_form_data",
  "areaData",
  "area_data",
  "unitLayouts",
  "unit_layouts",
  "type_form_v2",
  "single_form_data_v2",
]);

const KEY_PAIRS = [
  ["typeForm", "type_form"],
  ["singleFormData", "single_form_data"],
  ["areaData", "area_data"],
  ["unitLayouts", "unit_layouts"],
];

function getCounterpartKey(k) {
  for (const [camel, snake] of KEY_PAIRS) {
    if (k === camel) return snake;
    if (k === snake) return camel;
  }
  return "";
}

function dropProtectedIfCounterpartExists(working, missing) {
  const other = getCounterpartKey(missing);
  if (!other) return false;
  if (!Object.prototype.hasOwnProperty.call(working, other)) return false;

  if (hasAnyValue(working[other])) {
    delete working[missing];
    return true;
  }
  return false;
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 10 }) {
  let working = { ...(payload || {}) };
  let tries = 0;
  const removed = [];

  while (tries < maxTries) {
    tries += 1;

    let res;
    if (mode === "update") {
      res = await supabase.from("properties").update(working).eq("id", editId).eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert([working]);
    }

    if (!res?.error) return { ok: true, removed, result: res };

    const err = res.error;
    console.error("[Supabase Error]", err);

    const missing = extractMissingColumnName(err);

    if (err?.code === "PGRST204" && missing) {
      if (PROTECTED_KEYS.has(missing)) {
        const dropped = dropProtectedIfCounterpartExists(working, missing);
        if (dropped) {
          removed.push(`${missing} (missing, kept counterpart)`);
          continue;
        }
        return { ok: false, removed, error: err, protectedMissing: missing };
      }

      if (!Object.prototype.hasOwnProperty.call(working, missing)) {
        return { ok: false, removed, error: err };
      }

      delete working[missing];
      removed.push(missing);
      continue;
    }

    return { ok: false, removed, error: err };
  }

  return { ok: false, removed, error: new Error("自动处理次数用尽（请看 Console 报错）") };
}

/** ✅ 把 singleFormData 里 Homestay/Hotel 相关字段拆出来，写入新 column（不影响你原本 single_form_data_v2） */
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

// ✅✅✅ 关键修复：把 homestay_form / hotel_resort_form 合并回 singleFormData 时，必须“空值也允许覆盖”
function mergeFormsIntoSingle(singleFormData, homestayForm, hotelForm) {
  const base = { ...(singleFormData || {}) };
  const h1 = homestayForm && typeof homestayForm === "object" ? homestayForm : null;
  const h2 = hotelForm && typeof hotelForm === "object" ? hotelForm : null;

  const isEmpty = (v) => {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") return v.trim() === "";
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.keys(v).length === 0;
    return false;
  };

  const fill = (key, val) => {
    if (val === undefined) return;
    if (isEmpty(base[key])) base[key] = val;
  };

  if (h1) {
    fill("homestayType", h1.homestayType ?? "");
    fill("category", h1.category ?? "");
    fill("finalType", h1.finalType ?? "");
    fill("storeys", h1.storeys ?? "");
    fill("subtype", Array.isArray(h1.subtype) ? h1.subtype : []);

    fill("homestayCategory", h1.category ?? "");
    fill("homestaySubType", h1.finalType ?? "");
    fill("homestayStoreys", h1.storeys ?? "");
    fill("homestaySubtype", Array.isArray(h1.subtype) ? h1.subtype : []);

    fill("propertyCategory", h1.category ?? "");
    fill("subType", h1.finalType ?? "");
    fill("propertySubtype", Array.isArray(h1.subtype) ? h1.subtype : []);
  }

  if (h2) {
    fill("hotelResortType", h2.hotelResortType ?? "");
    fill("roomLayouts", Array.isArray(h2.roomLayouts) ? h2.roomLayouts : null);
    fill("facilityImages", h2.facilityImages && typeof h2.facilityImages === "object" ? h2.facilityImages : {});
    fill("roomCount", h2.roomCount ?? null);

    fill("hotel_resort_type", h2.hotelResortType ?? "");
    fill("room_layouts", Array.isArray(h2.roomLayouts) ? h2.roomLayouts : null);
    fill("facility_images", h2.facilityImages && typeof h2.facilityImages === "object" ? h2.facilityImages : {});
    fill("room_count", h2.roomCount ?? null);
  }

  return base;
}

/* =========================
   ✅ 价格列同步（修复：卡片价格不跟着更新）
   - 统一把 “当前表单” 的价格写进：price / price_min / price_max
   - Homestay/Hotel：优先用日历 prices 的 min/max（如果有）
========================= */
function parseNumberLike(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  // 允许 "RM 50", "100,000"
  const n = Number(s.replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function getAvailabilityPricesMap(singleFormData) {
  const s = singleFormData || {};
  // 你的结构：roomLayouts[0].availability.prices 或顶层 availability.prices
  const layout0 = Array.isArray(s.roomLayouts)
    ? s.roomLayouts[0]
    : Array.isArray(s.room_layouts)
    ? s.room_layouts[0]
    : null;
  const map1 = layout0?.availability?.prices;
  const map2 = s?.availability?.prices;
  const map3 = s?.availability_data?.prices;
  return map1 && typeof map1 === "object"
    ? map1
    : map2 && typeof map2 === "object"
    ? map2
    : map3 && typeof map3 === "object"
    ? map3
    : null;
}

function derivePriceColumnsFromSingleForm(activeFormKey, singleFormData) {
  const s = singleFormData || {};

  // Homestay / Hotel：优先用日历价格 min/max
  if (activeFormKey === "homestay" || activeFormKey === "hotel") {
    const pricesMap = getAvailabilityPricesMap(s);
    if (pricesMap && typeof pricesMap === "object") {
      const nums = Object.values(pricesMap)
        .map(parseNumberLike)
        .filter((n) => typeof n === "number");
      if (nums.length) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        return { price: min, price_min: min, price_max: max };
      }
    }
    // fallback：用普通 price
    const p = parseNumberLike(s.price);
    return { price: p, price_min: p, price_max: p };
  }

  // Sale / Rent：优先取 range（如果你有）
  const minCand = parseNumberLike(s.price_min ?? s.priceMin ?? s.minPrice ?? s.min);
  const maxCand = parseNumberLike(s.price_max ?? s.priceMax ?? s.maxPrice ?? s.max);
  const single = parseNumberLike(s.price);

  if (minCand !== null || maxCand !== null) {
    const mn = minCand !== null ? minCand : maxCand;
    const mx = maxCand !== null ? maxCand : minCand;
    return { price: mn, price_min: mn, price_max: mx };
  }

  if (single !== null) return { price: single, price_min: single, price_max: single };

  // 没有价格：强制清空（避免旧价格残留）
  return { price: null, price_min: null, price_max: null };
}

/** ✅✅✅ 新增：保存时按“当前模式”清空其它模式 column，避免混资料 */
function buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }) {
  const empty = (mode) => ({
    homestay_form: null,
    hotel_resort_form: null,
    availability: null,
    calendar_prices: null,
    homestay_type: null,
    hotel_resort_type: null,
  });

  // 你表里也有这些列：homestay_form / hotel_resort_form / availability / calendar_prices
  // 所以我们会在 payload 里明确设置为 null（不是 undefined），确保旧值被清除
  if (saleTypeNorm === "sale") {
    return empty("sale");
  }
  if (saleTypeNorm === "rent") {
    return empty(roomRentalMode === "room" ? "rent_room" : "rent_whole");
  }
  if (saleTypeNorm === "homestay") {
    return {
      hotel_resort_form: null,
      hotel_resort_type: null,
    };
  }
  if (saleTypeNorm === "hotel") {
    return {
      homestay_form: null,
      homestay_type: null,
    };
  }
  return empty("unknown");
}

/** ✅✅✅ 新增：按“当前 activeFormKey”清空其它表单，避免混资料（最终规则：只保留最后保存的那个表单） */
function buildCleanupPayloadByActiveForm(activeFormKey) {
  const cleanup = {
    listing_mode: activeFormKey,

    // 其它模式的表单 column 都清空
    homestay_form: null,
    hotel_resort_form: null,
    availability: null,
    calendar_prices: null,
    homestay_type: null,
    hotel_resort_type: null,
  };

  if (activeFormKey === "homestay") {
    cleanup.homestay_form = undefined; // 让后面 payload 写入真实值
  }
  if (activeFormKey === "hotel") {
    cleanup.hotel_resort_form = undefined;
  }
  if (activeFormKey === "homestay" || activeFormKey === "hotel") {
    cleanup.availability = undefined;
    cleanup.calendar_prices = undefined;
  }

  return cleanup;
}

/** ✅✅✅ 新增：保存前按模式清理 singleFormData（粗清） */
function stripSingleFormDataByMode({ saleTypeNorm }, sfd) {
  const out = { ...(sfd || {}) };

  if (saleTypeNorm === "sale") {
    // sale：清掉 Homestay/Hotel 的关键字段，避免污染
    delete out.homestayType;
    delete out.hotelResortType;
    delete out.roomLayouts;
    delete out.room_layouts;
    delete out.availability;
    delete out.calendar_prices;
    delete out.check_in_out;
    delete out.house_rules;
  }

  if (saleTypeNorm === "rent") {
    // rent：也清 Homestay/Hotel
    delete out.homestayType;
    delete out.hotelResortType;
    delete out.roomLayouts;
    delete out.room_layouts;
    delete out.availability;
    delete out.calendar_prices;
  }

  if (saleTypeNorm === "homestay") {
    // homestay：清 hotelResortType
    delete out.hotelResortType;
    delete out.hotel_resort_type;
  }

  if (saleTypeNorm === "hotel") {
    // hotel：清 homestayType
    delete out.homestayType;
    delete out.homestay_type;
  }

  return out;
}

/** ✅✅✅ 新增：按 activeFormKey 彻底清理 singleFormData（细清：只留当前表单需要的东西） */
function stripSingleFormDataByActiveForm(activeFormKey, sfd) {
  const s = { ...(sfd || {}) };

  // 这里采用“白名单”思想：不同 activeFormKey 只保留核心字段，其它统统删掉
  // 注意：我不会动你 UI/选项，只在保存时做清理，避免混资料

  // 通用保留（基础字段）
  const keepCommon = new Set([
    "price",
    "price_min",
    "price_max",
    "title",
    "description",
    "address",
    "lat",
    "lng",
    "bedrooms",
    "bathrooms",
    "carparks",
    "kitchens",
    "livingRooms",
    "facing",
    "category",
    "subType",
    "storeys",
    "subtype",
    "propertyCategory",
    "propertySubtype",
    "transit",
    "completedYear",
    "expectedCompletedYear",
    "built_year",
    "buildYear",
    "areadata",
    "areaData",
    "area_data",
    "trustSection",
  ]);

  const keepSaleExtra = new Set([
    "usage",
    "tenure",
    "propertyTitle",
    "propertyStatus",
    "affordable",
    "affordableType",
    "auctionDate",
    "layoutCount",
    "roomCountMode",
    "roomCount",
  ]);

  const keepRentWholeExtra = new Set([
    "roomRentalMode",
    "rentBatchMode",
    "roomCountMode",
    "roomCount",
  ]);

  const keepRentRoomExtra = new Set([
    "roomRentalMode",
    "roomCountMode",
    "roomCount",
    // 下面这些你之后如果把 JSON key 给我，我再逐个对齐补完整显示/保存
    "bedType",
    "bathroomSharing",
    "roomType",
    "genderMix",
    "allowPets",
    "allowCooking",
    "rentIncludes",
    "cleaningService",
    "preferredRace",
    "leaseTerm",
    "availableFrom",
  ]);

  const keepHomestayExtra = new Set([
    "homestayType",
    "roomLayouts",
    "room_layouts",
    "availability",
    "calendar_prices",
    "check_in_out",
    "house_rules",
    "facilityImages",
    "facility_images",
    "maxGuests",
  ]);

  const keepHotelExtra = new Set([
    "hotelResortType",
    "hotel_resort_type",
    "roomLayouts",
    "room_layouts",
    "availability",
    "calendar_prices",
    "check_in_out",
    "house_rules",
    "facilityImages",
    "facility_images",
    "maxGuests",
  ]);

  let allow = new Set([...keepCommon]);

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

  const [addressObj, setAddressObj] = useState(null);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;

  const [editHydrated, setEditHydrated] = useState(false);

  // ===== 你的原本逻辑（这里我尽量不改） =====
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
        const sfd =
          safeParseMaybeJson(pickPreferNonEmpty(data.single_form_data_v2, data.singleFormData, {})) || {};

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

      // ✅✅✅ ✅ 关键：把“当前表单”价格同步到顶层列（修复卡片价格不更新）
      const priceCols = derivePriceColumnsFromSingleForm(activeFormKey, cleanedSingleFormData);

      const payload = {
        ...cleanup,

        // ✅ 价格同步：确保卖家后台卡片价格永远显示最新
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

        unitLayouts: effectiveUnitLayouts,
        unit_layouts: effectiveUnitLayouts,

        singleFormData: cleanedSingleFormData || {},
        single_form_data: cleanedSingleFormData || {},

        areaData,
        area_data: areaData,

        description,
        updated_at: new Date().toISOString(),

        homestay_form,
        hotel_resort_form,

        availability,
        calendar_prices,
      };

      if (isEditMode) {
        const out = await runWithAutoStripColumns({
          mode: "update",
          payload,
          editId,
          userId: user.id,
          maxTries: 10,
        });

        if (!out.ok) {
          if (out.protectedMissing) {
            toast.error(`保存失败：Supabase 缺少关键 column：${out.protectedMissing}`);
            alert(
              `保存失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
                `✅ 你必须先在 Supabase SQL Editor 加上：type_form_v2 和 single_form_data_v2（jsonb）。\n\n` +
                `（请看 Console 的 [Supabase Error]）`
            );
            return;
          }

          const missing = extractMissingColumnName(out.error);
          if (missing) {
            toast.error(`提交失败：Supabase 缺少 column：${missing}`);
            alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
          } else {
            toast.error("提交失败（请看 Console 报错）");
            alert("提交失败（请看 Console 报错）");
          }
          return;
        }

        if (out.removed?.length) console.log("[Save] Removed columns:", out.removed);

        toast.success("保存修改成功");
        alert("保存修改成功");
        router.push("/my-profile");
        return;
      }

      const out = await runWithAutoStripColumns({
        mode: "insert",
        payload: { ...payload, created_at: new Date().toISOString() },
        userId: user.id,
        maxTries: 10,
      });

      if (!out.ok) {
        if (out.protectedMissing) {
          toast.error(`提交失败：Supabase 缺少关键 column：${out.protectedMissing}`);
          alert(
            `提交失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
              `✅ 你必须先在 Supabase SQL Editor 加上：type_form_v2 和 single_form_data_v2（jsonb）。\n\n` +
              `（请看 Console 的 [Supabase Error]）`
          );
          return;
        }

        const missing = extractMissingColumnName(out.error);
        if (missing) {
          toast.error(`提交失败：Supabase 缺少 column：${missing}`);
          alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
        } else {
          toast.error("提交失败（请看 Console 报错）");
          alert("提交失败（请看 Console 报错）");
        }
        return;
      }

      toast.success("提交成功");
      alert("提交成功");
      router.push("/");
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

    if (!confirm("确定要删除该房源吗？")) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("删除成功");
      alert("删除成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
    }
  };

  // ✅✅✅ 编辑模式：等数据回填完成才显示表单（防止闪烁）
  if (isEditMode && !editHydrated) {
    return (
      <div className="p-6">
        <div className="text-gray-600">正在读取房源资料...</div>
      </div>
    );
  }

  // ===== 下面 render 结构保持你原本（不改 UI / 不改文字）=====
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="text-2xl font-bold mb-4">{isEditMode ? "编辑房源" : "上传房源"}</div>

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

      <div className="mt-4">
        <AddressSearchInput value={addressObj?.address || ""} onSelect={setAddressObj} />
      </div>

      {/* 下面按你原本的选择渲染不同表单（保持不动） */}
      <div className="mt-6">
        {saleTypeNorm === "sale" && (
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
        )}

        {saleTypeNorm === "rent" && (
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
        )}

        {saleTypeNorm === "homestay" && (
          <HomestayUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
          />
        )}

        {(saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel") && (
          <HotelUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
          />
        )}
      </div>

      {/* Trust Section */}
      <div className="mt-6">
        <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />
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
