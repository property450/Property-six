// utils/property/forms/rentWhole.vm.js

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
  if (Array.isArray(v)) {
    return v.map(displayFromObject).filter(Boolean).join(", ");
  }
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

function formatMoney(v) {
  if (!isNonEmpty(v)) return "-";
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return `RM ${n.toLocaleString()}`;
}

function parseNumber(v) {
  if (!isNonEmpty(v)) return 0;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
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

function normalizeArea(rawProperty, single, layout0) {
  const area =
    safeParseMaybeJson(single?.areaData) ||
    safeParseMaybeJson(single?.area) ||
    safeParseMaybeJson(layout0?.areaData) ||
    safeParseMaybeJson(layout0?.area) ||
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

function getPSFText(rawProperty, single, layout0, buildUpNum, landNum) {
  const direct =
    pickAny(
      { obj: single, keys: ["psf", "psfValue"] },
      { obj: layout0, keys: ["psf", "psfValue"] },
      { obj: rawProperty, keys: ["psf", "psfValue"] }
    ) || "";

  if (isNonEmpty(direct)) {
    const n = parseNumber(direct);
    if (n > 0) return `RM ${n.toFixed(2)} / sq ft`;
    return String(direct);
  }

  const rentPrice =
    pickAny(
      { obj: single, keys: ["rent", "rentPrice", "price"] },
      { obj: layout0, keys: ["rent", "rentPrice", "price"] },
      { obj: rawProperty, keys: ["rentPrice", "price"] }
    ) || "";

  const rentNum = parseNumber(rentPrice);
  const area = buildUpNum > 0 ? buildUpNum : landNum;

  if (rentNum > 0 && area > 0) {
    return `RM ${(rentNum / area).toFixed(2)} / sq ft`;
  }

  return "-";
}

function getTransitText(rawProperty, single, layout0) {
  const transit =
    pickAny(
      { obj: single, keys: ["transit"] },
      { obj: layout0, keys: ["transit"] },
      { obj: rawProperty, keys: ["transit"] }
    ) || null;

  const nearTransit = pickAny(
    { obj: single, keys: ["nearTransit"] },
    { obj: layout0, keys: ["nearTransit"] },
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
  const layout0 = layouts[0] || {};

  const title = pickAny({ obj: rawProperty, keys: ["title"] }) || "（未命名房源）";
  const address = pickAny({ obj: rawProperty, keys: ["address"] }) || "-";

  const priceText = formatMoney(
    pickAny(
      { obj: single, keys: ["rent", "rentPrice", "price"] },
      { obj: layout0, keys: ["rent", "rentPrice", "price"] },
      { obj: rawProperty, keys: ["rentPrice", "price"] }
    )
  );

  const bedrooms = pickAny(
    { obj: single, keys: ["bedrooms", "bedroom_count", "room_count"] },
    { obj: layout0, keys: ["bedrooms", "bedroom_count", "room_count"] },
    { obj: rawProperty, keys: ["bedrooms", "bedroom_count", "room_count"] }
  ) || "-";

  const bathrooms = pickAny(
    { obj: single, keys: ["bathrooms", "bathroom_count"] },
    { obj: layout0, keys: ["bathrooms", "bathroom_count"] },
    { obj: rawProperty, keys: ["bathrooms", "bathroom_count"] }
  ) || "-";

  const carparks = pickAny(
    { obj: single, keys: ["carparks", "carpark", "carparkCount", "carpark_count"] },
    { obj: layout0, keys: ["carparks", "carpark", "carparkCount", "carpark_count"] },
    { obj: rawProperty, keys: ["carparks", "carpark", "carparkCount", "carpark_count"] }
  ) || "-";

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

  const { buildUpText, landText, buildUpNum, landNum } = normalizeArea(rawProperty, single, layout0);
  const psfText = getPSFText(rawProperty, single, layout0, buildUpNum, landNum);
  const transitText = getTransitText(rawProperty, single, layout0);

  return {
    active: {
      saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
      propertyStatus: "整租",
      form: typeForm,
      shared: single,
      layout0,
    },

    title,
    address,
    priceText,

    bedrooms,
    bathrooms,
    carparks,

    usage: "-",
    propertyTitle: "-",
    propertyStatus: "整租",
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

    isRentWhole: true,
    isRentRoom: false,

    buildUpAreaText: buildUpText,
    landAreaText: landText,
    psfText,
  };
}
