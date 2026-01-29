// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

/* =========================
   helpers
========================= */
function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
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
function safeJson(v) {
  if (!isNonEmpty(v)) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function pickAny(obj, candidates) {
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

/**
 * ✅ 针对你这张表：把这些 JSON 列合并（优先顶层 column，不覆盖）
 */
function mergePropertyData(raw) {
  const p = raw || {};
  const merged = { ...p };

  const jsonCols = [
    "type_form_v2",
    "type_form",
    "typeform",
    "typeForm",
    "single_form_data_v2",
    "single_form_data",
    "singleFormData",
    "singleFormData",
    "homestay_form",
    "hotel_resort_form",
    "availability",
    "calendar_prices",
    "unit_layouts",
    "unitlayouts",
    "unitLayouts",
    "unitlayouts",
    "pricedata",
    "priceData",
    "areadata",
    "areaData",
    "area_data",
    "areaData",
    "facilities",
    "furniture",
    "extraspaces",
    "property_subtypes",
    "bed_types",
    "house_rules",
    "check_in_out",
    "type_form_v2",
  ];

  merged.__json = {};

  for (const k of jsonCols) {
    const parsed = safeJson(p?.[k]);
    if (parsed && typeof parsed === "object") {
      merged.__json[k] = parsed;
      for (const key of Object.keys(parsed)) {
        if (!isNonEmpty(merged[key])) merged[key] = parsed[key];
      }
    }
  }

  // layout0 提升（很多 New Project 信息在 layout 里面）
  let ul = p?.unit_layouts ?? p?.unitLayouts ?? p?.unitlayouts;
  ul = safeJson(ul) ?? ul;
  if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") {
    merged.__layout0 = ul[0];
    for (const key of Object.keys(ul[0])) {
      if (!isNonEmpty(merged[key])) merged[key] = ul[0][key];
    }
  }

  return merged;
}

function getTransitYesNo(p) {
  const v = pickAny(p, [
    // 顶层可能就有
    "transit",
    "transitData",
    "transit_info",
    // JSON 内可能有
    "__json.single_form_data_v2.transit",
    "__json.single_form_data.transit",
    "__json.type_form_v2.transit",
    "__json.homestay_form.transit",
    "__json.hotel_resort_form.transit",
    // layout0 内可能有
    "__layout0.transit",
    "__layout0.transitData",
    "__layout0.transit_info",
  ]);

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

function getCalendarPriceSummary(p) {
  const raw = pickAny(p, ["calendar_prices", "availability", "__json.calendar_prices", "__json.availability"]);
  if (!raw) return "";
  const data = safeJson(raw) ?? raw;

  // 兼容 map / list
  let prices = [];
  if (Array.isArray(data)) {
    for (const it of data) {
      const n = Number(it?.price ?? it?.value ?? it);
      if (!Number.isNaN(n)) prices.push(n);
    }
  } else if (data && typeof data === "object") {
    // map: { "2026-01-01": 200, ... }
    for (const k of Object.keys(data)) {
      const n = Number(data[k]);
      if (!Number.isNaN(n)) prices.push(n);
    }
    // 某些结构：{pricesByDate:{...}}
    if (!prices.length && data.pricesByDate && typeof data.pricesByDate === "object") {
      for (const k of Object.keys(data.pricesByDate)) {
        const n = Number(data.pricesByDate[k]);
        if (!Number.isNaN(n)) prices.push(n);
      }
    }
    // 某些结构：{dayPrices:[...]}
    if (!prices.length && Array.isArray(data.dayPrices)) {
      for (const it of data.dayPrices) {
        const n = Number(it?.price);
        if (!Number.isNaN(n)) prices.push(n);
      }
    }
  }

  if (!prices.length) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const days = prices.length;
  if (min === max) return `日历价格：${money(min)}（${days}天）`;
  return `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
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
   Card
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const p = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);

  // 基础
  const title = pickAny(p, ["title"]);
  const address = pickAny(p, ["address"]);
  const price = pickAny(p, ["price", "price_min", "price_max"]); // 这里仍显示 price，如果你是 range 我也会显示出值
  const bedrooms = pickAny(p, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickAny(p, ["bathrooms", "bathroom_count"]);
  const carparks = pickAny(p, ["carparks", "carpark", "parking_count"]);

  // 模式（你表里有很多版本：saleType / saletype / sale_type / listing_mode）
  const saleType = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const roomRentalMode = pickAny(p, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);
  const isRentRoom = (saleType === "Rent" || saleType === "rent") && (roomRentalMode === "room" || roomRentalMode === true);

  // Sale 你要显示的一堆
  const propertyUsage = pickAny(p, ["property_usage", "usage"]);
  const propertyTitle = pickAny(p, ["property_title"]);
  const propertyStatus = pickAny(p, ["property_status", "propertyStatus", "propertystatus"]);
  const saleTypeDetail = propertyStatus; // 你表就是 property_status 代表 Subsale/...
  const affordableHousing = pickAny(p, ["affordable_housing"]);
  const affordableHousingType = pickAny(p, ["affordable_housing_type"]);
  const tenureType = pickAny(p, ["tenure_type", "tenure"]);
  const category = pickAny(p, ["property_category"]);
  const subType = pickAny(p, ["property_sub_type", "sub_type"]);
  const storeys = pickAny(p, ["storeys"]);
  const propertySubtype = pickAny(p, ["property_subtype", "property_subtypes"]);

  const buildUpArea = pickAny(p, ["__json.area_data.buildUp", "__json.areaData.buildUp", "area"]); // 兼容
  const landArea = pickAny(p, ["__json.area_data.land", "__json.areaData.land"]);
  const psf = pickAny(p, ["psf", "__json.single_form_data_v2.psf", "__json.type_form_v2.psf"]);

  const transitYesNo = getTransitYesNo(p);
  const builtYear = pickAny(p, ["built_year"]);
  const expectedYear = pickAny(p, ["__json.single_form_data_v2.expectedCompletedYear", "__json.type_form_v2.expectedCompletedYear"]);

  // Rent 房间模式字段：你表里多数会放在 single_form_data_v2 或 type_form_v2
  const roomType = pickAny(p, ["__json.single_form_data_v2.roomType", "__json.type_form_v2.roomType"]);
  const bathroomSharing = pickAny(p, ["__json.single_form_data_v2.bathroomSharing", "__json.type_form_v2.bathroomSharing"]);
  const bedTypes = pickAny(p, ["bed_types", "__json.single_form_data_v2.bedTypes", "__json.homestay_form.bedTypes", "__json.hotel_resort_form.bedTypes"]);
  const roomPrivacy = pickAny(p, ["__json.single_form_data_v2.roomPrivacy", "__json.type_form_v2.roomPrivacy"]);
  const genderMix = pickAny(p, ["__json.single_form_data_v2.genderMix", "__json.type_form_v2.genderMix"]);
  const allowPets = pickAny(p, ["__json.single_form_data_v2.allowPets", "__json.type_form_v2.allowPets"]);
  const allowCooking = pickAny(p, ["__json.single_form_data_v2.allowCooking", "__json.type_form_v2.allowCooking"]);
  const rentIncludes = pickAny(p, ["__json.single_form_data_v2.rentIncludes", "__json.type_form_v2.rentIncludes"]);
  const cleaningService = pickAny(p, ["__json.single_form_data_v2.cleaningService", "__json.type_form_v2.cleaningService"]);
  const preferredRace = pickAny(p, ["__json.single_form_data_v2.preferredRace", "__json.type_form_v2.preferredRace"]);
  const acceptedTenure = pickAny(p, ["__json.single_form_data_v2.acceptedTenure", "__json.type_form_v2.acceptedTenure"]);
  const availableFrom = pickAny(p, ["__json.single_form_data_v2.availableFrom", "__json.type_form_v2.availableFrom"]);

  // Homestay / Hotel（你表里已经有很多顶层 column）
  const homestayType = pickAny(p, ["homestay_type"]);
  const hotelResortType = pickAny(p, ["hotel_resort_type"]);
  const maxGuests = pickAny(p, ["max_guests"]);
  const smokingAllowed = pickAny(p, ["__json.homestay_form.smokingAllowed", "__json.hotel_resort_form.smokingAllowed"]);
  const checkinService = pickAny(p, ["__json.homestay_form.checkinService", "__json.hotel_resort_form.checkinService"]);
  const breakfastIncluded = pickAny(p, ["__json.homestay_form.breakfastIncluded", "__json.hotel_resort_form.breakfastIncluded"]);
  const freeCancellation = pickAny(p, ["__json.homestay_form.freeCancellation", "__json.hotel_resort_form.freeCancellation"]);

  const serviceFee = pickAny(p, ["__json.homestay_form.serviceFee", "__json.hotel_resort_form.serviceFee"]);
  const cleaningFee = pickAny(p, ["__json.homestay_form.cleaningFee", "__json.hotel_resort_form.cleaningFee"]);
  const deposit = pickAny(p, ["__json.homestay_form.deposit", "__json.hotel_resort_form.deposit"]);
  const otherFees = pickAny(p, ["__json.homestay_form.otherFees", "__json.hotel_resort_form.otherFees"]);

  const calendarSummary = getCalendarPriceSummary(p);

  const showSale = saleType === "Sale" || saleType === "sale";
  const showRent = saleType === "Rent" || saleType === "rent";
  const showHomestay = saleType === "Homestay" || saleType === "homestay";
  const showHotel = saleType === "Hotel/Resort" || saleType === "hotel/resort" || saleType === "hotel";

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
        {isNonEmpty(address) && <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>}

        {/* 价格：如果有 range 也显示 */}
        {isNonEmpty(rawProperty?.price_min) || isNonEmpty(rawProperty?.price_max) ? (
          <div className="text-base font-semibold text-blue-700 mt-2">
            {money(rawProperty?.price_min)} {rawProperty?.price_max ? `~ ${money(rawProperty?.price_max)}` : ""}
          </div>
        ) : (
          isNonEmpty(price) && <div className="text-base font-semibold text-blue-700 mt-2">{money(price)}</div>
        )}

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {isNonEmpty(bedrooms) && <span>🛏 {toText(bedrooms)}</span>}
          {isNonEmpty(bathrooms) && <span>🛁 {toText(bathrooms)}</span>}
          {isNonEmpty(carparks) && <span>🚗 {toText(carparks)}</span>}
        </div>

        <div className="mt-3 space-y-1">
          {/* SALE */}
          {showSale && (
            <>
              <MetaLine label="Sale / Rent" value="Sale" />
              <MetaLine label="Property Usage" value={propertyUsage} />
              <MetaLine label="Property Title" value={propertyTitle} />
              <MetaLine label="Property Status / Sale Type" value={saleTypeDetail} />
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
              <MetaLine label="完成年份" value={builtYear} />
              <MetaLine label="预计完成年份" value={expectedYear} />
            </>
          )}

          {/* RENT（整间） */}
          {showRent && !isRentRoom && (
            <>
              <MetaLine label="Sale / Rent" value="Rent" />
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
              <MetaLine label="租金" value={rawProperty?.price ?? rawProperty?.price_min ?? rawProperty?.price_max} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={propertySubtype} />
              <MetaLine label="Build Up Area" value={buildUpArea} />
              <MetaLine label="Land Area" value={landArea} />
              <MetaLine label="PSF" value={psf} />
              <MetaLine label="这是什么房？" value={roomType} />
              <MetaLine label="卫生间共用/独立" value={bathroomSharing} />
              <MetaLine label="床型" value={bedTypes} />
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
              <MetaLine label="Homestay type" value={homestayType} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="床型" value={bedTypes} />
              <MetaLine label="能住几个人" value={maxGuests} />
              <MetaLine label="室内能否吸烟" value={smokingAllowed} />
              <MetaLine label="入住服务" value={checkinService} />
              <MetaLine label="房型是否包含早餐" value={breakfastIncluded} />
              <MetaLine label="房型是否允许宠物入住" value={allowPets} />
              <MetaLine label="是否能免费取消" value={freeCancellation} />
              <MetaLine label="卧室数量" value={bedrooms || rawProperty?.bedroom_count} />
              <MetaLine label="浴室数量" value={bathrooms || rawProperty?.bathroom_count} />
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
              <MetaLine label="Hotel/Resort type" value={hotelResortType} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="床型" value={bedTypes} />
              <MetaLine label="能住几个人" value={maxGuests} />
              <MetaLine label="室内能否吸烟" value={smokingAllowed} />
              <MetaLine label="入住服务" value={checkinService} />
              <MetaLine label="房型是否包含早餐" value={breakfastIncluded} />
              <MetaLine label="房型是否允许宠物入住" value={allowPets} />
              <MetaLine label="是否能免费取消" value={freeCancellation} />
              <MetaLine label="卧室数量" value={bedrooms || rawProperty?.bedroom_count} />
              <MetaLine label="浴室数量" value={bathrooms || rawProperty?.bathroom_count} />
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

      {/* 底部 123：不动 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button onClick={() => onView(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          查看
        </button>
        <button onClick={() => onEdit(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          编辑
        </button>
        <button onClick={() => onDelete(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          删除
        </button>
      </div>
    </div>
  );
}

/* =========================
   Page: stats + search + sort
========================= */
export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");

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

  const stats = useMemo(() => {
    const total = properties.length;

    // 你表里没 published 字段，这里不乱猜：先全部当已发布=total，草稿=0
    // 以后你如果加 status/published，我再帮你对齐
    const published = total;
    const draft = 0;

    const latestTime = properties
      .map((p) => p?.updated_at || p?.created_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];

    return { total, published, draft, latestTime };
  }, [properties]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let list = properties;

    if (k) {
      list = list.filter((p) => {
        const merged = mergePropertyData(p);
        const t = pickAny(merged, ["title"]);
        const a = pickAny(merged, ["address"]);
        return String(t || "").toLowerCase().includes(k) || String(a || "").toLowerCase().includes(k);
      });
    }

    const getPriceNum = (p) => {
      const v = p?.price ?? p?.price_min ?? p?.price_max;
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold text-gray-900">我的房源（卖家后台）</div>

      {/* 顶部统计 */}
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
          <div className="text-sm text-gray-900 mt-2">{stats.latestTime ? String(stats.latestTime) : "-"}</div>
        </div>
      </div>

      {/* 搜索 + 排序 */}
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

      {/* 列表 */}
      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">没有符合条件的房源。</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <SellerPropertyCard key={p.id} rawProperty={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
