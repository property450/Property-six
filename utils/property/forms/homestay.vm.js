// utils/property/forms/homestay.vm.js
import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  findBestCategoryStrict,
  getTransitText,
  getCardPriceText,
  formatCarparks
} from "../pickers";

export function buildVM(rawProperty, active, helpers) {

  const title =
    pickAny(rawProperty, ["title", "propertyTitle"]) ||
    "（未命名房源）";

  const address =
    pickAny(rawProperty, ["address", "location", "fullAddress"]) ||
    "-";

  const priceText = getCardPriceText(rawProperty, active);

  const bedrooms = pickPreferActive(active, rawProperty, [
    "bedrooms",
    "bedroomCount",
    "bedroom_count"
  ]);

  const bathrooms = pickPreferActive(active, rawProperty, [
    "bathrooms",
    "bathroomCount",
    "bathroom_count"
  ]);

  const carparks = formatCarparks(
    pickPreferActive(active, rawProperty, [
      "carparks",
      "carparkCount",
      "carpark_count"
    ])
  );

  const category = findBestCategoryStrict(active, rawProperty);

  const subType = pickPreferActive(active, rawProperty, [
    "subType",
    "homestaySubType"
  ]);

  const homestayType = pickPreferActive(active, rawProperty, [
    "homestayType"
  ]);

  const bedTypeText = pickPreferActive(active, rawProperty, [
    "bedType",
    "bed_type"
  ]);

  const guestCountText = pickPreferActive(active, rawProperty, [
    "guestCount",
    "maxGuests"
  ]);

  const smokingAllowedText = pickPreferActive(active, rawProperty, [
    "smokingAllowed",
    "allowSmoking"
  ]);

  const checkinServiceText = pickPreferActive(active, rawProperty, [
    "checkinService",
    "checkInService"
  ]);

  const breakfastIncludedText = pickPreferActive(active, rawProperty, [
    "breakfastIncluded",
    "includeBreakfast"
  ]);

  const petAllowedText = pickPreferActive(active, rawProperty, [
    "petAllowed",
    "allowPets"
  ]);

  const freeCancelText = pickPreferActive(active, rawProperty, [
    "freeCancel",
    "freeCancellation"
  ]);

  const serviceFeeText = pickPreferActive(active, rawProperty, [
    "serviceFee"
  ]);

  const cleaningFeeText = pickPreferActive(active, rawProperty, [
    "cleaningFee"
  ]);

  const depositText = pickPreferActive(active, rawProperty, [
    "deposit"
  ]);

  const otherFeeText = pickPreferActive(active, rawProperty, [
    "otherFee"
  ]);

  const transitText = getTransitText(rawProperty, active);

  return {

    title,
    address,
    priceText,

    bedrooms,
    bathrooms,
    carparks,

    category,
    subType,

    homestayTypeText: homestayType,

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

    saleType: "HOMESTAY",

    isRentWhole: false,
    isRentRoom: false,

    showStoreys: false,
    showSubtype: true
  };
}
