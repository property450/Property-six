// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

/* =========================
   基础工具
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
  if (Array.isArray(v)) return v.filter(isNonEmpty).map(String).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
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

// 兼容你 JSON 里的 Yes/No / 是/否
function yesNoText(v) {
  if (v === true) return "是";
  if (v === false) return "否";
  if (!isNonEmpty(v)) return "";
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1", "是"].includes(s)) return "是";
  if (["no", "n", "false", "0", "否"].includes(s)) return "否";
  return String(v);
}

function MetaLine({ label, value }) {
  if (!isNonEmpty(value)) return null;
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{toText(value)}</span>
    </div>
  );
}

/* =========================
   ✅ 核心：合并策略（修复“读到另一个表单/旧表单”）
   - 仍然解析所有 JSON 列到 __json
   - 但只“提升/覆盖”当前模式对应的 JSON（避免旧 hotel/homestay/unitlayouts 抢数据）
   - layout0 只在 New Project/Completed 才启用
========================= */
function mergePropertyData(raw) {
  const p = raw || {};
  const merged = { ...p };

  // 统一拿“当前模式”
  const saleTypeRaw = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = String(saleTypeRaw || "").trim().toLowerCase();

  const finalTypeRaw = pickAny(p, ["finalType"]);
  const finalType = String(finalTypeRaw || "").trim().toLowerCase();

  const statusRaw = pickAny(p, ["propertyStatus", "property_status", "propertystatus"]);
  const status = String(statusRaw || "").trim().toLowerCase();

  const isProject =
    status.includes("new project") ||
    status.includes("under construction") ||
    status.includes("completed unit") ||
    status.includes("developer unit") ||
    status.includes("completed") ||
    status.includes("new");

  const isHomestay = saleType === "homestay";
  const isRent = saleType === "rent";
  const isSale = saleType === "sale";
  const isHotel = saleType === "hotel/resort" || finalType.includes("hotel");

  // ✅ 重要：只让“当前表单”覆盖这些关键展示字段（避免顶层旧值/旧表单抢）
  const OVERRIDE_KEYS = new Set([
    "title",
    "propertyTitle",
    "property_title",
    "propertyStatus",
    "property_status",
    "propertystatus",
    "usage",
    "property_usage",
    "tenure",
    "tenure_type",
    "category",
    "propertyCategory",
    "property_category",
    "subType",
    "sub_type",
    "storeys",
    "propertySubtype",
    "property_subtypes",
    "subtype",
    "bedrooms",
    "bedroom_count",
    "room_count",
    "bathrooms",
    "bathroom_count",
    "carpark",
    "carparks",
    "price",
    "price_min",
    "price_max",
    "pricedata",
    "priceData",
    "areadata",
    "areaData",
    "area_data",
    "saleType",
    "sale_type",
    "saletype",
    "listing_mode",
    "finalType",
    "roomRentalMode",
    "room_rental_mode",
    "roomrentalmode",
    "homestayType",
    "homestay_type",
    "hotelResortType",
    "hotel_resort_type",
    "maxGuests",
    "max_guests",
    "roomLayouts",
    "room_layouts",
    "bed_types",
    "transit",
    "affordable",
    "affordableType",
    "affordable_housing",
    "affordableHousing",
    "affordable_housing_type",
    "affordableHousingType",
    "completedYear",
    "built_year",
    "expectedCompletedYear",
    "expected_year",
    "availability",
    "calendar_prices",
  ]);

  // 你表里常见 JSON 列（保持原样解析）
  const jsonColsAll = [
    "type_form_v2",
    "type_form",
    "typeform",
    "typeForm",
    "single_form_data_v2",
    "single_form_data",
    "singleFormData",
    "homestay_form",
    "hotel_resort_form",
    "availability",
    "calendar_prices",
    "unit_layouts",
    "unitlayouts",
    "unitLayouts",
    "pricedata",
    "priceData",
    "areadata",
    "areaData",
    "area_data",
    "facilities",
    "furniture",
    "extraspaces",
    "property_subtypes",
    "bed_types",
    "house_rules",
    "check_in_out",
  ];

  merged.__json = {};

  // 先解析所有 JSON 进 __json（不影响展示）
  for (const k of jsonColsAll) {
    const parsed = safeJson(p?.[k]);
    if (parsed && typeof parsed === "object") {
      merged.__json[k] = parsed;
    }
  }

  // ✅ 决定“当前模式允许提升/覆盖”的 JSON 来源
  const activeJsonCols = [];

  // Sale / Rent：以 single_form_data 为准（你卡片上的 bedrooms/price 等都应来自这里）
  if (isSale || isRent) {
    activeJsonCols.push("single_form_data_v2", "single_form_data", "singleFormData");
    // 某些字段你也会放在 type_form_v2（例如 transit）
    activeJsonCols.push("type_form_v2", "type_form", "typeform", "typeForm");
  }

  // Homestay
  if (isHomestay) {
    activeJsonCols.push("homestay_form");
    // 允许补充日历/价格等
    activeJsonCols.push("availability", "calendar_prices", "check_in_out", "bed_types");
  }

  // Hotel / Resort
  if (isHotel) {
    activeJsonCols.push("hotel_resort_form");
    activeJsonCols.push("availability", "calendar_prices", "check_in_out", "bed_types");
  }

  // ✅ 只把 activeJsonCols 里的 key 提升到顶层（并按 override 规则覆盖关键字段）
  const promoteFromParsed = (parsed) => {
    if (!parsed || typeof parsed !== "object") return;
    for (const key of Object.keys(parsed)) {
      if (OVERRIDE_KEYS.has(key)) {
        merged[key] = parsed[key];
      } else {
        if (!isNonEmpty(merged[key])) merged[key] = parsed[key];
      }
    }
  };

  for (const k of activeJsonCols) {
    const parsed = merged.__json?.[k];
    if (parsed) promoteFromParsed(parsed);
  }

  // ✅ layout0 提升：只在 Project 模式启用（防止 Subsale/Rent 被旧 unitlayouts 抢数据）
  if (isProject) {
    let ul = p?.unit_layouts ?? p?.unitLayouts ?? p?.unitlayouts;
    ul = safeJson(ul) ?? ul;

    if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") {
      merged.__layout0 = ul[0];

      // layout0 对关键字段也允许覆盖（Project 模式以 layout 为准）
      for (const key of Object.keys(ul[0])) {
        if (OVERRIDE_KEYS.has(key)) {
          merged[key] = ul[0][key];
        } else {
          if (!isNonEmpty(merged[key])) merged[key] = ul[0][key];
        }
      }
    }
  }

  return merged;
}

/* =========================
   从你真实 JSON 结构抽取：交通、日历价格、床型等
========================= */

// 交通：你的 JSON 是 transit.nearTransit = "yes"
function getTransitText(p) {
  const near = pickAny(p, [
    "transit.nearTransit",
    "__layout0.transit.nearTransit",
    "__json.single_form_data_v2.transit.nearTransit",
    "__json.type_form_v2.transit.nearTransit",
  ]);
  if (!isNonEmpty(near)) return "";
  // nearTransit="yes" => 是
  const yn = yesNoText(near);
  if (!isNonEmpty(yn)) return "";

  // 线路/站
  const lines = pickAny(p, [
    "transit.selectedLines",
    "__layout0.transit.selectedLines",
    "__json.single_form_data_v2.transit.selectedLines",
    "__json.type_form_v2.transit.selectedLines",
  ]);
  const stations = pickAny(p, [
    "transit.selectedStations",
    "__layout0.transit.selectedStations",
    "__json.single_form_data_v2.transit.selectedStations",
    "__json.type_form_v2.transit.selectedStations",
  ]);

  let extra = "";
  if (Array.isArray(lines) && lines.length) extra += `｜线路：${lines.join(", ")}`;
  if (stations && typeof stations === "object") {
    // stations: { "MRT Kajang Line": [{label,value}] }
    const parts = [];
    for (const k of Object.keys(stations)) {
      const arr = stations[k];
      if (Array.isArray(arr) && arr.length) {
        parts.push(`${k}: ${arr.map((x) => x?.label || x?.value).filter(Boolean).join(", ")}`);
      }
    }
    if (parts.length) extra += `｜站点：${parts.join("；")}`;
  }

  return `是${extra}`;
}

// 统一拿 roomLayouts（你 JSON 有 roomLayouts 和 room_layouts）
function getRoomLayouts(p) {
  const v = pickAny(p, ["roomLayouts", "room_layouts", "__layout0.roomLayouts", "__layout0.room_layouts"]);
  const parsed = safeJson(v) ?? v;
  if (Array.isArray(parsed)) return parsed;
  return [];
}

// 从 layout 里拿：床型/人数/吸烟/早餐/宠物/取消/费用/日历价格
function summarizeRoomLayout(layout) {
  if (!layout || typeof layout !== "object") return {};

  const beds = Array.isArray(layout.beds)
    ? layout.beds.map((b) => `${b?.label || ""}${b?.count ? `x${b.count}` : ""}`.trim()).filter(Boolean)
    : [];

  const guests = layout?.guests;
  const guestText =
    guests && (isNonEmpty(guests.adults) || isNonEmpty(guests.children))
      ? `成人${guests.adults || 0}${isNonEmpty(guests.children) ? `，小孩${guests.children}` : ""}`
      : "";

  const smoking = yesNoText(layout?.smoking);
  const breakfast = yesNoText(layout?.breakfast);

  // petPolicy: {type:"forbidden"} => 不允许
  let pet = "";
  if (layout?.petPolicy?.type) {
    const t = String(layout.petPolicy.type).toLowerCase();
    if (t === "allowed") pet = "允许";
    else if (t === "forbidden") pet = "不允许";
    else pet = String(layout.petPolicy.type);
  }

  // cancellationPolicy: {type:"conditional"} 这里只显示 type + condition
  let cancel = "";
  if (layout?.cancellationPolicy?.type) {
    cancel = String(layout.cancellationPolicy.type);
    if (isNonEmpty(layout.cancellationPolicy.condition)) cancel += `（${layout.cancellationPolicy.condition}）`;
  }

  // fees: deposit/serviceFee/cleaningFee/otherFee
  const fees = layout?.fees || {};
  const feeText = (feeObj) => {
    if (!feeObj) return "";
    const v = feeObj.value;
    if (isNonEmpty(v)) return money(v);
    return "";
  };

  const serviceFee = feeText(fees.serviceFee);
  const cleaningFee = feeText(fees.cleaningFee);
  const deposit = feeText(fees.deposit);
  const otherFee = feeText(fees.otherFee);

  // availability.prices: {"Tue Jan 06 2026":"RM 50",...}
  const pricesMap = layout?.availability?.prices;
  let calendarSummary = "";
  if (pricesMap && typeof pricesMap === "object") {
    const nums = Object.values(pricesMap)
      .map((x) => Number(String(x).replace(/[^\d.]/g, "")))
      .filter((n) => !Number.isNaN(n));
    if (nums.length) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const days = nums.length;
      calendarSummary =
        min === max
          ? `日历价格：${money(min)}（${days}天）`
          : `日历价格：${money(min)} ~ ${money(max)}（${days}天）`;
    }
  }

  const checkIn = layout?.availability?.checkInTime || "";
  const checkOut = layout?.availability?.checkOutTime || "";

  let checkInOut = "";
  if (isNonEmpty(checkIn) || isNonEmpty(checkOut)) {
    checkInOut = `${checkIn ? `入住 ${checkIn}` : ""}${checkIn && checkOut ? "｜" : ""}${checkOut ? `退房 ${checkOut}` : ""}`;
  }

  return {
    beds,
    guestText,
    smoking,
    breakfast,
    pet,
    cancel,
    serviceFee,
    cleaningFee,
    deposit,
    otherFee,
    calendarSummary,
    checkInOut,
  };
}

/* =========================
   ✅ 价格显示规则（你要的）
========================= */
function getCardPriceText(rawProperty, mergedProperty) {
  const rp = rawProperty || {};
  const mp = mergedProperty || {};

  const hasMin = isNonEmpty(rp.price_min);
  const hasMax = isNonEmpty(rp.price_max);

  const minNum = hasMin ? Number(String(rp.price_min).replace(/[^\d.]/g, "")) : NaN;
  const maxNum = hasMax ? Number(String(rp.price_max).replace(/[^\d.]/g, "")) : NaN;

  // ✅ 只有 min & max 都有，并且 min != max 才显示 range
  if (hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
    return `${money(rp.price_min)} ~ ${money(rp.price_max)}`;
  }

  // ✅ 其他情况：优先用 price（subsale 就是这个）
  const single = pickAny(mp, ["price", "price_min", "price_max"]);
  if (isNonEmpty(single)) return money(single);

  return "";
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const p = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);

  // 基础展示
  const title = pickAny(p, ["title"]);
  const address = pickAny(p, ["address"]);

  // 你这里 “Studio” 存在 bedrooms 字段里（你贴的 JSON 是 bedrooms:"Studio"）
  const bedrooms = pickAny(p, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickAny(p, ["bathrooms", "bathroom_count"]);
  const carparks = pickAny(p, ["carparks", "carpark"]);

  // 模式：你贴的 JSON 是 saleType:"Sale"/ finalType:"Hotel / Resort" / roomRentalMode:"whole"
  const saleType = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const finalType = pickAny(p, ["finalType"]); // 例如 "Hotel / Resort"
  const roomRentalMode = pickAny(p, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);

  const showSale = String(saleType).toLowerCase() === "sale";
  const showRent = String(saleType).toLowerCase() === "rent";
  const showHomestay = String(saleType).toLowerCase() === "homestay";
  const showHotel = String(saleType).toLowerCase() === "hotel/resort" || String(finalType).toLowerCase().includes("hotel");

  const isRentRoom = showRent && String(roomRentalMode).toLowerCase() === "room";

  // ✅ 这些字段按你真实 JSON key 对齐
  const usage = pickAny(p, ["usage", "property_usage"]);
  const tenure = pickAny(p, ["tenure", "tenure_type"]);
  const storeys = pickAny(p, ["storeys"]);
  const category = pickAny(p, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(p, ["subType", "property_sub_type", "sub_type"]);
  const subtypesMulti = pickAny(p, ["subtype", "property_subtypes", "propertySubtype"]); // 注意：你 JSON 的 subtype 是数组

  const propertyTitle = pickAny(p, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(p, ["propertyStatus", "property_status", "propertystatus"]);

  // Affordable：你 JSON 是 affordable:"Yes" + affordableType:"Rumah Mampu Milik"
  const affordableRaw = pickAny(p, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickAny(p, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";

  const completedYear = pickAny(p, ["completedYear", "built_year"]);
  const expectedYear = pickAny(p, ["expectedCompletedYear", "expected_year"]);

  const transitText = getTransitText(p);

  // Homestay / Hotel extra
  const homestayType = pickAny(p, ["homestayType", "homestay_type"]);
  const hotelResortType = pickAny(p, ["hotelResortType", "hotel_resort_type", "hotel_resort_type", "hotel_resort_type"]);
  const maxGuests = pickAny(p, ["maxGuests", "max_guests"]);

  // 从 roomLayouts 取一个“汇总”
  const layouts = getRoomLayouts(p);
  const layout0 = layouts[0] || null;
  const layoutInfo = layout0 ? summarizeRoomLayout(layout0) : {};

  // 如果没有 roomLayouts，也尝试从顶层 bed_types
  const bedTypesFallback = pickAny(p, ["bed_types"]);
  const bedTypesText =
    (layoutInfo?.beds && layoutInfo.beds.length ? layoutInfo.beds.join(", ") : "") ||
    (Array.isArray(bedTypesFallback) ? bedTypesFallback.join(", ") : "");

  // 费用
  const serviceFee = layoutInfo.serviceFee || "";
  const cleaningFee = layoutInfo.cleaningFee || "";
  const deposit = layoutInfo.deposit || "";
  const otherFee = layoutInfo.otherFee || "";

  // 日历价格
  const calendarSummary = layoutInfo.calendarSummary || "";

  // ✅ 价格显示（你要的最终逻辑）
  const cardPriceText = getCardPriceText(rawProperty, p);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
        {isNonEmpty(address) && <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>}

        {/* ✅ 价格（只按规则显示单价或 range） */}
        {isNonEmpty(cardPriceText) && <div className="text-base font-semibold text-blue-700 mt-2">{cardPriceText}</div>}

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {isNonEmpty(bedrooms) && <span>🛏 {toText(bedrooms)}</span>}
          {isNonEmpty(bathrooms) && <span>🛁 {toText(bathrooms)}</span>}
          {isNonEmpty(carparks) && <span>🚗 {toText(carparks)}</span>}
        </div>

        {/* 详细字段：有值才显示 */}
        <div className="mt-3 space-y-1">
          {/* SALE */}
          {showSale && (
            <>
              <MetaLine label="Sale / Rent" value="Sale" />
              <MetaLine label="Property Usage" value={usage} />
              <MetaLine label="Property Title" value={propertyTitle} />
              <MetaLine label="Property Status / Sale Type" value={propertyStatus} />

              <MetaLine
                label="Affordable Housing"
                value={affordable === "是" && affordableType ? `是（${affordableType}）` : affordable}
              />

              <MetaLine label="Tenure Type" value={tenure} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Sub Type" value={subType} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />

              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
              <MetaLine label="完成年份" value={completedYear} />
              <MetaLine label="预计完成年份" value={expectedYear} />
            </>
          )}

          {/* RENT（整间） */}
          {showRent && !isRentRoom && (
            <>
              <MetaLine label="Sale / Rent" value="Rent" />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />
              <MetaLine label="房间数量" value={bedrooms} />
              <MetaLine label="浴室数量" value={bathrooms} />
              <MetaLine label="停车位数量" value={carparks} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* RENT（出租房间） */}
          {showRent && isRentRoom && (
            <>
              <MetaLine label="租金" value={pickAny(p, ["price", "price_min", "price_max"])} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />

              <MetaLine label="床型" value={bedTypesText} />
              <MetaLine label="停车位数量" value={carparks} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* HOMESTAY */}
          {showHomestay && (
            <>
              <MetaLine label="Homestay type" value={homestayType} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="床型" value={bedTypesText} />
              <MetaLine label="能住几个人" value={maxGuests || layoutInfo.guestText} />

              <MetaLine label="室内能否吸烟" value={layoutInfo.smoking} />
              <MetaLine label="房型是否包含早餐" value={layoutInfo.breakfast} />
              <MetaLine label="房型是否允许宠物入住" value={layoutInfo.pet} />
              <MetaLine label="是否能免费取消" value={layoutInfo.cancel} />

              <MetaLine label="卧室数量" value={bedrooms} />
              <MetaLine label="浴室数量" value={bathrooms} />
              <MetaLine label="停车位数量" value={carparks} />

              <MetaLine label="日历价格" value={calendarSummary} />
              <MetaLine label="入住/退房时间" value={layoutInfo.checkInOut} />

              <MetaLine label="房型的服务费" value={serviceFee} />
              <MetaLine label="房型的清洁费" value={cleaningFee} />
              <MetaLine label="房型的押金" value={deposit} />
              <MetaLine label="房型的其它费用" value={otherFee} />
            </>
          )}

          {/* HOTEL / RESORT */}
          {showHotel && (
            <>
              <MetaLine label="Hotel/Resort type" value={hotelResortType || finalType} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="床型" value={bedTypesText} />
              <MetaLine label="能住几个人" value={maxGuests || layoutInfo.guestText} />

              <MetaLine label="室内能否吸烟" value={layoutInfo.smoking} />
              <MetaLine label="房型是否包含早餐" value={layoutInfo.breakfast} />
              <MetaLine label="房型是否允许宠物入住" value={layoutInfo.pet} />
              <MetaLine label="是否能免费取消" value={layoutInfo.cancel} />

              <MetaLine label="卧室数量" value={bedrooms} />
              <MetaLine label="浴室数量" value={bathrooms} />
              <MetaLine label="停车位数量" value={carparks} />

              <MetaLine label="日历价格" value={calendarSummary} />
              <MetaLine label="入住/退房时间" value={layoutInfo.checkInOut} />

              <MetaLine label="房型的服务费" value={serviceFee} />
              <MetaLine label="房型的清洁费" value={cleaningFee} />
              <MetaLine label="房型的押金" value={deposit} />
              <MetaLine label="房型的其它费用" value={otherFee} />
            </>
          )}
        </div>
      </div>

      {/* ✅ 你要保留的 123 按钮 */}
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
   Page（统计 + 搜索 + 排序）
========================= */
export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

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

  // 统计（你表里没有 published 字段，不乱猜，全部当已发布）
  const stats = useMemo(() => {
    const total = properties.length;
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
      const n = Number(String(v).replace(/[^\d.]/g, ""));
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

      {/* 统计 */}
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
