// utils/property/forms/subsale.vm.js

import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  getAffordableTextStrict,
  getTransitText,
  getCardPriceText,
  shouldShowStoreysByCategory,
  shouldShowPropertySubtypeByCategory,
  formatCarparks,
} from "../pickers";

import {
  resolveActiveForm,
  isNewProjectStatus,
  isCompletedUnitStatus,
} from "../resolveActiveForm";

/* =========================
   helpers
========================= */
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

// ✅ active 优先，读不到再 fallback rawProperty
function pickActiveThenRaw(rawProperty, active, candidates) {
  const v1 = pickPreferActive(rawProperty, active, candidates);
  if (isNonEmpty(v1)) return v1;

  for (const key of candidates) {
    const v =
      key.includes(".") || key.includes("[")
        ? deepGet(rawProperty, key)
        : rawProperty?.[key];
    if (isNonEmpty(v)) return v;
  }

  return "";
}

function looksLikeInvalidCategory(v) {
  if (!isNonEmpty(v)) return true;

  const s = String(v).trim().toLowerCase();

  if (
    [
      "sale",
      "rent",
      "homestay",
      "hotel",
      "resort",
      "hotel/resort",
      "subsale / secondary market",
      "new project / under construction",
      "completed unit / developer unit",
      "auction property",
    ].includes(s)
  ) {
    return true;
  }

  // 纯数字不是 category
  if (/^\d+(\.\d+)?$/.test(String(v).replace(/,/g, ""))) return true;

  return false;
}

/* =========================
   subsale 专属字段读取
========================= */
function pickUsage(rawProperty, active) {
  return (
    pickActiveThenRaw(rawProperty, active, [
      "usage",
      "propertyUsage",
      "property_usage",
      "property.usage",
      "listing.usage",

      // raw columns 常见
      "usage",
      "property_usage",
      "propertyUsage",
    ]) || ""
  );
}

function pickPropertyTitle(rawProperty, active) {
  return (
    pickActiveThenRaw(rawProperty, active, [
      "propertyTitle",
      "property_title",
      "titleType",
      "property.title",
      "listing.propertyTitle",

      // raw columns 常见
      "propertyTitle",
      "property_title",
      "title_type",
    ]) || ""
  );
}

function pickTenure(rawProperty, active) {
  return (
    pickActiveThenRaw(rawProperty, active, [
      "tenure",
      "tenureType",
      "tenure_type",
      "property.tenure",
      "listing.tenure",

      // raw columns 常见
      "tenure",
      "tenure_type",
      "tenureType",
    ]) || ""
  );
}

function pickCategory(rawProperty, active) {
  const v = pickActiveThenRaw(rawProperty, active, [
    "propertyCategory",
    "property_category",
    "category",
    "property.category",
    "listing.propertyCategory",
    "form.propertyCategory",

    // raw columns 常见
    "propertyCategory",
    "property_category",
    "category",
  ]);

  if (looksLikeInvalidCategory(v)) return "";
  return String(v).trim();
}

function pickSubType(rawProperty, active) {
  const v = pickActiveThenRaw(rawProperty, active, [
    "subType",
    "sub_type",
    "propertySubType",
    "property_sub_type",
    "property.subType",
    "listing.subType",

    // raw columns 常见
    "subType",
    "sub_type",
    "property_sub_type",
  ]);

  if (!isNonEmpty(v)) return "";
  if (/^\d+(\.\d+)?$/.test(String(v).replace(/,/g, ""))) return "";
  return String(v).trim();
}

function pickCompletedYear(rawProperty, active) {
  const v = pickActiveThenRaw(rawProperty, active, [
    "completedYear",
    "completed_year",
    "completionYear",
    "completion_year",
    "buildYear",
    "build_year",
    "builtYear",
    "built_year",
    "yearCompleted",
    "year_completed",

    "data.completedYear",
    "data.completed_year",
    "data.completionYear",
    "data.completion_year",
    "data.buildYear",
    "data.build_year",

    "meta.completedYear",
    "meta.completed_year",
    "meta.completionYear",
    "meta.completion_year",
    "meta.buildYear",
    "meta.build_year",

    // raw columns 常见
    "completedYear",
    "completed_year",
    "completionYear",
    "completion_year",
    "buildYear",
    "build_year",
    "built_year",
  ]);

  if (!isNonEmpty(v)) return "";
  return String(v).trim();
}

/* =========================
   Subsale VM
========================= */
export function buildVM(rawProperty) {
  const active = resolveActiveForm(rawProperty);

  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = pickActiveThenRaw(rawProperty, active, [
    "bedrooms",
    "bedroom_count",
    "room_count",
    "rooms",
    "bedroom",
  ]);

  const bathrooms = pickActiveThenRaw(rawProperty, active, [
    "bathrooms",
    "bathroom_count",
    "toilets",
    "bathroom",
  ]);

  const carparksRaw = pickActiveThenRaw(rawProperty, active, [
    "carparks",
    "carpark",
    "carparkCount",
    "carpark_count",
    "parking",
  ]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickUsage(rawProperty, active);
  const propertyTitle = pickPropertyTitle(rawProperty, active);
  const tenure = pickTenure(rawProperty, active);

  const propertyStatus =
    active?.propertyStatus ||
    pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) ||
    "-";

  const category = pickCategory(rawProperty, active);
  const subType = pickSubType(rawProperty, active);

  const storeys = pickActiveThenRaw(rawProperty, active, [
    "storeys",
    "storey",
    "floorCount",
    "property.storeys",
    "storeys_count",
  ]);

  const propSubtypes = pickActiveThenRaw(rawProperty, active, [
    "propertySubtypes",
    "property_subtypes",
    "propertySubtype",
    "subtypes",
    "subtype",
  ]);

  const affordableText = getAffordableTextStrict(active);
  const transitText = getTransitText(rawProperty, active);

  const priceText = getCardPriceText(
    rawProperty,
    active,
    isNewProjectStatus,
    isCompletedUnitStatus
  );

  // ✅ Subsale：只显示完成年份
  const completedYear = pickCompletedYear(rawProperty, active);
  const expectedText = "";

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  return {
    active,

    title,
    address,

    priceText,
    bedrooms,
    bathrooms,
    carparks,

    usage,
    propertyTitle,
    propertyStatus,
    tenure,

    category,
    subType,
    storeys,
    propSubtypes,

    affordableText,
    transitText,

    completedYear,
    expectedText,

    showStoreys,
    showSubtype,

    isNewProject: false,
    isCompletedUnit: false,

    saleType:
      active?.saleType ||
      rawProperty?.saleType ||
      rawProperty?.sale_type ||
      "",
  };
}
