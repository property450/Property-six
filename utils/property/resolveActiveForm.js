// utils/property/resolveActiveForm.js

import { pickAny, safeJson, normalizeLower } from "./pickers";

export function isNewProjectStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("new project") || s.includes("under construction");
}

export function isCompletedUnitStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("completed unit") || s.includes("developer unit");
}

export function isAuctionStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("auction");
}

/**
 * ✅ 关键修复版
 * - project: shared = type_form_v2, form = null, layout0 = unit_layouts[0]
 * - sale/rent: shared = type_form_v2, form = single_form_data_v2
 *
 * 这样 Subsale / Rent 的后台卡片就能同时读到：
 * - type_form_v2（TypeSelector 存进去的 usage/title/tenure/category/subType 等）
 * - single_form_data_v2（价格、房间、厕所、停车、交通、年份等）
 */
export function resolveActiveForm(raw) {
  const saleTypeRaw = pickAny(raw, [
    "saleType",
    "sale_type",
    "saletype",
    "listing_mode",
  ]);
  const saleType = normalizeLower(saleTypeRaw);

  const propertyStatus = pickAny(raw, [
    "propertyStatus",
    "property_status",
    "propertystatus",
  ]);

  const typeFormV2 =
    safeJson(raw.type_form_v2) ||
    safeJson(raw.type_form) ||
    safeJson(raw.typeForm) ||
    null;

  const singleFormV2 =
    safeJson(raw.single_form_data_v2) ||
    safeJson(raw.single_form_data) ||
    safeJson(raw.singleFormData) ||
    null;

  const homestayForm =
    safeJson(raw.homestay_form) ||
    null;

  const hotelForm =
    safeJson(raw.hotel_resort_form) ||
    null;

  let ul = raw.unit_layouts ?? raw.unitLayouts ?? raw.unitlayouts;
  ul = safeJson(ul) ?? ul;
  const layout0 =
    Array.isArray(ul) && ul[0] && typeof ul[0] === "object"
      ? ul[0]
      : null;

  const isProject =
    isNewProjectStatus(propertyStatus) ||
    isCompletedUnitStatus(propertyStatus);

  // ✅ New Project / Completed Unit
  if (isProject) {
    return {
      mode: "project",
      saleType: "sale",
      propertyStatus,
      shared: typeFormV2,
      form: null,
      layout0,
    };
  }

  // ✅ Sale / Rent
  // 重点修复：shared 不能是 null，必须把 type_form_v2 也带进去
  if (saleType === "sale" || saleType === "rent") {
    return {
      mode: saleType,
      saleType,
      propertyStatus,
      shared: typeFormV2,     // ← 关键修复
      form: singleFormV2,     // ← 表单主体
      layout0: null,
    };
  }

  // ✅ Homestay
  if (saleType === "homestay") {
    return {
      mode: "homestay",
      saleType,
      propertyStatus,
      shared: typeFormV2,     // 保留 type selector 字段可读
      form: homestayForm || singleFormV2,
      layout0: null,
    };
  }

  // ✅ Hotel / Resort
  const finalType = normalizeLower(pickAny(raw, ["finalType"]));
  if (
    saleType === "hotel/resort" ||
    saleType === "hotel" ||
    finalType.includes("hotel")
  ) {
    return {
      mode: "hotel/resort",
      saleType: "hotel/resort",
      propertyStatus,
      shared: typeFormV2,     // 保留 type selector 字段可读
      form: hotelForm || singleFormV2,
      layout0: null,
    };
  }

  // ✅ fallback
  return {
    mode: "unknown",
    saleType,
    propertyStatus,
    shared: typeFormV2,
    form: singleFormV2,
    layout0: null,
  };
}

// 兼容旧命名，避免其它文件还在用 resolveActiveSources 时爆掉
export const resolveActiveSources = resolveActiveForm;
