// utils/property/forms/auction.vm.js

export { buildVM } from "./newProject.vm";

export function buildVM(rawProperty, active, h) {
  // === 基础通用（和其他表单一致）===
  const title = h.pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = h.pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = h.pickPreferActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = h.pickPreferActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = h.pickPreferActive(rawProperty, active, [
    "carparks",
    "carpark",
    "carparkCount",
    "carpark_count",
  ]);
  const carparks = h.isNonEmpty(carparksRaw) ? h.formatCarparks(carparksRaw) : "-";

  const usage = h.pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = h.pickPreferActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus = active.propertyStatus;
  const tenure = h.pickPreferActive(rawProperty, active, ["tenure", "tenure_type"]);

  const category = h.findBestCategoryStrict(active);
  const subType = h.pickPreferActive(rawProperty, active, ["subType", "sub_type", "property_sub_type"]);
  const storeys = h.pickPreferActive(rawProperty, active, ["storeys", "storey", "floorCount"]);
  const propSubtypes = h.pickPreferActive(rawProperty, active, [
    "propertySubtypes",
    "property_subtypes",
    "propertySubtype",
    "subtypes",
    "subtype",
  ]);

  const affordableText = h.getAffordableTextStrict(active);
  const transitText = h.getTransitText(rawProperty, active);
  const priceText = h.getCardPriceText(rawProperty, active, h.isNewProjectStatus, h.isCompletedUnitStatus);

  // === Auction 专属：Auction Date（严格只读 active）===
  const auctionDate =
    h.pickPreferActive(rawProperty, active, [
      "auctionDate",
      "auction_date",
      "auction.date",
      "auctionDateText",
    ]) || "-";

  const showStoreys = h.shouldShowStoreysByCategory(category);
  const showSubtype = h.shouldShowPropertySubtypeByCategory(category);

  return {
    active,
    title,
    address,

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
    priceText,

    // ✅ Auction 专属字段
    auctionDate,

    // ❌ Auction 不需要完成/预计完成年份
    completedYear: null,
    expectedText: null,

    showStoreys,
    showSubtype,
  };
}
