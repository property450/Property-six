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

/**
 * ✅ 输出给 my-profile 使用的“卡片 view model”
 * 注意：逻辑完全照你当前 my-profile.js 的 SellerPropertyCard 搬
 */
export function getCardVM(rawProperty) {
  const active = resolveActiveForm(rawProperty);

  // === 这些 helpers 传给每个 vm 文件，保持所有逻辑一致 ===
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

  // ✅ 这里先根据 project 的 status 分发（保持你当前逻辑）
  if (active?.mode === "project") {
    if (isNewProjectStatus(active.propertyStatus)) return buildNewProjectVM(rawProperty, active, helpers);
    if (isCompletedUnitStatus(active.propertyStatus)) return buildCompletedUnitVM(rawProperty, active, helpers);

    // 理论上不会到这里，但为了稳：走 newProject vm
    return buildNewProjectVM(rawProperty, active, helpers);
  }

  // ✅ 其他模式：现在你原本 my-profile.js 没有分更细（auction/rent room 等）
  // 但你希望“文件分好”，所以我这里先按 mode 分发：
  if (active?.mode === "rent") {
    // 暂时：先走 rentWhole（逻辑不变，不会影响你现在显示）
    return buildRentWholeVM(rawProperty, active, helpers);
  }

  if (active?.mode === "homestay") return buildHomestayVM(rawProperty, active, helpers);
  if (active?.mode === "hotel/resort") return buildHotelResortVM(rawProperty, active, helpers);

  // sale / unknown：先走 subsale vm（逻辑不变）
  return buildSubsaleVM(rawProperty, active, helpers);
}
