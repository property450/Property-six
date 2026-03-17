import {
  isNonEmpty,
  pickAny,
  getTransitText,
  getCardPriceText,
  formatCarparks,
  shouldShowPropertySubtypeByCategory,
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
    // ✅ 其它费用 / fee object
    if ("value" in v || "amount" in v || "note" in v || "mode" in v) {
      const amount = v.value || v.amount || "";
      const note = v.note || "";
      if (amount && note) return `${amount}（${note}）`;
      if (amount) return String(amount);
      if (note) return String(note);
      return "-";
    }

    // ✅ checkin / cancellation / pet 这类 object
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

  const homestayForm = rawProperty?.homestay_form || {};

  return (
    pickFrom(active, candidates) ??
    pickFrom(typeForm, candidates) ??
    pickFrom(single, candidates) ??
    pickFrom(homestayForm, candidates) ??
    pickFrom(rawProperty, candidates)
  );
}


function formatBeds(beds) {
  if (!Array.isArray(beds) || beds.length === 0) return "-";

  const parts = beds
    .map((b) => {
      if (!b || typeof b !== "object") return "";
      const label = b.label || b.name || "";
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

function formatFeeObject(fee) {
  if (!fee || typeof fee !== "object") return "-";

  const mode = fee.mode || "";
  const value = fee.value || fee.amount || "";
  const note = fee.note || "";

  let main = "";

  if (mode === "free") {
    main = "免费";
  } else if (mode === "fixed" && value) {
    main = `RM${value}`;
  } else if (mode === "percent" && value) {
    main = `${value}%`;
  } else if (value) {
    main = String(value);
  }

  if (main && note) return `${main}（${note}）`;
  if (main) return main;
  if (note) return note;

  return "-";
}

function pickHomestayPrice(firstLayout, rawProperty) {
  const layoutAvailability = firstLayout?.availability;

  if (layoutAvailability && typeof layoutAvailability === "object") {
    if (layoutAvailability.price) return String(layoutAvailability.price);
    if (layoutAvailability.defaultPrice) return String(layoutAvailability.defaultPrice);
    if (layoutAvailability.basePrice) return String(layoutAvailability.basePrice);

    const calendarPrices = layoutAvailability.calendar_prices || layoutAvailability.calendarPrices;
    if (calendarPrices && typeof calendarPrices === "object") {
      const values = Object.values(calendarPrices).filter(Boolean);
      if (values.length > 0) {
        const first = values[0];
        if (typeof first === "object") {
          if (first.price) return String(first.price);
          if (first.value) return String(first.value);
        }
        return String(first);
      }
    }
  }

  if (rawProperty?.calendar_prices && typeof rawProperty.calendar_prices === "object") {
    const values = Object.values(rawProperty.calendar_prices).filter(Boolean);
    if (values.length > 0) {
      const first = values[0];
      if (typeof first === "object") {
        if (first.price) return String(first.price);
        if (first.value) return String(first.value);
      }
      return String(first);
    }
  }

  return "-";
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

export function buildVM(rawProperty, active, helpers) {
  const single =
    rawProperty?.single_form_data_v2 ||
    rawProperty?.singleFormData ||
    rawProperty?.single_form_data ||
    {};

  const firstLayout =
    Array.isArray(single?.roomLayouts) && single.roomLayouts.length > 0
      ? single.roomLayouts[0]
      : Array.isArray(single?.room_layouts) && single.room_layouts.length > 0
        ? single.room_layouts[0]
        : null;

  const title =
    pickAny(rawProperty, ["title", "propertyTitle", "property_title"]) ||
    "（未命名房源）";

  const address =
    pickAny(rawProperty, ["address", "fullAddress", "full_address", "location"]) ||
    "-";

  const nestedPriceText = pickHomestayPrice(firstLayout, rawProperty);
const priceText =
  nestedPriceText !== "-"
    ? nestedPriceText
    : getCardPriceText(
        rawProperty,
        active,
        helpers.isNewProjectStatus,
        helpers.isCompletedUnitStatus
      );

  const category = pickEverywhere(rawProperty, active, [
    "category",
    "propertyCategory",
    "property_category",
    "homestayCategory",
    "homestay_category",
  ]);

  const subType = pickEverywhere(rawProperty, active, [
    "finalType",
    "subType",
    "sub_type",
    "homestaySubType",
    "homestay_sub_type",
  ]);

  const propSubtypes = pickEverywhere(rawProperty, active, [
    "propertySubtype",
    "property_subtype",
    "subtype",
    "homestaySubtype",
    "homestay_subtype",
    "propertySubtypes",
    "property_subtypes",
    "subtypes",
  ]);

  const homestayTypeText = asText(
    pickEverywhere(rawProperty, active, [
      "homestayType",
      "homestay_type",
      "stayType",
      "stay_type",
    ])
  );

  const bedrooms =
    pickFrom(firstLayout, [
      "roomCounts.bedrooms",
      "roomCounts.bedroomCount",
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
          "maxPax",
          "max_pax",
          "occupancy",
        ])
      );

  const smokingAllowedRaw =
  pickFrom(firstLayout, ["smoking"]) ??
  pickEverywhere(rawProperty, active, [
    "smokingAllowed",
    "smoking_allowed",
    "allowSmoking",
    "allow_smoking",
    "indoorSmoking",
    "indoor_smoking",
  ]);

const smokingAllowedText = mapSmokingText(smokingAllowedRaw);

  const checkinServiceRaw =
  pickFrom(firstLayout, [
    "checkinService.type",
    "checkinService.method",
    "checkinService",
  ]) ??
  pickEverywhere(rawProperty, active, [
    "checkinService",
    "checkin_service",
    "checkInService",
    "check_in_service",
    "checkinMethod",
    "checkin_method",
  ]);

const checkinServiceText = mapCheckinServiceText(checkinServiceRaw);

  const breakfastRaw =
  pickFrom(firstLayout, ["breakfast"]) ??
  pickEverywhere(rawProperty, active, [
    "breakfastIncluded",
    "breakfast_included",
    "includeBreakfast",
    "include_breakfast",
    "withBreakfast",
    "with_breakfast",
  ]);

const breakfastIncludedText = mapYesNoText(breakfastRaw);

  const petAllowedRaw =
  pickFrom(firstLayout, [
    "petPolicy.type",
    "petPolicy.note",
    "petPolicy",
  ]) ??
  pickEverywhere(rawProperty, active, [
    "petAllowed",
    "pet_allowed",
    "allowPets",
    "allow_pets",
    "petsAllowed",
    "pets_allowed",
  ]);

const petAllowedText = mapPetPolicyText(petAllowedRaw);

  const freeCancelRaw =
  pickFrom(firstLayout, [
    "cancellationPolicy.type",
    "cancellationPolicy.condition",
    "cancellationPolicy",
  ]) ??
  pickEverywhere(rawProperty, active, [
    "freeCancel",
    "free_cancel",
    "freeCancellation",
    "free_cancellation",
    "cancellationPolicy",
    "cancellation_policy",
  ]);

const freeCancelText = mapCancelText(freeCancelRaw);

  const serviceFeeText =
  formatFeeObject(pickFrom(firstLayout, ["fees.serviceFee"])) !== "-"
    ? formatFeeObject(pickFrom(firstLayout, ["fees.serviceFee"]))
    : asText(
        pickEverywhere(rawProperty, active, [
          "serviceFee",
          "service_fee",
          "unitServiceFee",
          "unit_service_fee",
        ])
      );

const cleaningFeeText =
  formatFeeObject(pickFrom(firstLayout, ["fees.cleaningFee"])) !== "-"
    ? formatFeeObject(pickFrom(firstLayout, ["fees.cleaningFee"]))
    : asText(
        pickEverywhere(rawProperty, active, [
          "cleaningFee",
          "cleaning_fee",
          "unitCleaningFee",
          "unit_cleaning_fee",
        ])
      );

const depositText =
  formatFeeObject(pickFrom(firstLayout, ["fees.deposit"])) !== "-"
    ? formatFeeObject(pickFrom(firstLayout, ["fees.deposit"]))
    : asText(
        pickEverywhere(rawProperty, active, [
          "deposit",
          "securityDeposit",
          "security_deposit",
          "unitDeposit",
          "unit_deposit",
        ])
      );

const otherFeeText =
  formatFeeObject(pickFrom(firstLayout, ["fees.otherFee"])) !== "-"
    ? formatFeeObject(pickFrom(firstLayout, ["fees.otherFee"]))
    : asText(
        pickEverywhere(rawProperty, active, [
          "otherFee",
          "other_fee",
          "otherFees",
          "other_fees",
          "extraFee",
          "extra_fee",
          "extraCharges",
          "extra_charges",
        ])
      );
  
  const transitText = getTransitText(rawProperty, active);

  return {
    title,
    address,
    priceText: isNonEmpty(priceText) ? priceText : "-",

    bedrooms: isNonEmpty(bedrooms) ? bedrooms : "-",
    bathrooms: isNonEmpty(bathrooms) ? bathrooms : "-",
    carparks: isNonEmpty(carparks) ? carparks : "-",

    category: isNonEmpty(category) ? category : "-",
    subType: isNonEmpty(subType) ? subType : "-",
    propSubtypes,

    homestayTypeText,
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

    saleType: "homestay",
    propertyStatus: "-",
    usage: "-",
    propertyTitle: "-",
    affordableText: "-",
    tenure: "-",
    storeys: "-",
    completedYear: "-",
    expectedText: "-",
    availableFromText: "-",
    auctionDateText: "-",

    isRentWhole: false,
    isRentRoom: false,
    isNewProject: false,
    isCompletedUnit: false,

    showStoreys: false,
    showSubtype: shouldShowPropertySubtypeByCategory(category),
  };
}
