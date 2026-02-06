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

/**
 * ✅ 完全照你现有 my-profile.js 的 resolveActiveSources 搬过来
 */
export function resolveActiveForm(raw) {
  const saleTypeRaw = pickAny(raw, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = normalizeLower(saleTypeRaw);
  const propertyStatus = pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);

  const typeFormV2 = safeJson(raw.type_form_v2) || safeJson(raw.type_form) || null;
  const singleFormV2 = safeJson(raw.single_form_data_v2) || safeJson(raw.single_form_data) || null;
  const homestayForm = safeJson(raw.homestay_form) || null;
  const hotelForm = safeJson(raw.hotel_resort_form) || null;

  let ul = raw.unit_layouts ?? raw.unitLayouts ?? raw.unitlayouts;
  ul = safeJson(ul) ?? ul;
  const layout0 = Array.isArray(ul) && ul[0] && typeof ul[0] === "object" ? ul[0] : null;

  const isProject = isNewProjectStatus(propertyStatus) || isCompletedUnitStatus(propertyStatus);

  if (isProject) {
    return { mode: "project", saleType: "sale", propertyStatus, shared: typeFormV2, form: null, layout0 };
  }

  if (saleType === "sale" || saleType === "rent") {
    return { mode: saleType, saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null };
  }

  if (saleType === "homestay") {
    return { mode: "homestay", saleType, propertyStatus, shared: null, form: homestayForm, layout0: null };
  }

  const finalType = normalizeLower(pickAny(raw, ["finalType"]));
  if (saleType === "hotel/resort" || finalType.includes("hotel")) {
    return {
      mode: "hotel/resort",
      saleType: "hotel/resort",
      propertyStatus,
      shared: null,
      form: hotelForm,
      layout0: null,
    };
  }

  return { mode: "unknown", saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null };
}
