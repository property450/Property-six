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

// ✅ 兼容你 JSON 里的 Yes/No / 是/否
function yesNoText(v) {
  if (v === true) return "是";
  if (v === false) return "否";
  if (!isNonEmpty(v)) return "";
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1", "是"].includes(s)) return "是";
  if (["no", "n", "false", "0", "否"].includes(s)) return "否";
  return String(v);
}

/* =========================
   ✅ 数字/金额解析（修复 RM0）
========================= */
function extractNumericString(x) {
  if (!isNonEmpty(x)) return "";
  const s = String(x).replace(/,/g, "").replace(/[^\d.]/g, "");
  // 关键：如果没有任何数字，别让 Number("") 变 0
  if (!s || !/[0-9]/.test(s)) return "";
  return s;
}

function toNumberOrNaN(x) {
  const s = extractNumericString(x);
  if (!s) return NaN;
  const n = Number(s);
  return Number.isNaN(n) ? NaN : n;
}

// 统一金额显示：只在确实有数字时才显示
function money(v) {
  if (!isNonEmpty(v)) return "";
  // v 可能是 object（priceData），先尝试抽取
  const n = toNumberOrNaN(v);
  if (Number.isNaN(n)) return ""; // ✅ 不再出现 RM 0
  return "RM " + n.toLocaleString("en-MY");
}

// 统一 count/range 显示（车位/房间/厕所等）
function formatCountOrRange(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;

  // 常见 range 结构：{min,max} / {from,to} / {minValue,maxValue}
  if (typeof v === "object") {
    const min = pickAny(v, ["min", "from", "minValue", "min_count", "minCount"]);
    const max = pickAny(v, ["max", "to", "maxValue", "max_count", "maxCount"]);
    const minN = toNumberOrNaN(min);
    const maxN = toNumberOrNaN(max);

    if (!Number.isNaN(minN) && !Number.isNaN(maxN) && minN !== maxN) return `${minN} ~ ${maxN}`;
    if (!Number.isNaN(minN) && (Number.isNaN(maxN) || minN === maxN)) return `${minN}`;
    if (!Number.isNaN(maxN) && Number.isNaN(minN)) return `${maxN}`;

    // year/quarter 这种结构：{year, quarter}
    const year = pickAny(v, ["year", "completedYear", "expectedYear", "value"]);
    const q = pickAny(v, ["quarter", "q"]);
    if (isNonEmpty(year) && isNonEmpty(q)) return `${year} Q${q}`;
    if (isNonEmpty(year)) return String(year);

    return "";
  }

  return String(v);
}

// 统一年份显示（避免 object 乱显示）
function formatYearLike(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const year = pickAny(v, ["year", "value", "completedYear", "expectedYear"]);
    const quarter = pickAny(v, ["quarter", "q"]);
    if (isNonEmpty(year) && isNonEmpty(quarter)) return `${year} Q${quarter}`;
    if (isNonEmpty(year)) return String(year);
  }
  return "";
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
   ✅ 核心：只解析 JSON 到 __json，不再乱“提升覆盖”导致串表单
   需要什么，就在 card 里按当前模式选 source 来读
========================= */
function mergePropertyData(raw) {
  const p = raw || {};
  const merged = { ...p };

  // 你表里常见 JSON 列（保持原样解析进 __json）
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
  for (const k of jsonColsAll) {
    const parsed = safeJson(p?.[k]);
    if (parsed && typeof parsed === "object") {
      merged.__json[k] = parsed;
    }
  }

  // layout0 也先解析出来（但是否用它，由 card 的模式决定）
  let ul = p?.unit_layouts ?? p?.unitLayouts ?? p?.unitlayouts;
  ul = safeJson(ul) ?? ul;
  if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") {
    merged.__layout0 = ul[0];
  }

  return merged;
}

/* =========================
   ✅ 根据当前模式选择“正确数据源”（彻底解决串表单/旧资料）
========================= */
function getActiveSource(rawProperty, mergedProperty) {
  const p = rawProperty || {};
  const m = mergedProperty || {};

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
  const isSaleOrRent = saleType === "sale" || saleType === "rent";
  const isHotel = saleType === "hotel/resort" || finalType.includes("hotel");

  // Project：优先 layout0
  if (isProject && m.__layout0) return m.__layout0;

  // Sale/Rent：优先 single_form_data（你最新编辑存的通常在这里）
  if (isSaleOrRent) {
    const single =
      m.__json?.single_form_data_v2 ||
      m.__json?.single_form_data ||
      m.__json?.singleFormData;
    if (single) return single;

    // 某些字段可能存在 type_form_v2（例如 transit）
    const typef = m.__json?.type_form_v2 || m.__json?.type_form || m.__json?.typeform || m.__json?.typeForm;
    if (typef) return typef;
  }

  // Homestay
  if (isHomestay) {
    const hs = m.__json?.homestay_form;
    if (hs) return hs;
  }

  // Hotel/Resort
  if (isHotel) {
    const ht = m.__json?.hotel_resort_form;
    if (ht) return ht;
  }

  // fallback：回 merged/top-level
  return m;
}

/* =========================
   交通：优先从 active source 的 transit 读
========================= */
function getTransitText(active, merged) {
  const a = active || {};
  const m = merged || {};

  const near = pickAny(a, ["transit.nearTransit", "nearTransit", "transitNearTransit"]);
  const nearFallback = pickAny(m, [
    "transit.nearTransit",
    "__layout0.transit.nearTransit",
    "__json.single_form_data_v2.transit.nearTransit",
    "__json.type_form_v2.transit.nearTransit",
  ]);

  const nearVal = isNonEmpty(near) ? near : nearFallback;
  if (!isNonEmpty(nearVal)) return "";

  const yn = yesNoText(nearVal);
  if (!isNonEmpty(yn)) return "";

  const lines = pickAny(a, ["transit.selectedLines", "selectedLines"]);
  const linesFallback = pickAny(m, [
    "transit.selectedLines",
    "__layout0.transit.selectedLines",
    "__json.single_form_data_v2.transit.selectedLines",
    "__json.type_form_v2.transit.selectedLines",
  ]);

  const stations = pickAny(a, ["transit.selectedStations", "selectedStations"]);
  const stationsFallback = pickAny(m, [
    "transit.selectedStations",
    "__layout0.transit.selectedStations",
    "__json.single_form_data_v2.transit.selectedStations",
    "__json.type_form_v2.transit.selectedStations",
  ]);

  const finalLines = isNonEmpty(lines) ? lines : linesFallback;
  const finalStations = isNonEmpty(stations) ? stations : stationsFallback;

  let extra = "";
  if (Array.isArray(finalLines) && finalLines.length) extra += `｜线路：${finalLines.join(", ")}`;
  if (finalStations && typeof finalStations === "object") {
    const parts = [];
    for (const k of Object.keys(finalStations)) {
      const arr = finalStations[k];
      if (Array.isArray(arr) && arr.length) {
        parts.push(`${k}: ${arr.map((x) => x?.label || x?.value).filter(Boolean).join(", ")}`);
      }
    }
    if (parts.length) extra += `｜站点：${parts.join("；")}`;
  }

  return `是${extra}`;
}

/* =========================
   roomLayouts（你 JSON 有 roomLayouts 和 room_layouts）
========================= */
function getRoomLayoutsFromActive(active, merged) {
  const a = active || {};
  const m = merged || {};
  const v =
    pickAny(a, ["roomLayouts", "room_layouts"]) ||
    pickAny(m, ["roomLayouts", "room_layouts", "__layout0.roomLayouts", "__layout0.room_layouts"]);
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

  let pet = "";
  if (layout?.petPolicy?.type) {
    const t = String(layout.petPolicy.type).toLowerCase();
    if (t === "allowed") pet = "允许";
    else if (t === "forbidden") pet = "不允许";
    else pet = String(layout.petPolicy.type);
  }

  let cancel = "";
  if (layout?.cancellationPolicy?.type) {
    cancel = String(layout.cancellationPolicy.type);
    if (isNonEmpty(layout.cancellationPolicy.condition)) cancel += `（${layout.cancellationPolicy.condition}）`;
  }

  const fees = layout?.fees || {};
  const feeText = (feeObj) => {
    if (!feeObj) return "";
    const v = feeObj.value;
    const out = money(v);
    return out || "";
  };

  const serviceFee = feeText(fees.serviceFee);
  const cleaningFee = feeText(fees.cleaningFee);
  const deposit = feeText(fees.deposit);
  const otherFee = feeText(fees.otherFee);

  const pricesMap = layout?.availability?.prices;
  let calendarSummary = "";
  if (pricesMap && typeof pricesMap === "object") {
    const nums = Object.values(pricesMap)
      .map((x) => toNumberOrNaN(x))
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
   ✅ 价格显示（支持 priceData/pricedata/object/range）
========================= */
function getPriceFromAny(rawProperty, active, merged) {
  const rp = rawProperty || {};
  const a = active || {};
  const m = merged || {};

  // 1) 顶层 price_min/max（最明确）
  const hasMin = isNonEmpty(rp.price_min);
  const hasMax = isNonEmpty(rp.price_max);
  const minNum = hasMin ? toNumberOrNaN(rp.price_min) : NaN;
  const maxNum = hasMax ? toNumberOrNaN(rp.price_max) : NaN;
  if (hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
    return { kind: "range", min: minNum, max: maxNum };
  }

  // 2) active.priceData / active.pricedata（project/rent/sale 你经常用）
  const pd = pickAny(a, ["priceData", "pricedata", "pricedata", "price_data"]) || pickAny(m, ["priceData", "pricedata"]);
  if (pd && typeof pd === "object") {
    const minV = pickAny(pd, ["min", "minPrice", "min_value", "minValue", "from"]);
    const maxV = pickAny(pd, ["max", "maxPrice", "max_value", "maxValue", "to"]);
    const minP = toNumberOrNaN(minV);
    const maxP = toNumberOrNaN(maxV);
    if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP !== maxP) return { kind: "range", min: minP, max: maxP };
    if (!Number.isNaN(minP)) return { kind: "single", value: minP };
    if (!Number.isNaN(maxP)) return { kind: "single", value: maxP };
    const single = pickAny(pd, ["value", "price", "amount"]);
    const singleN = toNumberOrNaN(single);
    if (!Number.isNaN(singleN)) return { kind: "single", value: singleN };
  }

  // 3) active.price（可能是数字/字符串/object）
  const priceA = pickAny(a, ["price"]);
  if (isNonEmpty(priceA)) {
    if (typeof priceA === "object") {
      const minV = pickAny(priceA, ["min", "from"]);
      const maxV = pickAny(priceA, ["max", "to"]);
      const minP = toNumberOrNaN(minV);
      const maxP = toNumberOrNaN(maxV);
      if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP !== maxP) return { kind: "range", min: minP, max: maxP };
      const v = pickAny(priceA, ["value", "amount", "price"]);
      const vn = toNumberOrNaN(v);
      if (!Number.isNaN(vn)) return { kind: "single", value: vn };
    } else {
      const n = toNumberOrNaN(priceA);
      if (!Number.isNaN(n)) return { kind: "single", value: n };
    }
  }

  // 4) merged.price fallback
  const priceM = pickAny(m, ["price", "price_min", "price_max"]);
  const nM = toNumberOrNaN(priceM);
  if (!Number.isNaN(nM)) return { kind: "single", value: nM };

  return null;
}

function getCardPriceText(rawProperty, active, merged) {
  const p = getPriceFromAny(rawProperty, active, merged);
  if (!p) return "";
  if (p.kind === "range") return `${money(p.min)} ~ ${money(p.max)}`;
  if (p.kind === "single") return money(p.value);
  return "";
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const merged = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);
  const active = useMemo(() => getActiveSource(rawProperty, merged), [rawProperty, merged]);

  // 基础展示（标题/地址通常在顶层）
  const title = pickAny(rawProperty, ["title"]) || pickAny(active, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]);

  // 关键字段：优先 active（当前模式表单）
  const bedrooms = pickAny(active, ["bedrooms", "bedroom_count", "room_count"]) || pickAny(merged, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickAny(active, ["bathrooms", "bathroom_count"]) || pickAny(merged, ["bathrooms", "bathroom_count"]);
  const carparksRaw = pickAny(active, ["carparks", "carpark", "carparkCount", "carpark_count"]) || pickAny(merged, ["carparks", "carpark"]);
  const carparks = formatCountOrRange(carparksRaw);

  const saleType = pickAny(rawProperty, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const finalType = pickAny(rawProperty, ["finalType"]);
  const roomRentalMode = pickAny(active, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]) || pickAny(rawProperty, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);

  const showSale = String(saleType).toLowerCase() === "sale";
  const showRent = String(saleType).toLowerCase() === "rent";
  const showHomestay = String(saleType).toLowerCase() === "homestay";
  const showHotel = String(saleType).toLowerCase() === "hotel/resort" || String(finalType).toLowerCase().includes("hotel");

  const isRentRoom = showRent && String(roomRentalMode).toLowerCase() === "room";

  // 这些字段按你真实 key（优先 active）
  const usage = pickAny(active, ["usage", "property_usage"]) || pickAny(merged, ["usage", "property_usage"]);
  const tenure = pickAny(active, ["tenure", "tenure_type"]) || pickAny(merged, ["tenure", "tenure_type"]);
  const storeys = formatCountOrRange(pickAny(active, ["storeys"]) || pickAny(merged, ["storeys"]));
  const category = pickAny(active, ["category", "propertyCategory", "property_category"]) || pickAny(merged, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(active, ["subType", "property_sub_type", "sub_type"]) || pickAny(merged, ["subType", "property_sub_type", "sub_type"]);
  const subtypesMulti =
    pickAny(active, ["subtype", "property_subtypes", "propertySubtype"]) ||
    pickAny(merged, ["subtype", "property_subtypes", "propertySubtype"]);

  const propertyTitle = pickAny(active, ["propertyTitle", "property_title"]) || pickAny(merged, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) || pickAny(active, ["propertyStatus", "property_status", "propertystatus"]);

  // Affordable
  const affordableRaw = pickAny(active, ["affordable", "affordable_housing", "affordableHousing"]) || pickAny(merged, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickAny(active, ["affordableType", "affordable_housing_type", "affordableHousingType"]) || pickAny(merged, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";

  // ✅ 年份（优先 active）
  const completedYear = formatYearLike(pickAny(active, ["completedYear", "built_year"]) || pickAny(merged, ["completedYear", "built_year"]));
  const expectedYear = formatYearLike(pickAny(active, ["expectedCompletedYear", "expected_year"]) || pickAny(merged, ["expectedCompletedYear", "expected_year"]));

  // ✅ 公共交通（优先 active）
  const transitText = getTransitText(active, merged);

  // Homestay / Hotel extra
  const homestayType = pickAny(active, ["homestayType", "homestay_type"]) || pickAny(merged, ["homestayType", "homestay_type"]);
  const hotelResortType = pickAny(active, ["hotelResortType", "hotel_resort_type"]) || pickAny(merged, ["hotelResortType", "hotel_resort_type"]);
  const maxGuests = pickAny(active, ["maxGuests", "max_guests"]) || pickAny(merged, ["maxGuests", "max_guests"]);

  // roomLayouts（优先 active）
  const layouts = getRoomLayoutsFromActive(active, merged);
  const layout0 = layouts[0] || null;
  const layoutInfo = layout0 ? summarizeRoomLayout(layout0) : {};

  const bedTypesFallback = pickAny(active, ["bed_types"]) || pickAny(merged, ["bed_types"]);
  const bedTypesText =
    (layoutInfo?.beds && layoutInfo.beds.length ? layoutInfo.beds.join(", ") : "") ||
    (Array.isArray(bedTypesFallback) ? bedTypesFallback.join(", ") : "");

  const serviceFee = layoutInfo.serviceFee || "";
  const cleaningFee = layoutInfo.cleaningFee || "";
  const deposit = layoutInfo.deposit || "";
  const otherFee = layoutInfo.otherFee || "";
  const calendarSummary = layoutInfo.calendarSummary || "";

  // ✅ 价格显示（彻底修复 RM0）
  const cardPriceText = getCardPriceText(rawProperty, active, merged);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
        {isNonEmpty(address) && <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>}

        {isNonEmpty(cardPriceText) && <div className="text-base font-semibold text-blue-700 mt-2">{cardPriceText}</div>}

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
              <MetaLine label="租金" value={cardPriceText} />
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
        const active = getActiveSource(p, merged);
        const t = pickAny(p, ["title"]) || pickAny(active, ["title"]);
        const a = pickAny(p, ["address"]);
        return String(t || "").toLowerCase().includes(k) || String(a || "").toLowerCase().includes(k);
      });
    }

    const getPriceNum = (p) => {
      const merged = mergePropertyData(p);
      const active = getActiveSource(p, merged);
      const info = getPriceFromAny(p, active, merged);
      if (!info) return 0;
      if (info.kind === "range") return info.max || info.min || 0;
      if (info.kind === "single") return info.value || 0;
      return 0;
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
   
