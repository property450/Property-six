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

function formatMoney(v) {
  if (!isNonEmpty(v)) return "-";
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return `RM ${n.toLocaleString()}`;
}

function formatMaybeList(v) {
  if (!isNonEmpty(v)) return "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return String(v);
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
      transit?.nearTransit;

    const lines =
      transit?.selectedLines ||
      transit?.lines ||
      transit?.line ||
      [];

    const stations =
      transit?.selectedStations ||
      transit?.stations ||
      transit?.station ||
      [];

    const lineText = Array.isArray(lines) ? lines.join(", ") : isNonEmpty(lines) ? String(lines) : "";
    const stationText = Array.isArray(stations)
      ? stations.join(", ")
      : isNonEmpty(stations)
        ? String(stations)
        : "";

    if (isNonEmpty(lineText) || isNonEmpty(stationText)) {
      return [
        yes === false || yes === "否" ? "否" : "是",
        isNonEmpty(lineText) ? `线路: ${lineText}` : "",
        isNonEmpty(stationText) ? `站点: ${stationText}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    }
  }

  if (nearTransit === false || String(nearTransit).toLowerCase() === "no") return "否";
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

  const title = pickAny(
    { obj: rawProperty, keys: ["title"] }
  ) || "（未命名房源）";

  const address = pickAny(
    { obj: rawProperty, keys: ["address"] }
  ) || "-";

  const roomRent = pickAny(
    { obj: room0, keys: ["rent", "roomPrice", "price"] },
    { obj: single, keys: ["rent", "roomPrice", "price"] },
    { obj: rawProperty, keys: ["rentPrice", "price"] }
  );
  const priceText = formatMoney(roomRent);

  const bedrooms = pickAny(
    { obj: room0, keys: ["roomType", "bedrooms", "bedroom", "bedroom_count"] },
    { obj: single, keys: ["roomType", "bedrooms", "bedroom", "bedroom_count"] }
  ) || "-";

  const bathrooms = pickAny(
    { obj: room0, keys: ["bathroomType", "bathrooms", "bathroom", "bathroom_count"] },
    { obj: single, keys: ["bathroomType", "bathrooms", "bathroom", "bathroom_count"] }
  ) || "-";

  const carparks = pickAny(
    { obj: room0, keys: ["carparkCount", "carparks", "carpark", "carpark_count"] },
    { obj: single, keys: ["carparkCount", "carparks", "carpark", "carpark_count"] }
  ) || "-";

  const usage = pickAny(
    { obj: typeForm, keys: ["propertyUsage", "property_usage", "usage"] },
    { obj: single, keys: ["propertyUsage", "property_usage", "usage"] }
  ) || "-";

  const propertyTitle = pickAny(
    { obj: typeForm, keys: ["propertyTitle", "property_title", "titleType"] },
    { obj: single, keys: ["propertyTitle", "property_title", "titleType"] }
  ) || "-";

  const propertyStatus = pickAny(
    { obj: rawProperty, keys: ["propertyStatus", "property_status", "propertystatus"] }
  ) || "房间出租";

  const affordableText = pickAny(
    { obj: typeForm, keys: ["affordableHousing", "affordable_housing", "affordableHousingType", "affordableType"] },
    { obj: single, keys: ["affordableHousing", "affordable_housing", "affordableHousingType", "affordableType"] }
  ) || "-";

  const tenure = pickAny(
    { obj: typeForm, keys: ["tenureType", "tenure_type", "tenure"] },
    { obj: single, keys: ["tenureType", "tenure_type", "tenure"] }
  ) || "-";

  const category = pickAny(
    { obj: typeForm, keys: ["propertyCategory", "property_category", "category"] },
    { obj: single, keys: ["propertyCategory", "property_category", "category"] }
  ) || "-";

  const subType = pickAny(
    { obj: typeForm, keys: ["subType", "sub_type", "propertySubType", "property_sub_type"] },
    { obj: single, keys: ["subType", "sub_type", "propertySubType", "property_sub_type"] }
  ) || "-";

  const storeys = pickAny(
    { obj: typeForm, keys: ["storeys", "storey", "floorCount"] },
    { obj: single, keys: ["storeys", "storey", "floorCount"] }
  ) || "-";

  const propSubtypes = pickAny(
    { obj: typeForm, keys: ["propertySubtype", "propertySubtypes", "property_subtypes", "subtype", "subtypes"] },
    { obj: single, keys: ["propertySubtype", "propertySubtypes", "property_subtypes", "subtype", "subtypes"] }
  );

  const completedYear = pickAny(
    { obj: typeForm, keys: ["completedYear", "completionYear", "completed_year", "completion_year", "buildYear", "build_year"] },
    { obj: single, keys: ["completedYear", "completionYear", "completed_year", "completion_year", "buildYear", "build_year"] }
  ) || "-";

  const transitText = getTransitText(rawProperty, single, room0);

  return {
    active: {
      saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
      propertyStatus,
      form: typeForm,
      shared: single,
      layout0: room0,
    },

    title,
    address,
    priceText,

    bedrooms,
    bathrooms,
    carparks,

    usage,
    propertyTitle,
    propertyStatus,
    affordableText,
    tenure,

    category,
    subType,
    storeys,
    propSubtypes: formatMaybeList(propSubtypes),

    transitText,
    completedYear,
    expectedText: "-",

    showStoreys: shouldShowStoreysByCategory(category) && isNonEmpty(storeys),
    showSubtype: shouldShowPropertySubtypeByCategory(category) && isNonEmpty(propSubtypes),

    isNewProject: false,
    isCompletedUnit: false,

    saleType: rawProperty?.saleType || rawProperty?.sale_type || "Rent",
    auctionDateText: "",
  };
    }
