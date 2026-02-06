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

import { resolveActiveSources, isNewProjectStatus, isCompletedUnitStatus } from "../resolveActiveForm";

// ✅ 兼容 getCardVM.js 的统一入口（不改任何原逻辑）
export function buildVM(rawProperty, active, helpers) {
  // 你的 buildNewProjectVM 自己会 resolve active，所以这里直接复用
  return buildNewProjectVM(rawProperty);
}

/**
 * ✅ New Project VM（完全照你 pages/my-profile.js 的 SellerPropertyCard 取值逻辑搬）
 * - 不改任何逻辑
 * - 只把计算搬出来
 */
export function buildNewProjectVM(rawProperty) {
  const active = resolveActiveSources(rawProperty);

  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = pickPreferActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickPreferActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = pickPreferActive(rawProperty, active, ["carparks", "carpark", "carparkCount", "carpark_count"]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = pickPreferActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus =
    active.propertyStatus || pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);
  const tenure = pickPreferActive(rawProperty, active, ["tenure", "tenure_type"]);

  // ✅✅✅ 关键修复：Property Category 只从 active 表单 json 扫描
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

  // ✅✅✅ Affordable Housing：严格只读 active
  const affordableText = getAffordableTextStrict(active);

  const transitText = getTransitText(rawProperty, active);
  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);

  // ✅ 完成年份：优先 active + 扫描兜底（虽然 New Project 卡片不显示完成年份，但逻辑保持一致）
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

  // ✅ 保留与你原本 my-profile.js 完全一样的分支判断结果
  const isNewProject = isNewProjectStatus(propertyStatus);
  const isCompletedUnit = isCompletedUnitStatus(propertyStatus);

  return {
    // 原始 + active
    rawProperty,
    active,

    // 基础信息
    title,
    address,

    // 价格/房间
    priceText,
    bedrooms,
    bathrooms,
    carparks,

    // 类型信息
    usage,
    propertyTitle,
    propertyStatus,
    tenure,
    category,
    subType,
    storeys,
    propSubtypes,

    // 其它
    affordableText,
    transitText,

    // 年份（原逻辑）
    expectedText,
    completedYear,

    // UI 条件（原逻辑）
    showStoreys,
    showSubtype,
    isNewProject,
    isCompletedUnit,
  };
}
