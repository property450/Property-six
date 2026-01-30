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

/** ✅✅✅ 新增：保存时按“当前模式”清空其它模式 column，避免混资料 */
function buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }) {
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");
  const isSale = saleTypeNorm === "sale";
  const isRent = saleTypeNorm === "rent";
  const isRentRoom = isRent && String(roomRentalMode || "").toLowerCase() === "room";

  const cleanup = {
    homestay_form: null,
    hotel_resort_form: null,
    availability: null,
    calendar_prices: null,

    homestay_type: null,
    hotel_resort_type: null,
    max_guests: null,
    bed_types: null,
    house_rules: null,
    check_in_out: null,
  };

  if (isHomestay || isHotel) return cleanup;
  if (isSale || isRent || isRentRoom) return cleanup;
  return cleanup;
}

/** ✅✅✅ 新增：写入 single_form_data_v2 前，按模式剔除“旧模式残留 key” */
function stripSingleFormDataByMode({ saleTypeNorm }, singleFormData) {
  const s = { ...(singleFormData || {}) };

  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const HOTEL_KEYS = [
    "hotelResortType",
    "hotel_resort_type",
    "roomLayouts",
    "room_layouts",
    "facilityImages",
    "facility_images",
    "roomCount",
    "room_count",
  ];

  const HOMESTAY_KEYS = [
    "homestayType",
    "homestayCategory",
    "homestaySubType",
    "homestayStoreys",
    "homestaySubtype",
    "propertyCategory",
    "subType",
    "propertySubtype",
  ];

  const CALENDAR_KEYS = ["availability", "availability_data", "calendar_prices", "calendarPrices"];

  if (!isHomestay && !isHotel) {
    [...HOTEL_KEYS, ...HOMESTAY_KEYS, ...CALENDAR_KEYS].forEach((k) => delete s[k]);
    return s;
  }

  if (isHomestay) {
    HOTEL_KEYS.forEach((k) => delete s[k]);
    return s;
  }

  if (isHotel) {
    HOMESTAY_KEYS.forEach((k) => delete s[k]);
    return s;
  }

  return s;
}

/** ✅✅✅ 最终规则：哪一个“表单”点保存，就只保留那个表单的数据（其它表单全部清空） */
function getActiveFormKey({ saleTypeNorm, computedStatus, roomRentalMode }) {
  const st = String(saleTypeNorm || "").toLowerCase();
  const status = String(computedStatus || "");
  const roomMode = String(roomRentalMode || "whole").toLowerCase();

  if (st.includes("homestay")) return "homestay";
  if (st.includes("hotel")) return "hotel";

  if (st === "rent") return roomMode === "room" ? "rent_room" : "rent_whole";

  if (st === "sale") {
    if (status === "New Project / Under Construction") return "sale_new_project";
    if (status === "Completed Unit / Developer Unit") return "sale_completed_unit";
    if (status === "Auction Property") return "sale_auction";
    if (status === "Rent-to-Own Scheme") return "sale_rent_to_own";
    return "sale_subsale";
  }

  return "unknown";
}

/** ✅✅✅ 清理 typeForm：严格只保留“当前表单”需要的字段，防止残留污染 */
function stripTypeFormByActiveForm(activeFormKey, typeForm) {
  const tf = { ...(typeForm || {}) };

  delete tf.finalType;
  delete tf.homestayType;
  delete tf.hotelResortType;
  delete tf.hotel_resort_type;

  if (activeFormKey === "homestay") {
    if (typeForm?.finalType) tf.finalType = typeForm.finalType;
    if (typeForm?.homestayType) tf.homestayType = typeForm.homestayType;
    return tf;
  }

  if (activeFormKey === "hotel") {
    if (typeForm?.finalType) tf.finalType = typeForm.finalType;
    if (typeForm?.hotelResortType) tf.hotelResortType = typeForm.hotelResortType;
    if (typeForm?.hotel_resort_type) tf.hotel_resort_type = typeForm.hotel_resort_type;
    return tf;
  }

  if (activeFormKey === "rent_whole") {
    delete tf.roomCount;
    delete tf.roomCountMode;
    delete tf.auctionDate;
    delete tf.layoutCount;
    return tf;
  }

  if (activeFormKey === "rent_room") {
    delete tf.rentBatchMode;
    delete tf.layoutCount;
    delete tf.auctionDate;
    return tf;
  }

  if (activeFormKey === "sale_new_project" || activeFormKey === "sale_completed_unit") {
    delete tf.auctionDate;
    delete tf.roomRentalMode;
    delete tf.roomCount;
    delete tf.roomCountMode;
    delete tf.rentBatchMode;
    return tf;
  }

  if (activeFormKey === "sale_auction") {
    delete tf.layoutCount;
    delete tf.roomRentalMode;
    delete tf.roomCount;
    delete tf.roomCountMode;
    delete tf.rentBatchMode;
    return tf;
  }

  if (activeFormKey === "sale_rent_to_own" || activeFormKey === "sale_subsale") {
    delete tf.auctionDate;
    delete tf.layoutCount;
    delete tf.roomRentalMode;
    delete tf.roomCount;
    delete tf.roomCountMode;
    delete tf.rentBatchMode;
    return tf;
  }

  return tf;
}

/** ✅✅✅ 清理 singleFormData：严格按当前表单清掉其它表单的 key */
function stripSingleFormDataByActiveForm(activeFormKey, singleFormData) {
  const s = { ...(singleFormData || {}) };

  const HOTEL_KEYS = [
    "hotelResortType",
    "hotel_resort_type",
    "roomLayouts",
    "room_layouts",
    "facilityImages",
    "facility_images",
    "roomCount",
    "room_count",
  ];

  const HOMESTAY_KEYS = ["homestayType", "homestayCategory", "homestaySubType", "homestayStoreys", "homestaySubtype"];

  const CALENDAR_KEYS = ["availability", "availability_data", "calendar_prices", "calendarPrices"];

  const COMMON_POLLUTE_KEYS = ["finalType"];

  const RENT_ROOM_KEYS = [
    "bedType",
    "bedTypes",
    "sharedBathroom",
    "bathroomType",
    "roomPrivacy",
    "genderMix",
    "allowPets",
    "allowCooking",
    "rentIncludes",
    "cleaningService",
    "preferredRace",
    "acceptedLeaseTerm",
    "availableFrom",
  ];

  const isStay = activeFormKey === "homestay" || activeFormKey === "hotel";
  const isRentRoom = activeFormKey === "rent_room";

  if (!isStay) {
    [...HOTEL_KEYS, ...HOMESTAY_KEYS, ...CALENDAR_KEYS, ...COMMON_POLLUTE_KEYS].forEach((k) => delete s[k]);
  } else {
    if (activeFormKey === "homestay") HOTEL_KEYS.forEach((k) => delete s[k]);
    if (activeFormKey === "hotel") HOMESTAY_KEYS.forEach((k) => delete s[k]);
  }

  if (!isRentRoom) {
    RENT_ROOM_KEYS.forEach((k) => delete s[k]);
  }

  return s;
}

/** ✅✅✅ 清理 column：让 DB 只保留当前表单需要的独立 column，其他一律 null / [] */
function buildCleanupPayloadByActiveForm(activeFormKey) {
  const base = {
    homestay_form: null,
    hotel_resort_form: null,
    availability: null,
    calendar_prices: null,

    homestay_type: null,
    hotel_resort_type: null,
    max_guests: null,
    bed_types: null,
    house_rules: null,
    check_in_out: null,
  };

  if (
    activeFormKey !== "sale_new_project" &&
    activeFormKey !== "sale_completed_unit" &&
    activeFormKey !== "rent_whole" &&
    activeFormKey !== "rent_room"
  ) {
    base.unitLayouts = [];
    base.unit_layouts = [];
  }

  return base;
}

/* =========================
   ✅✅✅ 新增：保存时把 singleFormData 里的价格同步写回 properties.price / price_min / price_max
========================= */
function parseRMNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const cleaned = s.replace(/rm/gi, "").replace(/,/g, "").trim();
  const m = cleaned.match(/-?\d+(\.\d+)?/);
  if (!m) return null;

  const num = Number(m[0]);
  return Number.isFinite(num) ? num : null;
}

function derivePriceColumnsFromSingle(singleFormData) {
  const s = singleFormData || {};

  // 单价（Subsale / Rent 常见）
  const direct =
    parseRMNumber(s.price) ??
    parseRMNumber(s.rent) ??
    parseRMNumber(s.rental) ??
    parseRMNumber(s.rentPrice);

  // 范围（New Project / Completed 常见）
  const min =
    parseRMNumber(s.priceMin) ??
    parseRMNumber(s.price_min) ??
    parseRMNumber(s.minPrice) ??
    parseRMNumber(s.min_price);

  const max =
    parseRMNumber(s.priceMax) ??
    parseRMNumber(s.price_max) ??
    parseRMNumber(s.maxPrice) ??
    parseRMNumber(s.max_price);

  const pd = s.priceData || s.pricedata || s.price_data;
  const pdMin = pd ? parseRMNumber(pd.min ?? pd.minPrice ?? pd.priceMin) : null;
  const pdMax = pd ? parseRMNumber(pd.max ?? pd.maxPrice ?? pd.priceMax) : null;

  const finalMin = min ?? pdMin;
  const finalMax = max ?? pdMax;

  // 有 range → 写 price_min/price_max；否则写 price
  if (finalMin !== null || finalMax !== null) {
    return { price: null, price_min: finalMin, price_max: finalMax };
  }
  return { price: direct, price_min: null, price_max: null };
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  const [editHydrated, setEditHydrated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [addressObj, setAddressObj] = useState(null);

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [typeForm, setTypeForm] = useState(null);

  const [typeSelectorInitialForm, setTypeSelectorInitialForm] = useState(null);

  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [description, setDescription] = useState("");

  const saleTypeNorm = String(saleType || "").toLowerCase();

  const isProject =
    saleTypeNorm === "sale" &&
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(computedStatus);

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

  const rawLayoutCount = Number(typeForm?.layoutCount);
  const batchLayoutCount = Math.max(2, Math.min(20, Number.isFinite(rawLayoutCount) ? rawLayoutCount : 2));

  const rawRoomCount = Number(typeForm?.roomCount);
  const roomLayoutCount =
    roomRentalMode === "room"
      ? typeForm?.roomCountMode === "multi"
        ? Math.max(2, Math.min(20, Number.isFinite(rawRoomCount) ? rawRoomCount : 2))
        : 1
      : 1;

  const lastFormJsonRef = useRef("");
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "" });

  const handleTypeFormChange = useCallback((form) => {
    const nextJson = stableJson(form);
    if (nextJson && nextJson === lastFormJsonRef.current) return;
    lastFormJsonRef.current = nextJson;

    setTypeForm((prev) => {
      const prevJson = stableJson(prev);
      if (prevJson === nextJson) return prev;
      return form || null;
    });

    const nextSale = form?.saleType || "";
    const nextStatus = form?.propertyStatus || "";
    const nextRoom = form?.roomRentalMode || "whole";

    const last = lastDerivedRef.current;
    if (last.saleType !== nextSale) setSaleType(nextSale);
    if (last.status !== nextStatus) setComputedStatus(nextStatus);
    if (last.roomMode !== nextRoom) setRoomRentalMode(nextRoom);

    lastDerivedRef.current = { saleType: nextSale, status: nextStatus, roomMode: nextRoom };
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setEditHydrated(true);
    } else {
      setEditHydrated(false);
    }
  }, [isEditMode, editId]);

  useEffect(() => {
    if (!isRentBatch) return;
    const n = batchLayoutCount;
    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: n }).map((_, i) => prevArr[i] || {});
    });
  }, [isRentBatch, batchLayoutCount]);

  useEffect(() => {
    if (saleTypeNorm !== "rent") return;
    if (roomRentalMode !== "room") return;
    if (isRentBatch) return;

    if (roomLayoutCount <= 1) {
      setUnitLayouts?.([]);
      return;
    }

    setUnitLayouts?.((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: roomLayoutCount }).map((_, i) => prevArr[i] || {});
    });
  }, [saleTypeNorm, roomRentalMode, isRentBatch, roomLayoutCount]);

  // ✅ 编辑模式：读取房源并回填（优先用 v2）
  useEffect(() => {
    if (!isEditMode) return;
    if (!user) return;
    if (!editId) return;

    const fetchForEdit = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("找不到该房源");
          alert("找不到该房源");
          setEditHydrated(true);
          return;
        }

        const tfRaw = pickPreferNonEmpty(
          data.type_form_v2,
          pickPreferNonEmpty(data.typeForm, data.type_form, null),
          null
        );
        const sfdRaw = pickPreferNonEmpty(
          data.single_form_data_v2,
          pickPreferNonEmpty(data.singleFormData, data.single_form_data, {}),
          {}
        );

        const tf = safeParseMaybeJson(tfRaw) || null;
        const sfdBase = safeParseMaybeJson(sfdRaw) || {};

        const sfd = mergeFormsIntoSingle(
          sfdBase,
          safeParseMaybeJson(data.homestay_form),
          safeParseMaybeJson(data.hotel_resort_form)
        );

        if (data.address) {
          setAddressObj({
            address: data.address,
            lat: data.lat ?? data.latitude ?? null,
            lng: data.lng ?? data.longitude ?? null,
          });
        }

        setTypeValue(data.type || "");
        setRentBatchMode(data.rentBatchMode || data.rent_batch_mode || "no");

        setTypeForm(tf);
        setTypeSelectorInitialForm(tf);

        setSingleFormData(sfd);

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

      // ✅✅✅ 1.1) ⭐ 关键：从 cleanedSingleFormData 推导顶层价格 column（解决卡片价格不更新）
      const priceColumns = derivePriceColumnsFromSingle(cleanedSingleFormData);

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
        (activeFormKey === "rent_room" && (typeForm?.roomCountMode === "multi" || Number(typeForm?.roomCount) > 1))
          ? unitLayouts
          : [];

      const payload = {
        ...cleanup,

        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        // ✅✅✅ ⭐ 关键：同步顶层价格 column，让卖家后台卡片立即显示最新价格
        price: priceColumns.price,
        price_min: priceColumns.price_min,
        price_max: priceColumns.price_max,

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

  if (isEditMode && !editHydrated) {
    return (
      <div className="p-6">
        <div className="text-gray-600">正在读取房源资料...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <div className="mb-4">
        <AddressSearchInput
          value={addressObj?.address || ""}
          onSelect={(res) => {
            setAddressObj(res);
          }}
        />
      </div>

      <div className="mb-4">
        <TypeSelector
          value={typeValue}
          onChange={setTypeValue}
          rentBatchMode={rentBatchMode}
          setRentBatchMode={setRentBatchMode}
          onFormChange={handleTypeFormChange}
          initialForm={typeSelectorInitialForm}
        />
      </div>

      {saleTypeNorm === "sale" && isProject && (
        <ProjectUploadForm
          computedStatus={computedStatus}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      {saleTypeNorm === "sale" && !isProject && (
        <SaleUploadForm
          computedStatus={computedStatus}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      {saleTypeNorm === "rent" && (
        <RentUploadForm
          rentBatchMode={rentBatchMode}
          roomRentalMode={roomRentalMode}
          computedStatus={computedStatus}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      {saleTypeNorm.includes("homestay") && (
        <HomestayUploadForm
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      {saleTypeNorm.includes("hotel") && (
        <HotelUploadForm
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      <div className="mt-6">
        <ListingTrustSection
          saleTypeNorm={saleTypeNorm}
          computedStatus={computedStatus}
          typeForm={typeForm}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "提交中..." : isEditMode ? "保存修改" : "提交"}
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
