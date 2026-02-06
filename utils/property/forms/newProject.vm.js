// utils/property/forms/newProject.vm.js

export function buildVM(rawProperty, active, h) {
  const title = h.pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = h.pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = h.pickPreferActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = h.pickPreferActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = h.pickPreferActive(rawProperty, active, ["carparks", "carpark", "carparkCount", "carpark_count"]);
  const carparks = h.isNonEmpty(carparksRaw) ? h.formatCarparks(carparksRaw) : "-";

  const usage = h.pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = h.pickPreferActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus =
    active.propertyStatus || h.pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);
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

  const expectedText = h.getExpectedCompletionText(rawProperty, active);

  let completedYear = h.pickPreferActive(rawProperty, active, [
    "completedYear",
    "built_year",
    "completed_year",
    "completionYear",
    "buildYear",
    "build_year",
  ]);
  if (!h.isNonEmpty(completedYear)) {
    const bestC1 = h.findBestCompletedYear(active.shared);
    const bestC2 = h.findBestCompletedYear(active.layout0);
    const bestC3 = h.findBestCompletedYear(active.form);
    const bestC = bestC1 || bestC2 || bestC3;
    if (bestC && bestC.year) completedYear = String(bestC.year);
  }

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

    expectedText,
    completedYear,

    showStoreys,
    showSubtype,
  };
}
