// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

/* =========================
   工具函数
========================= */
function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true; // number/boolean
}

function toText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "是" : "否";
  if (Array.isArray(v)) return v.filter(isNonEmpty).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return "RM " + n.toLocaleString("en-MY");
}

function safeJsonParse(v) {
  if (!isNonEmpty(v)) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch (e) {
    return null;
  }
}

/**
 * 深层取值：支持
 * - key1.key2
 * - key1[0].key2
 */
function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * ✅ 关键：把 property 里可能存数据的 JSON 字段“全部合并”
 * 这样你不管把表单数据存在哪个 JSON column，都能在 my-profile 读到
 */
function mergePropertyData(raw) {
  const p = raw || {};

  // 你项目里很常出现的 JSON 字段名（猜测+兼容）
  const jsonCandidates = [
    "details",
    "detail",
    "data",
    "meta",
    "extra",
    "extra_data",
    "form_data",
    "formData",
    "sale_data",
    "saleData",
    "rent_data",
    "rentData",
    "room_rental_data",
    "roomRentalData",
    "homestay_data",
    "homestayData",
    "hotel_data",
    "hotelData",
    "availability",
    "availability_data",
    "calendar",
    "dayPrices",
    "datePrices",
    "unit_layouts",
    "unitLayouts",
  ];

  const merged = { ...p };

  // 1) 合并顶层 JSON 字段
  for (const k of jsonCandidates) {
    const parsed = safeJsonParse(p?.[k]);
    if (parsed && typeof parsed === "object") {
      // 注意：不要覆盖顶层已有值，优先保留顶层
      for (const key of Object.keys(parsed)) {
        if (!isNonEmpty(merged[key])) merged[key] = parsed[key];
      }
      // 也挂一份在 merged.__json
      merged.__json = merged.__json || {};
      merged.__json[k] = parsed;
    }
  }

  // 2) 如果 unit_layouts 是数组，顺便把 layout[0] 的字段也提升到 merged（很多选择在 layout 里）
  let ul = p?.unit_layouts ?? p?.unitLayouts ?? merged?.unit_layouts ?? merged?.unitLayouts;
  ul = safeJsonParse(ul) ?? ul;
  if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") {
    merged.__layout0 = ul[0];
    for (const key of Object.keys(ul[0])) {
      if (!isNonEmpty(merged[key])) merged[key] = ul[0][key];
    }
  }

  return merged;
}

// 多 key / 多 path 取值（顶层 + JSON + layout0）
function pickAny(obj, candidates) {
  for (const c of candidates) {
    // 支持 path
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

// 交通 Yes/No（兼容放在 transit / layout0.transit / json.transit）
function getTransitYesNo(p) {
  const v =
    pickAny(p, [
      "transit",
      "transit_info",
      "transitData",
      "transit_data",
      "__layout0.transit",
      "__layout0.transitData",
      "__layout0.transit_info",
      "__json.details.transit",
      "__json.form_data.transit",
    ]) || "";

  if (typeof v === "boolean") return v ? "是" : "否";
  if (typeof v === "string") return v;

  if (v && typeof v === "object") {
    const ans =
      v.walkableToTransit ??
      v.walkable ??
      v.isWalkable ??
      v.hasTransit ??
      v.answer ??
      v.yesNo ??
      v.value;
    if (typeof ans === "boolean") return ans ? "是" : "否";
    if (typeof ans === "string") return ans;
  }

  return "";
}

// 日历价格概览（只显示范围/天数，避免你日历闪烁逻辑）
function getCalendarPriceSummary(p) {
  const raw =
    pickAny(p, [
      "availability",
      "availability_data",
      "calendar",
      "dayPrices",
      "datePrices",
      "__json.form_data.availability",
      "__json.details.availability",
      "__json.meta.availability",
    ]) || null;

  if (!raw) return "";

  let data = safeJsonParse(raw) ?? raw;

  let pricesMap = null;
  let list = null;

  if (data?.pricesByDate && typeof data.pricesByDate === "object") pricesMap = data.pricesByDate;
  else if (data?.dayPrices && Array.isArray(data.dayPrices)) list = data.dayPrices;
  else if (data?.prices && typeof data.prices === "object") pricesMap = data.prices;
  else if (typeof data === "object" && !Array.isArray(data)) pricesMap = data;

  let prices = [];

  if (pricesMap) {
    for (const k of Object.keys(pricesMap)) {
      const n = Number(pricesMap[k]);
      if (!Number.isNaN(n)) prices.push(n);
    }
    if (!prices.length) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const days = prices.length;
    if (min === max) return `日历价格：${money(min)}（${days}天）`;
    return `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
  }

  if (list) {
    for (const it of list) {
      const n = Number(it?.price);
      if (!Number.isNaN(n)) prices.push(n);
    }
    if (!prices.length) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const days = prices.length;
    if (min === max) return `日历价格：${money(min)}（${days}天）`;
    return `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
  }

  return "";
}

function MetaLine({ label, value }) {
  if (!isNonEmpty(value)) return null;
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-800">{toText(value)}</span>
    </div>
  );
}

/* =========================
   卡片组件
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  // ✅ 合并数据：顶层 + JSON + layout0
  const property = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);

  // 基础：标题/地点/价格/卧室浴室车位
  const title = pickAny(property, ["title", "name", "propertyTitleText", "property_title_text"]);
  const locationText = pickAny(property, ["location", "address", "city", "area", "state", "full_address"]);
  const price = pickAny(property, ["price", "rent", "amount", "base_price"]);

  const bedrooms = pickAny(property, ["bedrooms", "bedroom_count", "roomCount", "room_count"]);
  const bathrooms = pickAny(property, ["bathrooms", "bathroom_count"]);
  const carparks = pickAny(property, ["carparks", "carpark_count", "parking_count"]);

  // 你提到 Studio 要显示 Studio（如果你存的是 "Studio" 就不会变 1）
  const bedroomLabel = isNonEmpty(bedrooms) ? toText(bedrooms) : "";

  // 模式
  const saleType = pickAny(property, ["saleType", "sale_type", "type", "listing_type"]);
  const roomRentalMode = pickAny(property, ["roomRentalMode", "room_rental_mode", "isRoomRental", "is_room_rental"]);
  const isRentRoom =
    saleType === "Rent" &&
    (roomRentalMode === "room" || roomRentalMode === "Room" || roomRentalMode === true);

  // 你要的字段（尽量多路径兼容）
  // Sale 通用
  const propertyUsage = pickAny(property, ["usage", "property_usage"]);
  const propertyTitle = pickAny(property, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(property, ["propertyStatus", "property_status", "saleStatus", "sale_status"]);
  const saleTypeDetail = pickAny(property, ["saleTypeDetail", "sale_type_detail", "sale_type_name"]);

  const affordableHousing = pickAny(property, ["affordableHousing", "affordable_housing"]);
  const affordableHousingType = pickAny(property, ["affordableHousingType", "affordable_housing_type"]);
  const tenureType = pickAny(property, ["tenureType", "tenure_type", "tenure"]);

  const category = pickAny(property, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(property, ["subType", "sub_type", "property_sub_type"]);
  const storeys = pickAny(property, ["storeys", "storey", "floor_count"]);
  const propertySubtype = pickAny(property, ["propertySubtype", "property_subtype"]); // Penthouse/Duplex...

  const buildUpArea = pickAny(property, ["buildUpArea", "build_up_area", "built_up_area"]);
  const landArea = pickAny(property, ["landArea", "land_area"]);
  const psf = pickAny(property, ["psf", "price_per_sqft"]);

  const transitYesNo = getTransitYesNo(property);
  const completedYear = pickAny(property, ["completedYear", "completed_year", "completion_year"]);
  const expectedYear = pickAny(property, ["expectedCompletedYear", "expected_completed_year", "expected_completion_year"]);

  // Rent 房间模式字段
  const roomType = pickAny(property, ["roomType", "room_type"]);
  const bathroomSharing = pickAny(property, ["bathroomSharing", "bathroom_sharing"]);
  const bedType = pickAny(property, ["bedType", "bed_type", "bedTypes", "bed_types"]);
  const roomPrivacy = pickAny(property, ["roomPrivacy", "room_privacy"]);
  const genderMix = pickAny(property, ["genderMix", "gender_mix"]);
  const allowPets = pickAny(property, ["allowPets", "allow_pets", "petsAllowed", "pets_allowed"]);
  const allowCooking = pickAny(property, ["allowCooking", "allow_cooking", "cookingAllowed", "cooking_allowed"]);
  const rentIncludes = pickAny(property, ["rentIncludes", "rent_includes"]);
  const cleaningService = pickAny(property, ["cleaningService", "cleaning_service"]);
  const preferredRace = pickAny(property, ["preferredRace", "preferred_race", "racePreference", "race_preference"]);
  const acceptedTenure = pickAny(property, ["acceptedTenure", "accepted_tenure", "leaseTerm", "lease_term"]);
  const availableFrom = pickAny(property, ["availableFrom", "available_from", "move_in_date"]);

  // Homestay / Hotel
  const homestayType = pickAny(property, ["homestayType", "homestay_type"]);
  const hotelResortType = pickAny(property, ["hotelResortType", "hotel_resort_type"]);

  const guestCount = pickAny(property, ["guestCount", "guest_count", "capacity", "guest_capacity"]);
  const smokingAllowed = pickAny(property, ["smokingAllowed", "smoking_allowed"]);
  const checkinService = pickAny(property, ["checkinService", "checkin_service"]);
  const breakfastIncluded = pickAny(property, ["breakfastIncluded", "breakfast_included"]);
  const freeCancellation = pickAny(property, ["freeCancellation", "free_cancellation"]);

  const serviceFee = pickAny(property, ["serviceFee", "service_fee"]);
  const cleaningFee = pickAny(property, ["cleaningFee", "cleaning_fee"]);
  const deposit = pickAny(property, ["deposit", "security_deposit"]);
  const otherFees = pickAny(property, ["otherFees", "other_fees", "extra_fees"]);

  const calendarSummary = getCalendarPriceSummary(property);

  const showSale = saleType === "Sale";
  const showRent = saleType === "Rent";
  const showHomestay = saleType === "Homestay";
  const showHotel = saleType === "Hotel/Resort" || saleType === "Hotel" || saleType === "Resort";

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-gray-900 truncate">
            {title || "（未命名房源）"}
          </div>

          {isNonEmpty(locationText) && (
            <div className="text-sm text-gray-600 mt-1 truncate">{locationText}</div>
          )}

          {isNonEmpty(price) && (
            <div className="text-base font-semibold text-blue-700 mt-2">{money(price)}</div>
          )}

          <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {isNonEmpty(bedroomLabel) && <span>🛏 {bedroomLabel}</span>}
            {isNonEmpty(bathrooms) && <span>🛁 {toText(bathrooms)}</span>}
            {isNonEmpty(carparks) && <span>🚗 {toText(carparks)}</span>}
          </div>

          {/* 你要的：有值才显示 */}
          <div className="mt-3 space-y-1">
            {/* SALE */}
            {showSale && (
              <>
                <MetaLine label="Sale / Rent" value={saleType} />
                <MetaLine label="Property Usage" value={propertyUsage} />
                <MetaLine label="Property Title" value={propertyTitle} />
                <MetaLine label="Property Status / Sale Type" value={propertyStatus || saleTypeDetail} />
                <MetaLine label="Affordable Housing" value={affordableHousing} />
                <MetaLine label="Affordable Housing Type" value={affordableHousingType} />
                <MetaLine label="Tenure Type" value={tenureType} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="Sub Type" value={subType} />
                <MetaLine label="Storeys" value={storeys} />
                <MetaLine label="Property Subtype" value={propertySubtype} />
                <MetaLine label="Build Up Area" value={buildUpArea} />
                <MetaLine label="Land Area" value={landArea} />
                <MetaLine label="PSF" value={psf} />
                <MetaLine label="你的产业步行能到达公共交通吗？" value={transitYesNo} />
                <MetaLine label="完成年份" value={completedYear} />
                <MetaLine label="预计完成年份" value={expectedYear} />
              </>
            )}

            {/* RENT（整间） */}
            {showRent && !isRentRoom && (
              <>
                <MetaLine label="Sale / Rent" value={saleType} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="Storeys" value={storeys} />
                <MetaLine label="Property Subtype" value={propertySubtype} />
                <MetaLine label="房间数量" value={bedrooms} />
                <MetaLine label="浴室数量" value={bathrooms} />
                <MetaLine label="停车位数量" value={carparks} />
                <MetaLine label="Build Up Area" value={buildUpArea} />
                <MetaLine label="Land Area" value={landArea} />
                <MetaLine label="PSF" value={psf} />
                <MetaLine label="你的产业步行能到达公共交通吗？" value={transitYesNo} />
              </>
            )}

            {/* RENT（出租房间） */}
            {showRent && isRentRoom && (
              <>
                <MetaLine label="租金" value={price} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="Storeys" value={storeys} />
                <MetaLine label="Property Subtype" value={propertySubtype} />
                <MetaLine label="Build Up Area" value={buildUpArea} />
                <MetaLine label="Land Area" value={landArea} />
                <MetaLine label="PSF" value={psf} />
                <MetaLine label="这是什么房？" value={roomType} />
                <MetaLine label="卫生间共用/独立" value={bathroomSharing} />
                <MetaLine label="床型" value={bedType} />
                <MetaLine label="独立/共用房间" value={roomPrivacy} />
                <MetaLine label="是否男女混住" value={genderMix} />
                <MetaLine label="是否允许宠物" value={allowPets} />
                <MetaLine label="是否允许烹饪" value={allowCooking} />
                <MetaLine label="租金包括" value={rentIncludes} />
                <MetaLine label="清洁服务" value={cleaningService} />
                <MetaLine label="停车位数量" value={carparks} />
                <MetaLine label="偏向的种族" value={preferredRace} />
                <MetaLine label="接受的租期" value={acceptedTenure} />
                <MetaLine label="几时开始可以入住" value={availableFrom} />
                <MetaLine label="你的产业步行能到达公共交通吗？" value={transitYesNo} />
              </>
            )}

            {/* HOMESTAY */}
            {showHomestay && (
              <>
                <MetaLine label="Homestay Type" value={homestayType} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="床型" value={bedType} />
                <MetaLine label="能住几个人" value={guestCount} />
                <MetaLine label="室内能否吸烟" value={smokingAllowed} />
                <MetaLine label="入住服务" value={checkinService} />
                <MetaLine label="房型是否包含早餐" value={breakfastIncluded} />
                <MetaLine label="房型是否允许宠物入住" value={allowPets} />
                <MetaLine label="是否能免费取消" value={freeCancellation} />
                <MetaLine label="卧室数量" value={bedrooms} />
                <MetaLine label="浴室数量" value={bathrooms} />
                <MetaLine label="停车位数量" value={carparks} />
                <MetaLine label="日历价格" value={calendarSummary} />
                <MetaLine label="房型的服务费" value={isNonEmpty(serviceFee) ? money(serviceFee) : ""} />
                <MetaLine label="房型的清洁费" value={isNonEmpty(cleaningFee) ? money(cleaningFee) : ""} />
                <MetaLine label="房型的押金" value={isNonEmpty(deposit) ? money(deposit) : ""} />
                <MetaLine label="房型的其它费用" value={otherFees} />
              </>
            )}

            {/* HOTEL / RESORT */}
            {showHotel && (
              <>
                <MetaLine label="Hotel/Resort Type" value={hotelResortType} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="床型" value={bedType} />
                <MetaLine label="能住几个人" value={guestCount} />
                <MetaLine label="室内能否吸烟" value={smokingAllowed} />
                <MetaLine label="入住服务" value={checkinService} />
                <MetaLine label="房型是否包含早餐" value={breakfastIncluded} />
                <MetaLine label="房型是否允许宠物入住" value={allowPets} />
                <MetaLine label="是否能免费取消" value={freeCancellation} />
                <MetaLine label="卧室数量" value={bedrooms} />
                <MetaLine label="浴室数量" value={bathrooms} />
                <MetaLine label="停车位数量" value={carparks} />
                <MetaLine label="日历价格" value={calendarSummary} />
                <MetaLine label="房型的服务费" value={isNonEmpty(serviceFee) ? money(serviceFee) : ""} />
                <MetaLine label="房型的清洁费" value={isNonEmpty(cleaningFee) ? money(cleaningFee) : ""} />
                <MetaLine label="房型的押金" value={isNonEmpty(deposit) ? money(deposit) : ""} />
                <MetaLine label="房型的其它费用" value={otherFees} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 底部 123 顺序不动 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onView(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          删除
        </button>
      </div>
    </div>
  );
}

/* =========================
   页面：恢复你原本的统计/搜索/排序
========================= */
export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

  // ✅ 恢复：搜索 + 排序
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest"); // latest | oldest | priceHigh | priceLow

  const fetchMyProperties = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchMyProperties error:", error);
      toast.error(error.message || "加载失败");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onView = (p) => router.push(`/property/${p.id}`);
  const onEdit = (p) => router.push(`/upload-property?edit=1&id=${p.id}`);

  const onDelete = async (p) => {
    if (!confirm("确定要删除这个房源吗？")) return;

    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) {
      console.error("delete error:", error);
      toast.error(error.message || "删除失败");
      return;
    }
    toast.success("已删除");
    fetchMyProperties();
  };

  // ✅ 统计：房源数量（总数/已发布/草稿/最近更新）
  const stats = useMemo(() => {
    const total = properties.length;

    // 兼容你可能用的字段名：published/is_published/status
    const published = properties.filter((p) => {
      const v = p?.is_published ?? p?.published ?? p?.status;
      if (typeof v === "boolean") return v === true;
      if (typeof v === "string") return v.toLowerCase().includes("publish");
      return false;
    }).length;

    const draft = total - published;

    // 最近更新时间（如果你有 updated_at，没有就用 created_at）
    const latestTime = properties
      .map((p) => p?.updated_at || p?.created_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];

    return { total, published, draft, latestTime };
  }, [properties]);

  // ✅ 前端过滤 + 排序
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();

    let list = properties;

    if (k) {
      list = list.filter((p) => {
        const merged = mergePropertyData(p);
        const title = pickAny(merged, ["title", "name", "propertyTitleText", "property_title_text"]);
        const loc = pickAny(merged, ["location", "address", "city", "area", "state", "full_address"]);
        return (
          String(title || "").toLowerCase().includes(k) ||
          String(loc || "").toLowerCase().includes(k)
        );
      });
    }

    const getPriceNum = (p) => {
      const merged = mergePropertyData(p);
      const v = pickAny(merged, ["price", "rent", "amount", "base_price"]);
      const n = Number(String(v).replace(/,/g, ""));
      return Number.isNaN(n) ? 0 : n;
    };

    if (sortKey === "latest") {
      list = [...list].sort((a, b) => {
        const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return tb - ta;
      });
    } else if (sortKey === "oldest") {
      list = [...list].sort((a, b) => {
        const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return ta - tb;
      });
    } else if (sortKey === "priceHigh") {
      list = [...list].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    } else if (sortKey === "priceLow") {
      list = [...list].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    }

    return list;
  }, [properties, keyword, sortKey]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold text-gray-900">我的房源（卖家后台）</div>

      {/* ✅ 恢复你原本的：房源数量 & 搜索 & 排序 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">房源总数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">已发布</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.published}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">草稿</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.draft}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">最近更新时间</div>
          <div className="text-sm text-gray-900 mt-2">
            {stats.latestTime ? String(stats.latestTime) : "-"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <div className="md:col-span-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入标题或地点..."
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-1">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="latest">最新优先</option>
            <option value="oldest">最旧优先</option>
            <option value="priceHigh">价格：高到低</option>
            <option value="priceLow">价格：低到高</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">没有符合条件的房源。</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <SellerPropertyCard
                key={p.id}
                rawProperty={p}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
