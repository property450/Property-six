// utils/property/forms/newProject.vm.js

import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  findBestCategoryStrict,
  getAffordableTextStrict,
  getTransitText,
  getCardPriceText,
  getExpectedCompletionText,
  findBestCompletedYear,
  shouldShowStoreysByCategory,
  shouldShowPropertySubtypeByCategory,
  formatCarparks,
} from "../pickers";

// ❗️这里用对函数名
import {
  resolveActiveForm,
  isNewProjectStatus,
  isCompletedUnitStatus,
} from "../resolveActiveForm";

/**
 * ✅ New Project VM
 * 完全沿用你原本 my-profile.js 里的逻辑
 * 只是把逻辑搬出来
 */
export function buildNewProjectVM(rawProperty) {
  // ✅ 用正确的 resolver
  const active = resolveActiveForm(rawProperty);

  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = pickPreferActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickPreferActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = pickPreferActive(rawProperty, active, [
    "carparks",
    "carpark",
    "carparkCount",
    "carpark_count",
  ]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = pickPreferActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus =
    active.propertyStatus || pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);
  const tenure = pickPreferActive(rawProperty, active, ["tenure", "tenure_type"]);

  // ✅ Property Category：严格从 active 表单扫描
  const category = findBestCategoryStrict(active);

  const subType = pickPreferActive(rawProperty, active, ["subType", "sub_type", "property_sub_type"]);
  const storeys = pickPreferActive(rawProperty, active, ["storeys", "storey", "floorCount"]);
  const propSubtypes = pickPreferActive(rawProperty, active, [
    "propertySubtypes",
    "property_subtypes",
    "propertySubtype",
    "subtypes",
    "subtype",
  ]);

  const affordableText = getAffordableTextStrict(active);
  const transitText = getTransitText(rawProperty, active);
  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);

  // 完成年份（逻辑照旧）
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

  // 保留你原本的判断结果（给 my-profile 用）
  const isNewProject = isNewProjectStatus(propertyStatus);
  const isCompletedUnit = isCompletedUnitStatus(propertyStatus);

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

