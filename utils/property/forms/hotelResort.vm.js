// utils/property/forms/hotelResort.vm.js

import {
  isNonEmpty,
  pickAny,
  getTransitText,
  getCardPriceText,
  formatCarparks,
} from "../pickers";

function asText(v) {
  if (!isNonEmpty(v)) return "-";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function formatMoney(v) {
  if (!isNonEmpty(v)) return "-";
  const s = String(v);
  return s.startsWith("RM") ? s : `RM${s}`;
}

export function buildVM(rawProperty, active, helpers) {
  const single =
    rawProperty?.single_form_data_v2 ||
    rawProperty?.singleFormData ||
    rawProperty?.single_form_data ||
    {};

  const hotelForm = rawProperty?.hotel_resort_form || {};

  // ✅ 基本信息
  const title =
    pickAny(rawProperty, ["title", "propertyTitle"]) || "（未命名房源）";

  const address =
    pickAny(rawProperty, ["address", "fullAddress"]) || "-";

  // ✅ 价格（直接用通用逻辑）
  const priceText = getCardPriceText(
    rawProperty,
    active,
    helpers.isNewProjectStatus,
    helpers.isCompletedUnitStatus
  );

  // ✅ 分类
  const category =
    pickAny(single, ["category", "propertyCategory"]) ||
    pickAny(hotelForm, ["category"]) ||
    "-";

  const subType =
    pickAny(single, ["subType", "finalType"]) ||
    pickAny(hotelForm, ["subType"]) ||
    "-";

  // ✅ 房间信息
  const bedrooms =
    pickAny(single, ["bedrooms", "roomCount"]) || "-";

  const bathrooms =
    pickAny(single, ["bathrooms"]) || "-";

  const carparks = formatCarparks(
    pickAny(single, ["carparks", "carparkCount"])
  );

  // ✅ hotel 专属字段
  const hotelTypeText = asText(
    pickAny(hotelForm, ["hotelType", "type"])
  );

  const checkinText = asText(
    pickAny(hotelForm, ["checkInTime", "checkin"])
  );

  const checkoutText = asText(
    pickAny(hotelForm, ["checkOutTime", "checkout"])
  );

  const serviceFeeText = formatMoney(
    pickAny(hotelForm, ["serviceFee"])
  );

  const cleaningFeeText = formatMoney(
    pickAny(hotelForm, ["cleaningFee"])
  );

  const depositText = formatMoney(
    pickAny(hotelForm, ["deposit"])
  );

  const transitText = getTransitText(rawProperty, active);

  return {
    // 基础
    title,
    address,
    priceText,

    bedrooms,
    bathrooms,
    carparks,

    category,
    subType,

    // ✅ 标记类型（关键）
    saleType: "HOTEL/RESORT",

    // ❗关键：让 my-profile 识别这是 hotel
    isHotel: true,

    // hotel字段
    hotelTypeText,
    checkinText,
    checkoutText,
    serviceFeeText,
    cleaningFeeText,
    depositText,
    transitText,

    // 兼容字段（防止报错）
    propertyStatus:
      pickAny(rawProperty, ["propertyStatus", "property_status"]) || "-",

    showStoreys: false,
    showSubtype: false,
  };
}
