// constants/propertyRules.js

// 需要显示 “楼层数(Storeys)” 的 category
export const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Townhouse",
  "Commercial Building",
  "Factory",
  "Warehouse",
]);

// Room rental（分租）允许的 category（你 TypeSelector/UnitLayoutForm 用于显示分租表单）
export const ROOM_RENTAL_ELIGIBLE_CATEGORIES = new Set([
  "Apartment / Condo / Service Residence",
  "Terrace / Link House",
  "Semi-Detached House",
  "Bungalow / Villa",
  "Townhouse",
  "Commercial",
]);
