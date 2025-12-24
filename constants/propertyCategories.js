// constants/propertyCategories.js

// ---------- TypeSelector 的 subtypeOptions（可多选） ----------
export const SUBTYPE_OPTIONS = [
  "Penthouse",
  "Duplex",
  "Studio",
  "SoHo",
  "Loft",
  "Dual Key",
  "Corner Lot",
  "Intermediate",
  "End Lot",
  "Gated & Guarded",
  "Bumi Lot",
];

// ---------- UnitLayoutForm / TypeSelector 的 Category -> SubType 选项 ----------
export const CATEGORY_OPTIONS = {
  "Bungalow / Villa": [
    "Bungalow",
    "Link Bungalow",
    "Twin Villa",
    "Zero-Lot Bungalow",
    "Bungalow land",
  ],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Flat",
    "Service Residence",
  ],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terrace / Link House"],
  "Townhouse": ["Townhouse"],
  "Residential Land": ["Residential Land"],
  "Commercial": [
    "Office",
    "Shop",
    "Retail Space",
    "Commercial Building",
    "Hotel / Resort",
    "Restaurant",
    "Medical Suite",
    "Mixed Development",
  ],
  "Industrial": [
    "Factory",
    "Warehouse",
    "Industrial Land",
    "Workshop",
    "Data Centre",
  ],
  "Agriculture": ["Agriculture Land"],
  "Others": ["Others"],
};

// ---------- 你在 TypeSelector 的 property category 列表（完整项） ----------
export const PROPERTY_CATEGORY_LIST = [
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
  "Townhouse",
  "Residential Land",
  "Commercial",
  "Industrial",
  "Agriculture",
  "Others",
];

// ---------- upload-property / UnitLayoutForm 也会用到的 “project layout category 下拉” ----------
export const PROJECT_LAYOUT_CATEGORY_LIST = [
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
  "Townhouse",
  "Residential Land",
  "Commercial",
  "Industrial",
  "Agriculture",
  "Others",
];
