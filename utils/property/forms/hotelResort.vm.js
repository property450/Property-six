// utils/property/forms/hotelResort.vm.js

import {
  isNonEmpty,
  pickAny,
  getTransitText,
  getCardPriceText,
  formatCarparks,
} from "../pickers";

function asText(v) {
  if (!isNonEmpty(v)) return "-";

  if (Array.isArray(v)) {
    const parts = v
      .map((item) => {
        if (item == null) return "";

        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }

        if (typeof item === "object") {
          const label = item.label || item.name || item.type || "";
          const count = item.count || item.qty || item.quantity || "";

          if (label && count) return `${label} x ${count}`;
          if (label) return String(label);
          if (count) return String(count);

          return "";
        }

        return "";
      })
      .filter(Boolean);

    return parts.length ? parts.join(", ") : "-";
  }

  if (typeof v === "object") {
    if ("value" in v || "amount" in v || "note" in v || "mode" in v) {
      const amount = v.value || v.amount || "";
      const note = v.note || "";
      if (amount && note) return `${amount}（${note}）`;
      if (amount) return String(amount);
      if (note) return String(note);
      return "-";
    }

    if ("label" in v && v.label) return String(v.label);
    if ("type" in v && v.type) return String(v.type);
    if ("name" in v && v.name) return String(v.name);

    return "-";
  }

  return String(v);
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

function pickFrom(obj, candidates) {
  if (!obj) return undefined;
  for (const key of candidates) {
    const v = key.includes(".") || key.includes("[") ? deepGet(obj, key) : obj?.[key];
    if (isNonEmpty(v)) return v;
  }
  return undefined;
}

function pickEverywhere(rawProperty, active, candidates) {
  const typeForm =
    rawProperty?.type_form_v2 ||
    rawProperty?.typeForm ||
    rawProperty?.type_form ||
    {};

  const single =
    rawProperty?.single_form_data_v2 ||
    rawProperty?.singleFormData ||
    rawProperty?.single_form_data ||
    {};

  const hotelForm = rawProperty?.hotel_resort_form || {};

  return (
    pickFrom(active, candidates) ??
    pickFrom(typeForm, candidates) ??
    pickFrom(single, candidates) ??
    pickFrom(hotelForm, candidates) ??
    pickFrom(rawProperty, candidates)
  );
}

function getFirstRoomLayout(rawProperty, active) {
  const single =
    rawProperty?.single_form_data_v2 ||
    rawProperty?.singleFormData ||
    rawProperty?.single_form_data ||
    {};

  const typeForm =
    rawProperty?.type_form_v2 ||
    rawProperty?.typeForm ||
    rawProperty?.type_form ||
    {};

  const hotelForm = rawProperty?.hotel_resort_form || {};

  const sources = [active, single, hotelForm, typeForm, rawProperty];

  for (const src of sources) {
    const roomLayouts = src?.roomLayouts;
    if (Array.isArray(roomLayouts) && roomLayouts.length > 0) return roomLayouts[0];

    const room_layouts = src?.room_layouts;
    if (Array.isArray(room_layouts) && room_layouts.length > 0) return room_layouts[0];

    const layouts = src?.layouts;
    if (Array.isArray(layouts) && layouts.length > 0) return layouts[0];

    const roomTypes = src?.roomTypes;
    if (Array.isArray(roomTypes) && roomTypes.length > 0) return roomTypes[0];

    const rooms = src?.rooms;
    if (Array.isArray(rooms) && rooms.length > 0) return rooms[0];
  }

  return null;
}

function formatBeds(beds) {
  if (!Array.isArray(beds) || beds.length === 0) return "-";

  const parts = beds
    .map((b) => {
      if (!b || typeof b !== "object") return "";
      const label = b.label || b.name || b.type || "";
      const count = b.count || b.qty || b.quantity || "";
      if (label && count) return `${label} x ${count}`;
      return label || "";
    })
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
}

function formatGuests(guests) {
  if (!guests || typeof guests !== "object") return "-";

  const adults = Number(guests.adults || 0);
  const children = Number(guests.children || 0);
  const total = adults + children;

  if (total <= 0) return "-";
  if (adults > 0 && children > 0) return `${total}（大人 ${adults}，小孩 ${children}）`;
  if (adults > 0) return `${adults}`;
  return `${children}`;
}

function mapSmokingText(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "-";
  if (["yes", "allowed", "allow", "can"].includes(s)) return "能";
  if (["no", "forbidden", "not_allowed", "not allowed"].includes(s)) return "不能";
  return String(v);
}

function mapCheckinServiceText(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "-";
  if (s === "self") return "自助入住";
  if (s === "frontdesk") return "24 小时前台服务";
  if (s === "limited") return "入住时间限制";
  return String(v);
}

function mapPetPolicyText(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "-";
  if (s === "forbidden") return "禁止携带宠物";
  if (s === "allowed") return "允许携带宠物";
  if (s === "care") return "提供宠物托管服务";
  return String(v);
}

function mapCancelText(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "-";
  if (s === "free") return "能";
  if (s === "no") return "不能";
  return String(v);
}

function mapYesNoText(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "-";
  if (s === "yes") return "是";
  if (s === "no") return "否";
  return String(v);
}

function formatPercentValue(v) {
  if (v === null || v === undefined || v === "") return "-";
  const s = String(v).trim();
  if (!s) return "-";
  return s.includes("%") ? s : `${s}%`;
}

function formatMoneyValue(v) {
  if (v === null || v === undefined || v === "") return "-";
  const s = String(v).trim();
  if (!s) return "-";
  return s.toUpperCase().startsWith("RM") ? s : `RM${s}`;
}

function pickHotelPrice(firstLayout, rawProperty, active, helpers) {
  const roomTypePrice =
    firstLayout?.price ||
    firstLayout?.basePrice ||
    firstLayout?.defaultPrice ||
    rawProperty?.hotel_resort_form?.roomTypes?.[0]?.price ||
    rawProperty?.roomTypes?.[0]?.price;

  if (isNonEmpty(roomTypePrice)) return formatMoneyValue(roomTypePrice);

  return getCardPriceText(
    rawProperty,
    active,
    helpers.isNewProjectStatus,
    helpers.isCompletedUnitStatus
  );
}

export function buildVM(rawProperty, active, helpers) {
  const firstLayout = getFirstRoomLayout(rawProperty, active);

  const title =
    pickAny(rawProperty, ["title", "propertyTitle", "property_title"]) ||
    "（未命名房源）";

  const address =
    pickAny(rawProperty, ["address", "fullAddress", "full_address", "location"]) ||
    "-";

  const priceText = pickHotelPrice(firstLayout, rawProperty, active, helpers);

  const category = pickEverywhere(rawProperty, active, [
    "category",
    "propertyCategory",
    "property_category",
    "hotelCategory",
    "hotel_category",
  ]);

  const subType = pickEverywhere(rawProperty, active, [
    "finalType",
    "subType",
    "sub_type",
    "hotelSubType",
    "hotel_sub_type",
  ]);

  const propSubtypes = pickEverywhere(rawProperty, active, [
    "propertySubtype",
    "property_subtype",
    "subtype",
    "hotelSubtype",
    "hotel_subtype",
    "propertySubtypes",
    "property_subtypes",
    "subtypes",
  ]);

  const hotelTypeText = asText(
    pickEverywhere(rawProperty, active, [
      "hotelType",
      "hotel_type",
      "resortType",
      "resort_type",
      "stayType",
      "stay_type",
      "type",
    ])
  );

  const bedrooms =
    pickFrom(firstLayout, [
      "roomCounts.bedrooms",
      "roomCounts.bedroomCount",
      "bedrooms",
      "bedroomCount",
      "bedroom_count",
      "roomCount",
      "room_count",
      "rooms",
    ]) ??
    pickEverywhere(rawProperty, active, [
      "bedrooms",
      "bedroomCount",
      "bedroom_count",
      "rooms",
      "roomCount",
      "room_count",
    ]);

  const bathrooms =
    pickFrom(firstLayout, [
      "roomCounts.bathrooms",
      "roomCounts.bathroomCount",
      "bathrooms",
      "bathroomCount",
      "bathroom_count",
    ]) ??
    pickEverywhere(rawProperty, active, [
      "bathrooms",
      "bathroomCount",
      "bathroom_count",
    ]);

  const carparks = formatCarparks(
    pickFrom(firstLayout, [
      "roomCounts.carparks",
      "roomCounts.carparkCount",
      "carparks",
      "carparkCount",
      "carpark_count",
      "parkingCount",
      "parking_count",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "carparks",
        "carparkCount",
        "carpark_count",
        "parkingCount",
        "parking_count",
      ])
  );

  const bedTypeText = formatBeds(
    pickFrom(firstLayout, ["beds"]) ??
      pickEverywhere(rawProperty, active, [
        "bedType",
        "bed_type",
        "bed_types",
        "roomBedType",
        "room_bed_type",
        "unitBedType",
        "unit_bed_type",
      ])
  );

  const guestCountText =
    formatGuests(pickFrom(firstLayout, ["guests"])) !== "-"
      ? formatGuests(pickFrom(firstLayout, ["guests"]))
      : asText(
          pickEverywhere(rawProperty, active, [
            "guestCount",
            "guest_count",
            "maxGuests",
            "max_guests",
            "pax",
            "occupancy",
          ])
        );

  const smokingAllowedText = mapSmokingText(
    pickEverywhere(rawProperty, active, [
      "smokingAllowed",
      "smoking_allowed",
      "allowSmoking",
      "allow_smoking",
    ])
  );

  const checkinServiceText = mapCheckinServiceText(
    pickEverywhere(rawProperty, active, [
      "checkinService",
      "checkin_service",
      "checkInService",
      "check_in_service",
      "入住服务",
    ])
  );

  const breakfastIncludedText = mapYesNoText(
    pickEverywhere(rawProperty, active, [
      "breakfastIncluded",
      "breakfast_included",
      "includeBreakfast",
      "include_breakfast",
    ])
  );

  const petAllowedText = mapPetPolicyText(
    pickEverywhere(rawProperty, active, [
      "petAllowed",
      "pet_allowed",
      "petsAllowed",
      "pets_allowed",
      "petPolicy",
      "pet_policy",
    ])
  );

  const freeCancelText = mapCancelText(
    pickEverywhere(rawProperty, active, [
      "freeCancel",
      "free_cancel",
      "freeCancellation",
      "free_cancellation",
      "cancelPolicy",
      "cancel_policy",
    ])
  );

  const serviceFeeText = formatPercentValue(
    pickEverywhere(rawProperty, active, [
      "serviceFee",
      "service_fee",
      "roomServiceFee",
      "room_service_fee",
    ])
  );

  const cleaningFeeText = formatMoneyValue(
    pickEverywhere(rawProperty, active, [
      "cleaningFee",
      "cleaning_fee",
      "roomCleaningFee",
      "room_cleaning_fee",
    ])
  );

  const depositText = formatMoneyValue(
    pickEverywhere(rawProperty, active, [
      "deposit",
      "securityDeposit",
      "security_deposit",
      "roomDeposit",
      "room_deposit",
    ])
  );

  const otherFeeText = formatMoneyValue(
    pickEverywhere(rawProperty, active, [
      "otherFee",
      "other_fee",
      "extraFee",
      "extra_fee",
    ])
  );

  const transitText = getTransitText(rawProperty, active);

  return {
    title,
    address,
    priceText,
    bedrooms: isNonEmpty(bedrooms) ? bedrooms : "-",
    bathrooms: isNonEmpty(bathrooms) ? bathrooms : "-",
    carparks: isNonEmpty(carparks) ? carparks : "-",

    saleType:
      pickAny(rawProperty, ["saleType", "sale_type", "saletype"]) || "HOTEL/RESORT",

    propertyStatus:
      pickAny(rawProperty, [
        "propertyStatus",
        "property_status",
        "propertystatus",
        "saleType",
        "sale_type",
        "saletype",
      ]) || "-",

    usage: "-",
    propertyTitle: "-",
    affordableText: "-",
    tenure: "-",

    category: isNonEmpty(category) ? category : "-",
    subType: isNonEmpty(subType) ? subType : "-",
    propSubtypes: isNonEmpty(propSubtypes) ? propSubtypes : "-",

    hotelTypeText,
    bedTypeText,
    guestCountText,
    smokingAllowedText,
    checkinServiceText,
    breakfastIncludedText,
    petAllowedText,
    freeCancelText,
    serviceFeeText,
    cleaningFeeText,
    depositText,
    otherFeeText,
    transitText,

    showStoreys: false,
    showSubtype: isNonEmpty(propSubtypes),

    isNewProject: false,
    isCompletedUnit: false,
    isRentWhole: false,
    isRentRoom: false,

    storeys: "-",
    completedYear: "-",
    expectedText: "-",
    availableFromText: "-",
    buildUpAreaText: "-",
    landAreaText: "-",
    psfText: "-",
  };
}
