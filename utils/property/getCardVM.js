// utils/property/getCardVM.js

import { resolveActiveForm, isNewProjectStatus, isCompletedUnitStatus } from "./resolveActiveForm";
import {
  isNonEmpty,
  pickAny,
  pickPreferActive,
  findBestCategoryStrict,
  getAffordableTextStrict,
  getTransitText,
  getCardPriceText,
  getExpectedCompletionText,
  formatCarparks,
  shouldShowStoreysByCategory,
  shouldShowPropertySubtypeByCategory,
  findBestCompletedYear,
} from "./pickers";

// forms
import { buildVM as buildNewProjectVM } from "./forms/newProject.vm";
import { buildVM as buildCompletedUnitVM } from "./forms/completedUnit.vm";
import { buildVM as buildSubsaleVM } from "./forms/subsale.vm";
import { buildVM as buildAuctionVM } from "./forms/auction.vm";
import { buildVM as buildRentWholeVM } from "./forms/rentWhole.vm";
import { buildVM as buildRentRoomVM } from "./forms/rentRoom.vm";
import { buildVM as buildRentToOwnVM } from "./forms/rentToOwn.vm";
import { buildVM as buildHomestayVM } from "./forms/homestay.vm";
import { buildVM as buildHotelResortVM } from "./forms/hotelResort.vm";

export function getCardVM(rawProperty) {

  const active = resolveActiveForm(rawProperty);

  const helpers = {
    isNewProjectStatus,
    isCompletedUnitStatus,
    isNonEmpty,
    pickAny,
    pickPreferActive,
    findBestCategoryStrict,
    getAffordableTextStrict,
    getTransitText,
    getCardPriceText,
    getExpectedCompletionText,
    formatCarparks,
    shouldShowStoreysByCategory,
    shouldShowPropertySubtypeByCategory,
    findBestCompletedYear,
  };

  // ========= PROJECT =========

  if (active?.mode === "project") {

    if (isNewProjectStatus(active.propertyStatus)) {
      return buildNewProjectVM(rawProperty, active, helpers);
    }

    if (isCompletedUnitStatus(active.propertyStatus)) {
      return buildCompletedUnitVM(rawProperty, active, helpers);
    }

    return buildNewProjectVM(rawProperty, active, helpers);
  }

  // ========= SALE =========

  if (active?.mode === "sale") {

    const s = String(active?.propertyStatus || "").toLowerCase();

    if (s.includes("auction")) {
      return buildAuctionVM(rawProperty, active, helpers);
    }

    if (s.includes("rent-to-own")) {
      return buildRentToOwnVM(rawProperty, active, helpers);
    }

    return buildSubsaleVM(rawProperty, active, helpers);
  }

  // ========= RENT =========

  if (active?.mode === "rent") {

    const roomMode =
      rawProperty?.roomRentalMode ||
      rawProperty?.room_rental_mode ||
      "";

    if (String(roomMode).toLowerCase() === "room") {
      return buildRentRoomVM(rawProperty, active, helpers);
    }

    return buildRentWholeVM(rawProperty, active, helpers);
  }

  // ========= HOMESTAY =========

  if (active?.mode === "homestay") {
    return buildHomestayVM(rawProperty, active, helpers);
  }

  // ========= HOTEL =========

  if (
    active?.mode === "hotel/resort" ||
    active?.mode === "hotel"
  ) {
    return buildHotelResortVM(rawProperty, active, helpers);
  }

  // ========= fallback =========

  return buildSubsaleVM(rawProperty, active, helpers);
}
