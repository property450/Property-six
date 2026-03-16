import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  findBestCategoryStrict,
  getTransitText,
  getCardPriceText,
  formatCarparks,
  shouldShowPropertySubtypeByCategory,
} from "../pickers";

function asText(v) {
  if (!isNonEmpty(v)) return "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return String(v);
}

export function buildVM(rawProperty, active, helpers) {
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

  const bedrooms = pickPreferActive(active, rawProperty, [
    "bedrooms",
    "bedroomCount",
    "bedroom_count",
    "rooms",
    "roomCount",
  ]);

  const bathrooms = pickPreferActive(active, rawProperty, [
    "bathrooms",
    "bathroomCount",
    "bathroom_count",
  ]);

  const carparks = formatCarparks(
    pickPreferActive(active, rawProperty, [
      "carparks",
      "carparkCount",
      "carpark_count",
      "parkingCount",
      "parking_count",
    ])
  );

  const category = findBestCategoryStrict(active, rawProperty);

  const subType = pickPreferActive(active, rawProperty, [
    "subType",
    "sub_type",
    "finalType",
    "homestaySubType",
    "homestay_sub_type",
  ]);

  const propSubtypes = pickPreferActive(active, rawProperty, [
    "propertySubtype",
    "property_subtype",
    "subtype",
    "homestaySubtype",
    "homestay_subtype",
  ]);

  const homestayTypeText = asText(
    pickPreferActive(active, rawProperty, [
      "homestayType",
      "homestay_type",
      "stayType",
      "stay_type",
    ])
  );

  const bedTypeText = asText(
    pickPreferActive(active, rawProperty, [
      "bedType",
      "bed_type",
      "roomBedType",
      "room_bed_type",
      "unitBedType",
      "unit_bed_type",
    ])
  );

  const guestCountText = asText(
    pickPreferActive(active, rawProperty, [
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

  const smokingAllowedText = asText(
    pickPreferActive(active, rawProperty, [
      "smokingAllowed",
      "smoking_allowed",
      "allowSmoking",
      "allow_smoking",
      "indoorSmoking",
      "indoor_smoking",
    ])
  );

  const checkinServiceText = asText(
    pickPreferActive(active, rawProperty, [
      "checkinService",
      "checkin_service",
      "checkInService",
      "check_in_service",
      "checkinMethod",
      "checkin_method",
    ])
  );

  const breakfastIncludedText = asText(
    pickPreferActive(active, rawProperty, [
      "breakfastIncluded",
      "breakfast_included",
      "includeBreakfast",
      "include_breakfast",
      "withBreakfast",
      "with_breakfast",
    ])
  );

  const petAllowedText = asText(
    pickPreferActive(active, rawProperty, [
      "petAllowed",
      "pet_allowed",
      "allowPets",
      "allow_pets",
      "petsAllowed",
      "pets_allowed",
    ])
  );

  const freeCancelText = asText(
    pickPreferActive(active, rawProperty, [
      "freeCancel",
      "free_cancel",
      "freeCancellation",
      "free_cancellation",
      "cancellationPolicy",
      "cancellation_policy",
    ])
  );

  const serviceFeeText = asText(
    pickPreferActive(active, rawProperty, [
      "serviceFee",
      "service_fee",
      "unitServiceFee",
      "unit_service_fee",
    ])
  );

  const cleaningFeeText = asText(
    pickPreferActive(active, rawProperty, [
      "cleaningFee",
      "cleaning_fee",
      "unitCleaningFee",
      "unit_cleaning_fee",
    ])
  );

  const depositText = asText(
    pickPreferActive(active, rawProperty, [
      "deposit",
      "securityDeposit",
      "security_deposit",
      "unitDeposit",
      "unit_deposit",
    ])
  );

  const otherFeeText = asText(
    pickPreferActive(active, rawProperty, [
      "otherFee",
      "other_fee",
      "otherFees",
      "other_fees",
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
