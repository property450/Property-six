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
   本文件专用小工具
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

function normalizeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function pickFromActiveOnly(active, candidates) {
  const sources = [active?.shared, active?.layout0, active?.form].filter(Boolean);

  for (const src of sources) {
    for (const key of candidates) {
      const v = key.includes(".") || key.includes("[") ? deepGet(src, key) : src?.[key];
      if (isNonEmpty(v)) return v;
    }
  }
  return "";
}

function looksLikeInvalidCategory(v) {
  if (!isNonEmpty(v)) return true;

  const s = String(v).trim();
  const lower = s.toLowerCase();

  // ❌ 这些明显不是 property category
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
    ].includes(lower)
  ) {
    return true;
  }

  // ❌ 纯数字也不是 category（你截图里 300000 就是这种）
  if (/^\d+(\.\d+)?$/.test(s.replace(/,/g, ""))) return true;

  return false;
}

function pickCategoryStrictForSubsale(active) {
  const candidates = [
    "propertyCategory",
    "property_category",
    "category",
    "property.category",
    "listing.propertyCategory",
    "form.propertyCategory",
    "type.propertyCategory",
  ];

  const v = pickFromActiveOnly(active, candidates);
  if (looksLikeInvalidCategory(v)) return "";
  return String(v).trim();
}

function pickSubTypeStrictForSubsale(active) {
  const candidates = [
    "subType",
    "sub_type",
    "propertySubType",
    "property_sub_type",
    "property.subType",
    "listing.subType",
  ];

  const v = pickFromActiveOnly(active, candidates);
  if (!isNonEmpty(v)) return "";
  if (/^\d+(\.\d+)?$/.test(String(v).replace(/,/g, ""))) return "";
  return String(v).trim();
}

function pickPropertyUsageStrict(active) {
  return (
    pickFromActiveOnly(active, [
      "usage",
      "propertyUsage",
      "property_usage",
      "property.usage",
      "listing.usage",
    ]) || ""
  );
}

function pickPropertyTitleStrict(active) {
  return (
    pickFromActiveOnly(active, [
      "propertyTitle",
      "property_title",
      "titleType",
      "property.title",
      "listing.propertyTitle",
    ]) || ""
  );
}

function pickTenureStrict(active) {
  return (
    pickFromActiveOnly(active, [
      "tenure",
      "tenureType",
      "tenure_type",
      "property.tenure",
      "listing.tenure",
    ]) || ""
  );
}

function pickCompletedYearStrict(active) {
  const v = pickFromActiveOnly(active, [
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

  const bedrooms = pickPreferActive(rawProperty, active, [
    "bedrooms",
    "bedroom_count",
    "room_count",
    "rooms",
  ]);

  const bathrooms = pickPreferActive(rawProperty, active, [
    "bathrooms",
    "bathroom_count",
    "toilets",
  ]);

  const carparksRaw = pickPreferActive(rawProperty, active, [
    "carparks",
    "carpark",
    "carparkCount",
    "carpark_count",
    "parking",
  ]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  // ✅ 这些改成 strict active-only，避免读不到 / 读错
  const usage = pickPropertyUsageStrict(active);
  const propertyTitle = pickPropertyTitleStrict(active);
  const tenure = pickTenureStrict(active);

  const propertyStatus =
    active?.propertyStatus ||
    pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) ||
    "-";

  const category = pickCategoryStrictForSubsale(active);
  const subType = pickSubTypeStrictForSubsale(active);

  const storeys = pickPreferActive(rawProperty, active, [
    "storeys",
    "storey",
    "floorCount",
    "property.storeys",
  ]);

  const propSubtypes = pickPreferActive(rawProperty, active, [
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

  // ✅ Subsale 只显示完成年份，不显示预计完成年份
  const completedYear = pickCompletedYearStrict(active);
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
  };
}
