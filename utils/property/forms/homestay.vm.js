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
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  if (typeof v === "object") return JSON.stringify(v);
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

  const priceText = getCardPriceText(
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

  const bedTypeText = asText(
    pickFrom(firstLayout, ["beds[0]", "beds"]) ??
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

  const guestCountText = asText(
    pickFrom(firstLayout, [
      "guests.adults",
      "guests.total",
      "guests",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "guestCount",
        "guest_count",
        "maxGuests",
        "max_guests",
        "max_guests",
        "pax",
        "maxPax",
        "max_pax",
        "occupancy",
      ])
  );

  const smokingAllowedText = asText(
    pickFrom(firstLayout, ["smoking"]) ??
      pickEverywhere(rawProperty, active, [
        "smokingAllowed",
        "smoking_allowed",
        "allowSmoking",
        "allow_smoking",
        "indoorSmoking",
        "indoor_smoking",
      ])
  );

  const checkinServiceText = asText(
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
      ])
  );

  const breakfastIncludedText = asText(
    pickFrom(firstLayout, ["breakfast"]) ??
      pickEverywhere(rawProperty, active, [
        "breakfastIncluded",
        "breakfast_included",
        "includeBreakfast",
        "include_breakfast",
        "withBreakfast",
        "with_breakfast",
      ])
  );

  const petAllowedText = asText(
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
      ])
  );

  const freeCancelText = asText(
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
      ])
  );

  const serviceFeeText = asText(
    pickFrom(firstLayout, [
      "fees.serviceFee.value",
      "fees.serviceFee.mode",
      "fees.serviceFee",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "serviceFee",
        "service_fee",
        "unitServiceFee",
        "unit_service_fee",
      ])
  );

  const cleaningFeeText = asText(
    pickFrom(firstLayout, [
      "fees.cleaningFee.value",
      "fees.cleaningFee.mode",
      "fees.cleaningFee",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "cleaningFee",
        "cleaning_fee",
        "unitCleaningFee",
        "unit_cleaning_fee",
      ])
  );

  const depositText = asText(
    pickFrom(firstLayout, [
      "fees.deposit.value",
      "fees.deposit.mode",
      "fees.deposit",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "deposit",
        "securityDeposit",
        "security_deposit",
        "unitDeposit",
        "unit_deposit",
      ])
  );

  const otherFeeText = asText(
    pickFrom(firstLayout, [
      "fees.otherFee.amount",
      "fees.otherFee.note",
      "fees.otherFee",
    ]) ??
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
