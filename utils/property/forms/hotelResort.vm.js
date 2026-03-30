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

  const sources = [
    hotelForm,
    active,
    single,
    typeForm,
    rawProperty,
  ];

  for (const src of sources) {
    if (!src || typeof src !== "object") continue;

    if (Array.isArray(src.roomLayouts) && src.roomLayouts.length > 0) {
      return src.roomLayouts[0];
    }

    if (Array.isArray(src.room_layouts) && src.room_layouts.length > 0) {
      return src.room_layouts[0];
    }

    if (Array.isArray(src.layouts) && src.layouts.length > 0) {
      return src.layouts[0];
    }

    if (Array.isArray(src.roomTypes) && src.roomTypes.length > 0) {
      return src.roomTypes[0];
    }

    if (Array.isArray(src.room_types) && src.room_types.length > 0) {
      return src.room_types[0];
    }

    if (Array.isArray(src.units) && src.units.length > 0) {
      return src.units[0];
    }

    if (Array.isArray(src.unitLayouts) && src.unitLayouts.length > 0) {
      return src.unitLayouts[0];
    }

    if (Array.isArray(src.unit_layouts) && src.unit_layouts.length > 0) {
      return src.unit_layouts[0];
    }
  }

  return null;
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

function formatFeeObject(fee, kind = "money") {
  if (!fee || typeof fee !== "object") return "-";

  const mode = String(fee.mode || "").toLowerCase().trim();
  const value = fee.value || fee.amount || "";
  const note = fee.note || "";

  let main = "-";

  if (!value && note) return note;

  if (mode === "free") {
    main = "免费";
  } else if (kind === "percent") {
    main = value !== "" ? `${value}%` : "-";
  } else {
    main = value !== "" ? `RM${value}` : "-";
  }

  if (main !== "-" && note) return `${main}（${note}）`;
  if (main !== "-") return main;
  if (note) return note;

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

function pickHotelPriceFallback(firstLayout, rawProperty, active) {
  const sources = [
    firstLayout?.availability,
    firstLayout?.roomData?.availability,
    active?.availability,
    rawProperty?.hotel_resort_form?.availability,
    rawProperty?.single_form_data_v2?.availability,
    rawProperty?.singleFormData?.availability,
    rawProperty?.single_form_data?.availability,
    rawProperty?.availability,
  ].filter(Boolean);

  for (const layoutAvailability of sources) {
    if (!layoutAvailability || typeof layoutAvailability !== "object") continue;

    if (layoutAvailability.price != null && layoutAvailability.price !== "") {
      return String(layoutAvailability.price);
    }
    if (layoutAvailability.defaultPrice != null && layoutAvailability.defaultPrice !== "") {
      return String(layoutAvailability.defaultPrice);
    }
    if (layoutAvailability.basePrice != null && layoutAvailability.basePrice !== "") {
      return String(layoutAvailability.basePrice);
    }

    const nestedPrices =
      layoutAvailability?.prices && typeof layoutAvailability.prices === "object"
        ? layoutAvailability.prices
        : null;

    if (nestedPrices) {
      const values = Object.values(nestedPrices).filter(Boolean);
      if (values.length > 0) {
        const first = values[0];
        if (typeof first === "number" || typeof first === "string") {
          return String(first);
        }
        if (first && typeof first === "object") {
          if (first.price != null && first.price !== "") return String(first.price);
          if (first.value != null && first.value !== "") return String(first.value);
          if (first.amount != null && first.amount !== "") return String(first.amount);
        }
      }
    }

    const calendarPrices =
      layoutAvailability.calendar_prices || layoutAvailability.calendarPrices;

    if (calendarPrices && typeof calendarPrices === "object") {
      const actualMap =
        calendarPrices?.prices && typeof calendarPrices.prices === "object"
          ? calendarPrices.prices
          : calendarPrices;

      const values = Object.values(actualMap).filter(Boolean);
      if (values.length > 0) {
        const first = values[0];
        if (typeof first === "number" || typeof first === "string") {
          return String(first);
        }
        if (first && typeof first === "object") {
          if (first.price != null && first.price !== "") return String(first.price);
          if (first.value != null && first.value !== "") return String(first.value);
          if (first.amount != null && first.amount !== "") return String(first.amount);
        }
      }
    }
  }

  return "-";
}

function formatCalendarPriceRange(firstLayout, rawProperty, active) {
  const single =
    rawProperty?.single_form_data_v2 ||
    rawProperty?.singleFormData ||
    rawProperty?.single_form_data ||
    {};

  const hotelForm = rawProperty?.hotel_resort_form || {};

  const typeForm =
    rawProperty?.type_form_v2 ||
    rawProperty?.typeForm ||
    rawProperty?.type_form ||
    {};

  const nums = [];

  const pushNumber = (raw) => {
    if (raw === null || raw === undefined || raw === "") return;
    const n = Number(String(raw).replace(/[^\d.]/g, ""));
    if (Number.isFinite(n)) nums.push(n);
  };

  const collectDatePriceMap = (obj) => {
    if (!obj || typeof obj !== "object") return;

    if (obj.prices && typeof obj.prices === "object") {
      Object.values(obj.prices).forEach((val) => {
        if (typeof val === "number" || typeof val === "string") {
          pushNumber(val);
        } else if (val && typeof val === "object") {
          pushNumber(val.price);
          pushNumber(val.value);
          pushNumber(val.amount);
        }
      });
      return;
    }

    for (const val of Object.values(obj)) {
      if (typeof val === "number" || typeof val === "string") {
        pushNumber(val);
        continue;
      }

      if (val && typeof val === "object") {
        pushNumber(val.price);
        pushNumber(val.value);
        pushNumber(val.amount);
      }
    }
  };

  const candidates = [
    firstLayout?.availability?.prices,
    firstLayout?.availability?.calendar_prices,
    firstLayout?.availability?.calendarPrices,
    firstLayout?.roomData?.availability?.prices,
    firstLayout?.roomData?.availability?.calendar_prices,
    firstLayout?.roomData?.availability?.calendarPrices,
    firstLayout?.calendar_prices,
    firstLayout?.calendarPrices,

    active?.availability?.prices,
    active?.availability?.calendar_prices,
    active?.availability?.calendarPrices,
    active?.calendar_prices,
    active?.calendarPrices,

    single?.availability?.prices,
    single?.availability?.calendar_prices,
    single?.availability?.calendarPrices,
    single?.calendar_prices,
    single?.calendarPrices,

    hotelForm?.availability?.prices,
    hotelForm?.availability?.calendar_prices,
    hotelForm?.availability?.calendarPrices,
    hotelForm?.calendar_prices,
    hotelForm?.calendarPrices,

    typeForm?.availability?.prices,
    typeForm?.availability?.calendar_prices,
    typeForm?.availability?.calendarPrices,
    typeForm?.calendar_prices,
    typeForm?.calendarPrices,

    rawProperty?.availability?.prices,
    rawProperty?.availability?.calendar_prices,
    rawProperty?.availability?.calendarPrices,
    rawProperty?.calendar_prices,
    rawProperty?.calendarPrices,
  ].filter(Boolean);

  candidates.forEach(collectDatePriceMap);

  if (!nums.length) {
    const directAvailabilityCandidates = [
      firstLayout?.availability,
      firstLayout?.roomData?.availability,
      active?.availability,
      single?.availability,
      hotelForm?.availability,
      typeForm?.availability,
      rawProperty?.availability,
    ].filter(Boolean);

    for (const obj of directAvailabilityCandidates) {
      collectDatePriceMap(obj);
    }
  }

  if (!nums.length) return "-";

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (min === max) return `RM${min}`;
  return `RM${min}~RM${max}`;
}

export function buildVM(rawProperty, active, helpers) {
  const firstLayout = getFirstRoomLayout(rawProperty, active);

  console.log("=== HOTEL/RESORT DEBUG rawProperty ===", rawProperty);
  console.log("=== HOTEL/RESORT DEBUG active ===", active);
  console.log("=== HOTEL/RESORT DEBUG firstLayout ===", firstLayout);
  console.log("=== HOTEL/RESORT DEBUG hotel_resort_form ===", rawProperty?.hotel_resort_form);
  console.log("=== HOTEL/RESORT DEBUG firstLayout.roomData ===", firstLayout?.roomData);
  console.log("=== HOTEL/RESORT DEBUG hotelForm keys ===", Object.keys(rawProperty?.hotel_resort_form || {}));
  console.log("=== HOTEL/RESORT DEBUG hotelForm full ===", rawProperty?.hotel_resort_form);
  
  const title =
    pickAny(rawProperty, ["title", "propertyTitle", "property_title"]) ||
    "（未命名房源）";

  const address =
    pickAny(rawProperty, ["address", "fullAddress", "full_address", "location"]) ||
    "-";

  const nestedPriceText = formatCalendarPriceRange(firstLayout, rawProperty, active);
  const fallbackHotelPrice = pickHotelPriceFallback(firstLayout, rawProperty, active);

  const roomTypePrice =
    firstLayout?.price ||
    firstLayout?.roomData?.price ||
    firstLayout?.defaultPrice ||
    firstLayout?.roomData?.defaultPrice ||
    rawProperty?.hotel_resort_form?.roomLayouts?.[0]?.price ||
    rawProperty?.hotel_resort_form?.roomLayouts?.[0]?.roomData?.price ||
    rawProperty?.hotel_resort_form?.roomTypes?.[0]?.price ||
    rawProperty?.roomTypes?.[0]?.price;

  const priceText =
    nestedPriceText !== "-"
      ? nestedPriceText
      : fallbackHotelPrice !== "-"
        ? formatMoneyValue(fallbackHotelPrice)
        : roomTypePrice
          ? formatMoneyValue(roomTypePrice)
          : getCardPriceText(
              rawProperty,
              active,
              helpers.isNewProjectStatus,
              helpers.isCompletedUnitStatus
            );

  const category =
    pickFrom(firstLayout, [
      "category",
      "roomData.category",
      "propertyCategory",
      "roomData.propertyCategory",
      "property_category",
      "roomData.property_category",
      "hotelCategory",
      "roomData.hotelCategory",
      "hotel_category",
      "roomData.hotel_category",
    ]) ??
    pickEverywhere(rawProperty, active, [
      "category",
      "propertyCategory",
      "property_category",
      "hotelCategory",
      "hotel_category",
    ]);

  const subType =
    pickFrom(firstLayout, [
      "finalType",
      "roomData.finalType",
      "subType",
      "roomData.subType",
      "sub_type",
      "roomData.sub_type",
      "hotelSubType",
      "roomData.hotelSubType",
      "hotel_sub_type",
      "roomData.hotel_sub_type",
    ]) ??
    pickEverywhere(rawProperty, active, [
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
    pickFrom(firstLayout, [
      "hotelType",
      "roomData.hotelType",
      "hotel_type",
      "roomData.hotel_type",
      "hotelResortType",
      "roomData.hotelResortType",
      "hotel_resort_type",
      "roomData.hotel_resort_type",
      "resortType",
      "roomData.resortType",
      "resort_type",
      "roomData.resort_type",
      "stayType",
      "roomData.stayType",
      "stay_type",
      "roomData.stay_type",
      "type",
      "roomData.type",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "hotelType",
        "hotel_type",
        "hotelResortType",
        "hotel_resort_type",
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
      "roomData.roomCounts.bedrooms",
      "roomData.roomCounts.bedroomCount",
      "bedrooms",
      "roomData.bedrooms",
      "bedroomCount",
      "roomData.bedroomCount",
      "rooms",
      "roomData.rooms",
      "roomCount",
      "roomData.roomCount",
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
      "roomData.roomCounts.bathrooms",
      "roomData.roomCounts.bathroomCount",
      "bathrooms",
      "roomData.bathrooms",
      "bathroomCount",
      "roomData.bathroomCount",
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
      "roomData.roomCounts.carparks",
      "roomData.roomCounts.carparkCount",
      "carparks",
      "roomData.carparks",
      "carparkCount",
      "roomData.carparkCount",
      "parkingCount",
      "roomData.parkingCount",
    ]) ??
      pickEverywhere(rawProperty, active, [
        "carparks",
        "carparkCount",
        "carpark_count",
        "parkingCount",
        "parking_count",
      ])
  );

  const bedValue =
    pickFrom(firstLayout, [
      "beds",
      "roomData.beds",
      "bedType",
      "roomData.bedType",
      "bed_type",
      "roomData.bed_type",
    ]) ??
    pickEverywhere(rawProperty, active, [
      "bedType",
      "bed_type",
      "bed_types",
      "roomBedType",
      "room_bed_type",
      "unitBedType",
      "unit_bed_type",
    ]);

  const bedTypeText = Array.isArray(bedValue) ? formatBeds(bedValue) : asText(bedValue);

  const guestValue =
    pickFrom(firstLayout, [
      "guests",
      "roomData.guests",
    ]) ??
    pickEverywhere(rawProperty, active, [
      "guestCount",
      "guest_count",
      "maxGuests",
      "max_guests",
      "pax",
      "maxPax",
      "max_pax",
      "occupancy",
    ]);

  const guestCountText =
    guestValue && typeof guestValue === "object"
      ? formatGuests(guestValue)
      : asText(guestValue);

  const smokingAllowedRaw =
    pickFrom(firstLayout, [
      "smoking",
      "roomData.smoking",
      "smokingAllowed",
      "roomData.smokingAllowed",
      "smoking_allowed",
      "roomData.smoking_allowed",
      "allowSmoking",
      "roomData.allowSmoking",
      "allow_smoking",
      "roomData.allow_smoking",
      "indoorSmoking",
      "roomData.indoorSmoking",
      "indoor_smoking",
      "roomData.indoor_smoking",
    ]) ??
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
      "roomData.checkinService.type",
      "checkinService.method",
      "roomData.checkinService.method",
      "checkinService",
      "roomData.checkinService",
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
    pickFrom(firstLayout, [
      "breakfast",
      "roomData.breakfast",
      "breakfastIncluded",
      "roomData.breakfastIncluded",
      "breakfast_included",
      "roomData.breakfast_included",
      "includeBreakfast",
      "roomData.includeBreakfast",
      "include_breakfast",
      "roomData.include_breakfast",
      "withBreakfast",
      "roomData.withBreakfast",
      "with_breakfast",
      "roomData.with_breakfast",
    ]) ??
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
      "roomData.petPolicy.type",
      "roomData.petPolicy.note",
      "roomData.petPolicy",
      "petAllowed",
      "roomData.petAllowed",
      "pet_allowed",
      "roomData.pet_allowed",
      "allowPets",
      "roomData.allowPets",
      "allow_pets",
      "roomData.allow_pets",
      "petsAllowed",
      "roomData.petsAllowed",
      "pets_allowed",
      "roomData.pets_allowed",
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
      "roomData.cancellationPolicy.type",
      "roomData.cancellationPolicy.condition",
      "roomData.cancellationPolicy",
      "freeCancel",
      "roomData.freeCancel",
      "free_cancel",
      "roomData.free_cancel",
      "freeCancellation",
      "roomData.freeCancellation",
      "free_cancellation",
      "roomData.free_cancellation",
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

  const serviceFeeObj = pickFrom(firstLayout, [
    "fees.serviceFee",
    "roomData.fees.serviceFee",
  ]);
  const serviceFeeRaw =
    serviceFeeObj ??
    pickEverywhere(rawProperty, active, [
      "serviceFee",
      "service_fee",
      "unitServiceFee",
      "unit_service_fee",
    ]);

  const serviceFeeText =
    serviceFeeObj && typeof serviceFeeObj === "object"
      ? formatFeeObject(serviceFeeObj, "percent")
      : formatPercentValue(serviceFeeRaw);

  const cleaningFeeObj = pickFrom(firstLayout, [
    "fees.cleaningFee",
    "roomData.fees.cleaningFee",
  ]);
  const cleaningFeeRaw =
    cleaningFeeObj ??
    pickEverywhere(rawProperty, active, [
      "cleaningFee",
      "cleaning_fee",
      "unitCleaningFee",
      "unit_cleaning_fee",
    ]);

  const cleaningFeeText =
    cleaningFeeObj && typeof cleaningFeeObj === "object"
      ? formatFeeObject(cleaningFeeObj, "money")
      : formatMoneyValue(cleaningFeeRaw);

  const depositObj = pickFrom(firstLayout, [
    "fees.deposit",
    "roomData.fees.deposit",
  ]);
  const depositRaw =
    depositObj ??
    pickEverywhere(rawProperty, active, [
      "deposit",
      "securityDeposit",
      "security_deposit",
      "unitDeposit",
      "unit_deposit",
    ]);

  const depositText =
    depositObj && typeof depositObj === "object"
      ? formatFeeObject(depositObj, "money")
      : formatMoneyValue(depositRaw);

  const otherFeeObj = pickFrom(firstLayout, [
    "fees.otherFee",
    "roomData.fees.otherFee",
  ]);

  const otherFeeText =
    otherFeeObj && typeof otherFeeObj === "object"
      ? formatFeeObject(otherFeeObj, "money")
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

    saleType: "hotel/resort",
    propertyStatus: "Hotel/Resort",
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
