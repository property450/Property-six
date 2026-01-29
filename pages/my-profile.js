// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

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

// 从各种可能的结构里“尽量读出”公共交通 Yes/No
function getTransitYesNo(property) {
  // 你项目里常见：transit / transit_info / transitData / unit_layouts 内嵌
  const t =
    property?.transit ??
    property?.transit_info ??
    property?.transitData ??
    property?.transit_data;

  if (typeof t === "boolean") return t ? "是" : "否";
  if (typeof t === "string") return t;
  if (t && typeof t === "object") {
    const v =
      t.walkableToTransit ??
      t.walkable ??
      t.isWalkable ??
      t.hasTransit ??
      t.answer ??
      t.yesNo;
    if (typeof v === "boolean") return v ? "是" : "否";
    if (typeof v === "string") return v;
  }

  // 有些人把它放在 unit_layouts（layout 1）
  const ul = property?.unit_layouts ?? property?.unitLayouts;
  try {
    const arr = typeof ul === "string" ? JSON.parse(ul) : ul;
    if (Array.isArray(arr) && arr[0]) {
      const t2 = arr[0]?.transit ?? arr[0]?.transitData ?? arr[0]?.transit_info;
      if (typeof t2 === "boolean") return t2 ? "是" : "否";
      if (t2 && typeof t2 === "object") {
        const v2 = t2.walkableToTransit ?? t2.walkable ?? t2.isWalkable ?? t2.answer ?? t2.yesNo;
        if (typeof v2 === "boolean") return v2 ? "是" : "否";
        if (typeof v2 === "string") return v2;
      }
    }
  } catch (e) {}

  return "";
}

// 日历价格概览：只做“概览”，不改你原本日历逻辑
function getCalendarPriceSummary(property) {
  // 常见结构：availability / calendar / dayPrices / datePrices
  const a =
    property?.availability ??
    property?.calendar ??
    property?.dayPrices ??
    property?.datePrices ??
    property?.availability_data;

  if (!a) return "";

  // 如果是字符串 JSON
  let data = a;
  try {
    if (typeof a === "string") data = JSON.parse(a);
  } catch (e) {}

  // 支持几种常见形态：
  // 1) { pricesByDate: { "2026-01-01": 200, ... } }
  // 2) { dayPrices: [{date:"2026-01-01", price:200}, ...] }
  // 3) 直接就是 {"2026-01-01": 200, ...}
  let pricesMap = null;
  let list = null;

  if (data?.pricesByDate && typeof data.pricesByDate === "object") pricesMap = data.pricesByDate;
  else if (data?.dayPrices && Array.isArray(data.dayPrices)) list = data.dayPrices;
  else if (data?.prices && typeof data.prices === "object") pricesMap = data.prices;
  else if (typeof data === "object" && !Array.isArray(data)) pricesMap = data;

  let prices = [];

  if (pricesMap) {
    for (const k of Object.keys(pricesMap)) {
      const p = pricesMap[k];
      const n = Number(p);
      if (!Number.isNaN(n)) prices.push(n);
    }
    if (prices.length === 0) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const days = prices.length;
    if (min === max) return `日历价格：${money(min)}（${days}天）`;
    return `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
  }

  if (list) {
    for (const item of list) {
      const n = Number(item?.price);
      if (!Number.isNaN(n)) prices.push(n);
    }
    if (prices.length === 0) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const days = prices.length;
    if (min === max) return `日历价格：${money(min)}（${days}天）`;
    return `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
  }

  return "";
}

// 把“想显示的字段”统一走这一层：有值才渲染
function MetaLine({ label, value }) {
  if (!isNonEmpty(value)) return null;
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-800">{toText(value)}</span>
    </div>
  );
}

// 统一从 property 里读取常见字段（尽量兼容 snake_case / camelCase）
function pick(property, keys) {
  for (const k of keys) {
    const v = property?.[k];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function getSaleType(property) {
  return pick(property, ["saleType", "sale_type", "type", "listing_type"]);
}

function getRoomRentalMode(property) {
  // 你的项目里可能是：roomRentalMode = "whole" | "room"
  // 或：isRoomRental = true/false
  const m = pick(property, ["roomRentalMode", "room_rental_mode"]);
  if (isNonEmpty(m)) return m; // "whole"/"room"
  const b = pick(property, ["isRoomRental", "is_room_rental", "room_rental"]);
  if (typeof b === "boolean") return b ? "room" : "whole";
  return "";
}

function SellerPropertyCard({ property, onView, onEdit, onDelete }) {
  const saleType = getSaleType(property);
  const roomRentalMode = getRoomRentalMode(property); // rent only

  // === 基础你已经有的：标题 / 地点 / 价格 / 房间浴室车位 ===
  const title = pick(property, ["title", "name", "property_title_text"]);
  const locationText = pick(property, ["location", "address", "city", "area", "state", "full_address"]);
  const price = pick(property, ["price", "rent", "amount", "base_price"]);

  const bedrooms = pick(property, ["bedrooms", "bedroom_count", "roomCount", "room_count"]);
  const bathrooms = pick(property, ["bathrooms", "bathroom_count"]);
  const carparks = pick(property, ["carparks", "carpark_count", "parking_count"]);

  // Studio 显示逻辑：如果你保存的是 "Studio" 就原样显示
  const bedroomLabel = isNonEmpty(bedrooms) ? toText(bedrooms) : "";

  // === 通用字段 ===
  const propertyUsage = pick(property, ["usage", "property_usage"]);
  const propertyTitle = pick(property, ["propertyTitle", "property_title"]);
  const propertyStatus = pick(property, ["propertyStatus", "property_status", "saleStatus", "sale_status"]);
  const saleTypeDetail = pick(property, ["saleTypeDetail", "sale_type_detail", "sale_type_name"]);
  const affordableHousing = pick(property, ["affordableHousing", "affordable_housing"]);
  const affordableHousingType = pick(property, ["affordableHousingType", "affordable_housing_type"]);
  const tenureType = pick(property, ["tenureType", "tenure_type", "tenure"]);

  const category = pick(property, ["category", "propertyCategory", "property_category"]);
  const subType = pick(property, ["subType", "sub_type", "property_sub_type"]);
  const storeys = pick(property, ["storeys", "storey", "floor_count"]);
  const propertySubtype = pick(property, ["propertySubtype", "property_subtype"]); // Penthouse/Duplex...

  const buildUpArea = pick(property, ["buildUpArea", "build_up_area", "built_up_area"]);
  const landArea = pick(property, ["landArea", "land_area"]);
  const psf = pick(property, ["psf", "price_per_sqft"]);

  const transitYesNo = getTransitYesNo(property);
  const completedYear = pick(property, ["completedYear", "completed_year", "completion_year"]);
  const expectedYear = pick(property, ["expectedCompletedYear", "expected_completed_year", "expected_completion_year"]);

  // === Rent房间模式字段 ===
  const roomType = pick(property, ["roomType", "room_type"]); // 这是什么房？
  const bathroomSharing = pick(property, ["bathroomSharing", "bathroom_sharing"]); // 共用/独立
  const bedType = pick(property, ["bedType", "bed_type", "bedTypes", "bed_types"]); // 床型(可能多选)
  const roomPrivacy = pick(property, ["roomPrivacy", "room_privacy"]); // 独立/共用房间
  const genderMix = pick(property, ["genderMix", "gender_mix"]); // 是否男女混住
  const allowPets = pick(property, ["allowPets", "allow_pets", "petsAllowed", "pets_allowed"]);
  const allowCooking = pick(property, ["allowCooking", "allow_cooking", "cookingAllowed", "cooking_allowed"]);
  const rentIncludes = pick(property, ["rentIncludes", "rent_includes"]); // 租金包括
  const cleaningService = pick(property, ["cleaningService", "cleaning_service"]);
  const preferredRace = pick(property, ["preferredRace", "preferred_race", "racePreference", "race_preference"]);
  const acceptedTenure = pick(property, ["acceptedTenure", "accepted_tenure", "leaseTerm", "lease_term"]); // 接受的租期
  const availableFrom = pick(property, ["availableFrom", "available_from", "move_in_date"]); // 几时开始可以入住

  // === Homestay / Hotel 字段 ===
  const homestayType = pick(property, ["homestayType", "homestay_type"]);
  const hotelResortType = pick(property, ["hotelResortType", "hotel_resort_type"]);

  const guestCount = pick(property, ["guestCount", "guest_count", "capacity", "guest_capacity"]); // 能住几个人
  const smokingAllowed = pick(property, ["smokingAllowed", "smoking_allowed"]);
  const checkinService = pick(property, ["checkinService", "checkin_service"]); // 入住服务
  const breakfastIncluded = pick(property, ["breakfastIncluded", "breakfast_included"]);
  const freeCancellation = pick(property, ["freeCancellation", "free_cancellation"]);

  const serviceFee = pick(property, ["serviceFee", "service_fee"]);
  const cleaningFee = pick(property, ["cleaningFee", "cleaning_fee"]);
  const deposit = pick(property, ["deposit", "security_deposit"]);
  const otherFees = pick(property, ["otherFees", "other_fees", "extra_fees"]);

  const calendarSummary = getCalendarPriceSummary(property);

  // ========= 渲染：按模式显示 =========
  const showSaleMeta = saleType === "Sale";
  const showRentMeta = saleType === "Rent";
  const showHomestayMeta = saleType === "Homestay";
  const showHotelMeta = saleType === "Hotel/Resort" || saleType === "Hotel" || saleType === "Resort";

  const isRentRoom = showRentMeta && (roomRentalMode === "room" || roomRentalMode === "Room");

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* 顶部基础信息 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
          {isNonEmpty(locationText) && (
            <div className="text-sm text-gray-600 mt-1 truncate">{locationText}</div>
          )}
          {isNonEmpty(price) && (
            <div className="text-base font-semibold text-blue-700 mt-2">{money(price)}</div>
          )}

          {/* 你原本已经有的：房/厕/车 */}
          <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {isNonEmpty(bedroomLabel) && <span>🛏 {bedroomLabel}</span>}
            {isNonEmpty(bathrooms) && <span>🛁 {toText(bathrooms)}</span>}
            {isNonEmpty(carparks) && <span>🚗 {toText(carparks)}</span>}
          </div>

          {/* ✅ 这里开始：你要新增的「有值才显示」 */}
          <div className="mt-3 space-y-1">
            {/* ====== SALE ====== */}
            {showSaleMeta && (
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

            {/* ====== RENT（整间） ====== */}
            {showRentMeta && !isRentRoom && (
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

            {/* ====== RENT（出租房间） ====== */}
            {showRentMeta && isRentRoom && (
              <>
                <MetaLine label="租金" value={price} />
                <MetaLine label="Property Category" value={category} />
                <MetaLine label="Storeys" value={storeys} />
                <MetaLine label="Property Subtype" value={propertySubtype} />
                <MetaLine label="Build Up Area" value={buildUpArea} />
                <MetaLine label="Land Area" value={landArea} />
                <MetaLine label="PSF" value={psf} />
                <MetaLine label="这是什么房？" value={roomType} />
                <MetaLine label="卫生间" value={bathroomSharing} />
                <MetaLine label="床型" value={bedType} />
                <MetaLine label="是独立房间还是共用房间？" value={roomPrivacy} />
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

            {/* ====== HOMESTAY ====== */}
            {showHomestayMeta && (
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
                <MetaLine label="服务费" value={isNonEmpty(serviceFee) ? money(serviceFee) : ""} />
                <MetaLine label="清洁费" value={isNonEmpty(cleaningFee) ? money(cleaningFee) : ""} />
                <MetaLine label="押金" value={isNonEmpty(deposit) ? money(deposit) : ""} />
                <MetaLine label="其它费用" value={otherFees} />
              </>
            )}

            {/* ====== HOTEL / RESORT ====== */}
            {showHotelMeta && (
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
                <MetaLine label="服务费" value={isNonEmpty(serviceFee) ? money(serviceFee) : ""} />
                <MetaLine label="清洁费" value={isNonEmpty(cleaningFee) ? money(cleaningFee) : ""} />
                <MetaLine label="押金" value={isNonEmpty(deposit) ? money(deposit) : ""} />
                <MetaLine label="其它费用" value={otherFees} />
              </>
            )}
          </div>
        </div>

        {/* 右上角：收藏之类你原本有的话就保留，这里我不乱加 */}
      </div>

      {/* ✅ 移除「查看详情」按钮：你要删的就是这里（我已不放了） */}

      {/* 底部 1/2/3 大按钮：查看 / 编辑 / 删除（顺序保持 123） */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onView(property)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(property)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(property)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

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

  const onView = (p) => {
    // 你原本的查看逻辑：保持
    router.push(`/property/${p.id}`);
  };

  const onEdit = (p) => {
    // 你原本的编辑逻辑：保持（你常用 upload-property?edit=1&id=xx）
    router.push(`/upload-property?edit=1&id=${p.id}`);
  };

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

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : properties.length === 0 ? (
          <div className="text-gray-600">你还没有上传任何房源。</div>
        ) : (
          <div className="space-y-4">
            {properties.map((p) => (
              <SellerPropertyCard
                key={p.id}
                property={p}
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
