// utils/property/forms/rentRoom.vm.js

function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

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

function isJsonLikeString(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function safeParseMaybeJson(v) {
  if (v == null) return v;
  if (typeof v === "string" && isJsonLikeString(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function pickAny(...args) {
  const candidates = args.flat();
  for (const item of candidates) {
    if (!item) continue;
    const { obj, keys } = item;
    if (!obj || !Array.isArray(keys)) continue;

    for (const key of keys) {
      const value = key.includes(".") || key.includes("[") ? deepGet(obj, key) : obj?.[key];
      if (isNonEmpty(value)) return value;
    }
  }
  return "";
}

function normalizeArray(v) {
  if (!isNonEmpty(v)) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function displayFromObject(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(displayFromObject).filter(Boolean).join(", ");
  if (typeof v === "object") {
    return (
      v.label ||
      v.name ||
      v.title ||
      v.value ||
      v.station ||
      v.stationName ||
      v.line ||
      v.lineName ||
      v.code ||
      v.type ||
      ""
    );
  }
  return "";
}

function formatList(v) {
  if (!isNonEmpty(v)) return "-";
  if (Array.isArray(v)) {
    const arr = v.map(displayFromObject).filter(Boolean);
    return arr.length ? arr.join(", ") : "-";
  }
  if (typeof v === "object") {
    const s = displayFromObject(v);
    return s || "-";
  }
  return String(v);
}

function parseNumber(v) {
  if (!isNonEmpty(v)) return 0;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(v) {
  if (!isNonEmpty(v)) return "-";
  const n = parseNumber(v);
  if (!Number.isFinite(n) || n <= 0) return String(v);
  return `RM ${n.toLocaleString()}`;
}

function formatAreaText(v, unit) {
  if (!isNonEmpty(v)) return "-";
  const val = String(v);
  return unit ? `${val} ${unit}` : val;
}

function normalizeTypeForm(rawProperty) {
  return (
    safeParseMaybeJson(rawProperty?.type_form_v2) ||
    safeParseMaybeJson(rawProperty?.typeForm) ||
    safeParseMaybeJson(rawProperty?.type_form) ||
    {}
  );
}

function normalizeSingleForm(rawProperty) {
  return (
    safeParseMaybeJson(rawProperty?.single_form_data_v2) ||
    safeParseMaybeJson(rawProperty?.singleFormData) ||
    safeParseMaybeJson(rawProperty?.single_form_data) ||
    {}
  );
}

function normalizeLayouts(rawProperty) {
  const v =
    safeParseMaybeJson(rawProperty?.unitLayouts) ||
    safeParseMaybeJson(rawProperty?.unit_layouts) ||
    [];
  return Array.isArray(v) ? v : [];
}

function normalizeArea(rawProperty, room0, single) {
  const area =
    safeParseMaybeJson(room0?.areaData) ||
    safeParseMaybeJson(room0?.area) ||
    safeParseMaybeJson(single?.areaData) ||
    safeParseMaybeJson(single?.area) ||
    safeParseMaybeJson(rawProperty?.areaData) ||
    safeParseMaybeJson(rawProperty?.area_data) ||
    {};

  const values = area?.values || {};
  const units = area?.units || {};

  const buildUp =
    values.buildUp ??
    values.builtUp ??
    values.build_up ??
    values.built_up ??
    area.buildUp ??
    area.builtUp ??
    "";

  const land =
    values.land ??
    values.landArea ??
    values.land_area ??
    area.land ??
    area.landArea ??
    "";

  const buildUpUnit =
    units.buildUp ||
    units.builtUp ||
    units.build_up ||
    units.built_up ||
    "";

  const landUnit =
    units.land ||
    units.landArea ||
    units.land_area ||
    "";

  const buildUpNum = parseNumber(buildUp);
  const landNum = parseNumber(land);

  return {
    buildUpText: formatAreaText(buildUp, buildUpUnit),
    landText: formatAreaText(land, landUnit),
    buildUpNum,
    landNum,
  };
}

function getPSFText(rawProperty, room0, single, buildUpNum, landNum) {
  const direct =
    pickAny(
      { obj: room0, keys: ["psf", "psfValue"] },
      { obj: single, keys: ["psf", "psfValue"] },
      { obj: rawProperty, keys: ["psf", "psfValue"] }
    ) || "";

  if (isNonEmpty(direct)) {
    const n = parseNumber(direct);
    if (n > 0) return `RM ${n.toFixed(2)} / sq ft`;
    return String(direct);
  }

  const rentPrice =
    pickAny(
      { obj: room0, keys: ["rent", "roomPrice", "price"] },
      { obj: single, keys: ["rent", "roomPrice", "price"] },
      { obj: rawProperty, keys: ["rentPrice", "price"] }
    ) || "";

  const rentNum = parseNumber(rentPrice);
  const area = (buildUpNum || 0) + (landNum || 0);

  if (rentNum > 0 && area > 0) {
    return `RM ${(rentNum / area).toFixed(2)} / sq ft`;
  }

  return "-";
}

function formatAllowDeny(v) {
  if (!isNonEmpty(v)) return "-";
  if (v === "allow") return "允许";
  if (v === "deny") return "不允许";
  return String(v);
}

function formatBedTypes(v) {
  if (!isNonEmpty(v)) return "-";
  if (!Array.isArray(v)) return formatList(v);

  const arr = v
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      const type = item.type || item.label || item.name || "";
      const count = item.count ? ` x${item.count}` : "";
      return `${type}${count}`;
    })
    .filter(Boolean);

  return arr.length ? arr.join(", ") : "-";
}

function getTransitText(rawProperty, room0, single) {
  const transit =
    pickAny(
      { obj: room0, keys: ["transit"] },
      { obj: single, keys: ["transit"] },
      { obj: rawProperty, keys: ["transit"] }
    ) || null;

  const nearTransit = pickAny(
    { obj: room0, keys: ["nearTransit"] },
    { obj: single, keys: ["nearTransit"] },
    { obj: rawProperty, keys: ["nearTransit"] }
  );

  if (typeof transit === "string" && transit.trim()) return transit;
  if (typeof nearTransit === "string" && nearTransit.trim() && !transit) return nearTransit;

  if (transit && typeof transit === "object") {
    const yes =
      transit?.canWalkToTransit ??
      transit?.walkable ??
      transit?.enabled ??
      transit?.isNearTransit ??
      transit?.nearTransit ??
      nearTransit;

    const rawLines =
      transit?.selectedLines ||
      transit?.lines ||
      transit?.line ||
      [];

    const rawStations =
      transit?.selectedStations ||
      transit?.stations ||
      transit?.station ||
      [];

    const lineText = formatList(normalizeArray(rawLines));
    const stationText = formatList(normalizeArray(rawStations));

    if (lineText !== "-" || stationText !== "-") {
      return [
        yes === false || yes === "否" ? "否" : "是",
        lineText !== "-" ? `线路: ${lineText}` : "",
        stationText !== "-" ? `站点: ${stationText}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    }

    if (yes === false || yes === "否") return "否";
    if (yes === true || yes === "是") return "是";
  }

  if (nearTransit === false || String(nearTransit).toLowerCase() === "no") return "否";
  if (nearTransit === true || nearTransit === "是") return "是";
  return "-";
}

function shouldShowStoreysByCategory(category) {
  const s = String(category || "").toLowerCase();
  if (!s) return false;
  return !s.includes("land");
}

function shouldShowPropertySubtypeByCategory(category) {
  const s = String(category || "").toLowerCase();
  if (!s) return false;
  return (
    s.includes("apartment") ||
    s.includes("condo") ||
    s.includes("service residence") ||
    s.includes("business") ||
    s.includes("industrial")
  );
}

export function buildVM(rawProperty) {
  const typeForm = normalizeTypeForm(rawProperty);
  const single = normalizeSingleForm(rawProperty);
  const layouts = normalizeLayouts(rawProperty);
  const room0 = layouts[0] || single || {};

  const title = pickAny({ obj: rawProperty, keys: ["title"] }) || "（未命名房源）";
  const address = pickAny({ obj: rawProperty, keys: ["address"] }) || "-";

  const category = pickAny(
    { obj: typeForm, keys: ["propertyCategory", "property_category", "category"] },
    { obj: single, keys: ["propertyCategory", "property_category", "category"] }
  ) || "-";

  const storeys = pickAny(
    { obj: typeForm, keys: ["storeys", "storey", "floorCount"] },
    { obj: single, keys: ["storeys", "storey", "floorCount"] }
  ) || "-";

  const propSubtypes = pickAny(
    { obj: typeForm, keys: ["propertySubtype", "propertySubtypes", "property_subtypes", "subtype", "subtypes"] },
    { obj: single, keys: ["propertySubtype", "propertySubtypes", "property_subtypes", "subtype", "subtypes"] }
  );

  const rentText = formatMoney(
    pickAny(
      { obj: room0, keys: ["rent", "roomPrice", "price"] },
      { obj: single, keys: ["rent", "roomPrice", "price"] },
      { obj: rawProperty, keys: ["rentPrice", "price"] }
    )
  );

  const { buildUpText, landText, buildUpNum, landNum } = normalizeArea(rawProperty, room0, single);
  const psfText = getPSFText(rawProperty, room0, single, buildUpNum, landNum);
  const transitText = getTransitText(rawProperty, room0, single);

  const roomTypeText = pickAny(
    { obj: room0, keys: ["roomType"] },
    { obj: single, keys: ["roomType"] }
  ) || "-";

  const bathroomTypeText = pickAny(
    { obj: room0, keys: ["bathroomType"] },
    { obj: single, keys: ["bathroomType"] }
  ) || "-";

  const bedTypeText = formatBedTypes(
    pickAny(
      { obj: room0, keys: ["bedTypes"] },
      { obj: single, keys: ["bedTypes"] }
    )
  );

  const roomPrivacyText = pickAny(
    { obj: room0, keys: ["roomPrivacy"] },
    { obj: single, keys: ["roomPrivacy"] }
  ) || "-";

  const genderPolicyText = pickAny(
    { obj: room0, keys: ["genderPolicy"] },
    { obj: single, keys: ["genderPolicy"] }
  ) || "-";

  const petAllowedText = formatAllowDeny(
    pickAny(
      { obj: room0, keys: ["petAllowed"] },
      { obj: single, keys: ["petAllowed"] }
    )
  );

  const cookingAllowedText = formatAllowDeny(
    pickAny(
      { obj: room0, keys: ["cookingAllowed"] },
      { obj: single, keys: ["cookingAllowed"] }
    )
  );

  const rentIncludesText = formatList(
    pickAny(
      { obj: room0, keys: ["rentIncludes"] },
      { obj: single, keys: ["rentIncludes"] }
    )
  );

  const cleaningServiceText = pickAny(
    { obj: room0, keys: ["cleaningService"] },
    { obj: single, keys: ["cleaningService"] }
  ) || "-";

  const carparkCountText = pickAny(
    { obj: room0, keys: ["carparkCount", "carparks", "carpark"] },
    { obj: single, keys: ["carparkCount", "carparks", "carpark"] }
  ) || "-";

  const preferredRacesText = formatList(
    pickAny(
      { obj: room0, keys: ["preferredRaces"] },
      { obj: single, keys: ["preferredRaces"] }
    )
  );

  const acceptedTenancyText = formatList(
    pickAny(
      { obj: room0, keys: ["acceptedTenancy"] },
      { obj: single, keys: ["acceptedTenancy"] }
    )
  );

  const availableFromRaw = pickAny(
    { obj: room0, keys: ["availableFrom"] },
    { obj: single, keys: ["availableFrom"] }
  );
  const availableFromText = availableFromRaw || "-";

  return {
    active: {
      saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
      propertyStatus: "出租房间",
      form: typeForm,
      shared: single,
      layout0: room0,
    },

    title,
    address,
    priceText: rentText,

    bedrooms: roomTypeText,
    bathrooms: bathroomTypeText,
    carparks: carparkCountText,

    usage: "-",
    propertyTitle: "-",
    propertyStatus: "出租房间",
    affordableText: "-",
    tenure: "-",

    category,
    subType: "-",
    storeys,
    propSubtypes: formatList(propSubtypes),

    transitText,
    completedYear: "-",
    expectedText: "-",

    showStoreys: shouldShowStoreysByCategory(category) && isNonEmpty(storeys),
    showSubtype: shouldShowPropertySubtypeByCategory(category) && isNonEmpty(propSubtypes),

    isNewProject: false,
    isCompletedUnit: false,
    saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
    auctionDateText: "",

    isRentWhole: false,
    isRentRoom: true,

    buildUpAreaText: buildUpText,
    landAreaText: landText,
    psfText,

    roomTypeText,
    bathroomTypeText,
    bedTypeText,
    roomPrivacyText,
    genderPolicyText,
    petAllowedText,
    cookingAllowedText,
    rentIncludesText,
    cleaningServiceText,
    carparkCountText,
    preferredRacesText,
    acceptedTenancyText,
    availableFromText,
  };
}
