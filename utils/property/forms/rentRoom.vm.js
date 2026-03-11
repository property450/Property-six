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

function getTransitText(room0, single, rawProperty) {
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

  if (transit && typeof transit === "object") {
    const yes =
      transit?.canWalkToTransit ??
      transit?.walkable ??
      transit?.enabled ??
      transit?.isNearTransit ??
      transit?.nearTransit ??
      nearTransit;

    const lineText = formatList(
      transit?.selectedLines || transit?.lines || transit?.line || []
    );

    const stationText = formatList(
      transit?.selectedStations || transit?.stations || transit?.station || []
    );

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

  return "-";
}

function getAreaInfo(room0, single, rawProperty) {
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
    buildUpText: isNonEmpty(buildUp) ? `${buildUp}${buildUpUnit ? ` ${buildUpUnit}` : ""}` : "-",
    landText: isNonEmpty(land) ? `${land}${landUnit ? ` ${landUnit}` : ""}` : "-",
    buildUpNum,
    landNum,
  };
}

export function buildVM(rawProperty) {
  const typeForm = normalizeTypeForm(rawProperty);
  const single = normalizeSingleForm(rawProperty);
  const layouts = normalizeLayouts(rawProperty);
  const room0 = layouts[0] || single || {};

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

  const { buildUpText, landText, buildUpNum, landNum } = getAreaInfo(room0, single, rawProperty);

  const rentValue = pickAny(
    { obj: room0, keys: ["rent", "roomPrice", "price"] },
    { obj: single, keys: ["rent", "roomPrice", "price"] },
    { obj: rawProperty, keys: ["rentPrice", "price"] }
  );

  const psfDirect = pickAny(
    { obj: room0, keys: ["psf", "psfValue"] },
    { obj: single, keys: ["psf", "psfValue"] },
    { obj: rawProperty, keys: ["psf", "psfValue"] }
  );

  let psfText = "-";
  if (isNonEmpty(psfDirect)) {
    const n = parseNumber(psfDirect);
    psfText = n > 0 ? `RM ${n.toFixed(2)} / sq ft` : String(psfDirect);
  } else {
    const rentNum = parseNumber(rentValue);
    const area = (buildUpNum || 0) + (landNum || 0);
    if (rentNum > 0 && area > 0) psfText = `RM ${(rentNum / area).toFixed(2)} / sq ft`;
  }

  return {
    title: pickAny({ obj: rawProperty, keys: ["title"] }) || "（未命名房源）",
    address: pickAny({ obj: rawProperty, keys: ["address"] }) || "-",
    priceText: formatMoney(rentValue),

    propertyStatus: "出租房间",
    category,
    storeys,
    propSubtypes: formatList(propSubtypes),

    transitText: getTransitText(room0, single, rawProperty),

    isRentWhole: false,
    isRentRoom: true,

    buildUpAreaText: buildUpText,
    landAreaText: landText,
    psfText,

    roomTypeText: pickAny(
      { obj: room0, keys: ["roomType"] },
      { obj: single, keys: ["roomType"] }
    ) || "-",

    bathroomTypeText: pickAny(
      { obj: room0, keys: ["bathroomType"] },
      { obj: single, keys: ["bathroomType"] }
    ) || "-",

    bedTypeText: formatBedTypes(
      pickAny(
        { obj: room0, keys: ["bedTypes"] },
        { obj: single, keys: ["bedTypes"] }
      )
    ),

    roomPrivacyText: pickAny(
      { obj: room0, keys: ["roomPrivacy"] },
      { obj: single, keys: ["roomPrivacy"] }
    ) || "-",

    genderPolicyText: pickAny(
      { obj: room0, keys: ["genderPolicy"] },
      { obj: single, keys: ["genderPolicy"] }
    ) || "-",

    petAllowedText: formatAllowDeny(
      pickAny(
        { obj: room0, keys: ["petAllowed"] },
        { obj: single, keys: ["petAllowed"] }
      )
    ),

    cookingAllowedText: formatAllowDeny(
      pickAny(
        { obj: room0, keys: ["cookingAllowed"] },
        { obj: single, keys: ["cookingAllowed"] }
      )
    ),

    rentIncludesText: formatList(
      pickAny(
        { obj: room0, keys: ["rentIncludes"] },
        { obj: single, keys: ["rentIncludes"] }
      )
    ),

    cleaningServiceText: pickAny(
      { obj: room0, keys: ["cleaningService"] },
      { obj: single, keys: ["cleaningService"] }
    ) || "-",

    carparkCountText: pickAny(
      { obj: room0, keys: ["carparkCount", "carparks", "carpark"] },
      { obj: single, keys: ["carparkCount", "carparks", "carpark"] }
    ) || "-",

    preferredRacesText: formatList(
      pickAny(
        { obj: room0, keys: ["preferredRaces"] },
        { obj: single, keys: ["preferredRaces"] }
      )
    ),

    acceptedTenancyText: formatList(
      pickAny(
        { obj: room0, keys: ["acceptedTenancy"] },
        { obj: single, keys: ["acceptedTenancy"] }
      )
    ),

    availableFromText: pickAny(
      { obj: room0, keys: ["availableFrom"] },
      { obj: single, keys: ["availableFrom"] }
    ) || "-",

    showStoreys: isNonEmpty(storeys) && !String(category).toLowerCase().includes("land"),
    showSubtype: isNonEmpty(propSubtypes),

    saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
  };
}
