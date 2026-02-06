// utils/property/forms/subsale.vm.js

import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  findBestCategoryStrict,
  getAffordableTextStrict,
  getTransitText,
  getCardPriceText,
  findBestCompletedYear,
  shouldShowStoreysByCategory,
  shouldShowPropertySubtypeByCategory,
  formatCarparks,
} from "../pickers";

import {
  resolveActiveForm,
  isNewProjectStatus,
  isCompletedUnitStatus,
} from "../resolveActiveForm";

/**
 * ✅ Subsale VM（只改“显示规则”，不改你页面 UI）
 * - Subsale：只显示完成年份 completedYear
 * - Subsale：不显示预计完成年份 expectedText
 */
export function buildVM(rawProperty) {
  const active = resolveActiveForm(rawProperty);

  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = pickPreferActive(rawProperty, active, [
    "bedrooms",
    "bedroom_count",
    "room_count",
  ]);
  const bathrooms = pickPreferActive(rawProperty, active, [
    "bathrooms",
    "bathroom_count",
  ]);

  const carparksRaw = pickPreferActive(rawProperty, active, [
    "carparks",
    "carpark",
    "carparkCount",
    "carpark_count",
  ]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = pickPreferActive(rawProperty, active, [
    "propertyTitle",
    "property_title",
  ]);

  const propertyStatus =
    active.propertyStatus ||
    pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);

  const tenure = pickPreferActive(rawProperty, active, ["tenure", "tenure_type"]);

  const category = findBestCategoryStrict(active);

  const subType = pickPreferActive(rawProperty, active, [
    "subType",
    "sub_type",
    "property_sub_type",
  ]);

  const storeys = pickPreferActive(rawProperty, active, [
    "storeys",
    "storey",
    "floorCount",
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

  // ✅ 价格仍旧用同一套规则（照你现在跑通的逻辑）
  const priceText = getCardPriceText(
    rawProperty,
    active,
    isNewProjectStatus,
    isCompletedUnitStatus
  );

  // ✅ 完成年份：照你 newProject.vm.js 的逻辑
  let completedYear = pickPreferActive(rawProperty, active, [
    "completedYear",
    "built_year",
    "completed_year",
    "completionYear",
    "buildYear",
    "build_year",
  ]);

  if (!isNonEmpty(completedYear)) {
    const bestC1 = findBestCompletedYear(active.shared);
    const bestC2 = findBestCompletedYear(active.layout0);
    const bestC3 = findBestCompletedYear(active.form);
    const bestC = bestC1 || bestC2 || bestC3;
    if (bestC && bestC.year) completedYear = String(bestC.year);
  }

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  // ✅ Subsale：明确不显示预计完成年份
  const expectedText = null;

  // ✅ 保留这两个字段，避免 UI 里某些判断依赖它们（不改 UI）
  const isNewProject = false;
  const isCompletedUnit = false;

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

    expectedText,
    completedYear,

    showStoreys,
    showSubtype,

    isNewProject,
    isCompletedUnit,
  };
}
