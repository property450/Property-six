// components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";
import PropertyTitleSelector from "@/components/PropertyTitleSelector";

// ================== 选项常量 ==================
const subtypeOptions = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

const homestayOptions = [
  "Entire Place",
  "Private Room",
  "Shared Room",
  "Serviced Apartment (Homestay)",
  "Villa Homestay",
  "Farmstay / Kampung Stay",
  "Cultural / Heritage Homestay",
  "Monthly Rental Stay",
  "Hostel / Guesthouse",
  "Capsule / Pod Stay",
  "Eco / Nature Stay",
  "Glamping",
  "Co-Living / Long Stay",
  "Shophouse Homestay",
  "Student Accommodation (Homestay)",
  "Worker / Staff Accommodation",
];

const hotelOptions = [
  "Budget Hotel",
  "2-Star Hotel",
  "3-Star Hotel",
  "4-Star Hotel",
  "5-Star / Luxury Hotel",
  "Business Hotel",
  "Boutique Hotel",
  "Resort",
  "Serviced Apartment Hotel",
  "Convention Hotel",
  "Spa / Hot Spring Hotel",
  "Casino Hotel",
  "Extended Stay Hotel",
  "Capsule Hotel",
  "Hostel / Backpacker Hotel",
  "Airport Hotel",
  "Eco Resort",
  "Beach Resort",
  "Mountain Resort",
  "All-Inclusive Resort",
  "Theme Hotel",
  "Heritage Hotel",
  "Medical / Wellness Hotel",
];

const usageOptions = ["Residential", "Commercial", "Commercial Under HDA", "Industrial", "Agricultural"];

const saleTypeOptions = [
  "New Project / Under Construction",
  "Completed Unit / Developer Unit",
  "Subsale / Secondary Market",
  "Auction Property",
  "Rent-to-Own Scheme",
];

const affordableTypeOptions = [
  "Rumah Mampu Milik",
  "PPR",
  "PR1MA",
  "Rumah Selangorku",
  "Rumah Mesra Rakyat",
  "PPA1M",
  "Rumah WIP (Wilayah Persekutuan)",
  "MyHome",
  "RUMAHWIP",
  "Rumah Mampu Milik Johor (RMMJ)",
  "Rumah Idaman (Selangor)",
];

const tenureOptions = [
  "Freehold",
  "Leasehold",
  "Bumi Lot",
  "Malay Reserved Land",
  "Private Lease Scheme",
  "State Lease Land",
  "Strata Leasehold",
  "Perpetual Lease",
];

// ✅✅✅（你原本的 categoryOptions 保持不动）
const categoryOptions = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terrace House", "Link House", "Townhouse"],
  "Business Property": [
    "Shop",
    "Office",
    "Office Suite",
    "Business Suite",
    "Retail",
    "Retail Shop",
    "Retail Space",
    "Retail Office",
    "Shop / Office",
    "Commercial Land",
    "Hotel",
    "Hotel / Resort",
    "Hotel Apartment",
    "Serviced Apartment Hotel",
    "Boutique Hotel",
    "Hostel / Guesthouse",
    "Hostel / Dormitory",
    "Dormitory",
    "Student Hostel",
    "Worker Dormitory",
    "Co-Living Building",
    "Capsule / Pod Stay",
    "Cultural / Heritage Lodge",
    "Shophouse",
    "Commercial Shophouse (Stay Use)",
    "Shop Apartment",
    "Sofo",
    "Soho",
    "Sovo",
    "Commercial Bungalow",
    "Commercial Semi-Detached House",
    "Food Court",
    "Restaurant / Cafe",
    "Entertainment / Leisure",
    "Convention / Exhibition Space",
    "Event Hall / Ballroom",
    "Mall / Commercial Complex",
    "Co-working Space",
    "Business Centre",
    "Data Centre",
    "Studio / Production Space",
    "Sports / Recreation Facility",
    "Education / Training Centre",
    "Training Centre / Hostel",
    "School / University",
    "Childcare / Kindergarten",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Bank / Financial Office",
    "Government Office",
    "Community Hall / Public Utilities",
    "Car Wash",
    "Petrol Station",
    "Showroom",
    "Warehouse Retail",
    "Supermarket / Hypermarket",
  ],
  "Industrial Property": [
    "Factory",
    "Warehouse",
    "Showroom cum Warehouse",
    "Industrial Land",
    "Detached Factory",
    "Semi-Detached Factory",
    "Terrace Factory",
    "Cluster Factory",
    "Light Industrial",
    "Heavy Industrial",
    "Logistics / Distribution Centre",
    "Logistics Hub",
    "Cold Storage / Warehouse",
    "Workshop",
    "Plant / Mill",
    "Recycling / Waste Facility",
    "Worker Quarters",
    "Factory Dormitory",
    "Industrial Hostel",
  ],
  Land: [
    "Residential Land",
    "Agricultural Land",
    "Mixed Development Land",
    "Commercial Land",
    "Industrial Land",
    "Malay Reserve Land",
    "Bumi Lot Land",
    "Estate Land",
    "Orchard Land",
    "Plantation Land",
    "Oil Palm Estate",
    "Rubber Plantation",
    "Fruit Orchard",
    "Paddy Field",
    "Vacant Agricultural Land",
  ],
};

const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
]);

const ROOM_RENTAL_ELIGIBLE_CATEGORIES = new Set([
  "Apartment / Condo / Service Residence",
  "Terrace / Link House",
  "Semi-Detached House",
  "Bungalow / Villa",
]);

function addCommas(s) {
  const n = String(s ?? "").replace(/,/g, "").trim();
  if (!n) return "";
  if (!/^\d+$/.test(n)) return s;
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function toIntFromInput(v) {
  const s = String(v ?? "").replace(/,/g, "").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ✅ 稳定 stringify：避免 initialForm 每次 key 顺序变化导致重复 hydrate
function stableStringify(obj) {
  const seen = new WeakSet();
  const sortDeep = (v) => {
    if (v === null || v === undefined) return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortDeep);
    if (typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);
      const out = {};
      Object.keys(v)
        .sort()
        .forEach((k) => {
          const val = v[k];
          if (val === undefined) return;
          if (typeof val === "function") return;
          out[k] = sortDeep(val);
        });
      return out;
    }
    return v;
  };
  try {
    return JSON.stringify(sortDeep(obj ?? null));
  } catch {
    return "";
  }
}

/**
 * ✅✅✅ 兼容你 upload-property 的 props（关键修复：让父组件 saleType / propertyStatus 等能被 set）
 * 你 upload-property 传入的是：
 * saleType, setSaleType, typeValue, setTypeValue, propertyStatus, setPropertyStatus,
 * roomRentalMode, setRoomRentalMode, rentBatchMode, setRentBatchMode,
 * typeForm, setTypeForm, initialForm
 */
export default function TypeSelector(props) {
  const {
    // 父组件 controlled state（你现在 upload-property 用的）
    saleType,
    setSaleType,
    typeValue,
    setTypeValue,
    propertyStatus,
    setPropertyStatus,
    roomRentalMode,
    setRoomRentalMode,
    rentBatchMode,
    setRentBatchMode,
    typeForm,
    setTypeForm,
    initialForm,
  } = props;

  // ===== 下面这些都用 typeForm 作为 single source of truth（不改你 UI，只是把值写回父组件）=====
  const usage = typeForm?.usage || "";
  const affordable = typeForm?.affordable || "";
  const affordableType = typeForm?.affordableType || "";
  const tenure = typeForm?.tenure || "";
  const category = typeForm?.category || "";
  const finalType = typeForm?.finalType || "";
  const subtype = Array.isArray(typeForm?.subtype) ? typeForm.subtype : [];
  const auctionDate = typeForm?.auctionDate || "";
  const storeys = typeForm?.storeys || "";
  const propertyTitle = typeForm?.propertyTitle || "";
  const roomCountMode = typeForm?.roomCountMode || "single";
  const roomCount = String(typeForm?.roomCount ?? "1");
  const layoutCountInput = String(typeForm?.layoutCount ?? "2");

  const [showSubtype, setShowSubtype] = useState(false);
  const subtypeRef = useRef(null);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);

  const layoutCount = clamp(toIntFromInput(layoutCountInput), 2, 20);

  useEffect(() => {
    const shouldShow =
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property" ||
      category === "Industrial Property";
    setShowSubtype(shouldShow);
  }, [category]);

  useEffect(() => {
    const onDoc = (e) => {
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) {
        setSubtypeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggleSubtype = (opt) => {
    const next = subtype.includes(opt) ? subtype.filter((x) => x !== opt) : [...subtype, opt];
    setTypeForm?.((prev) => ({ ...(prev || {}), subtype: next }));
  };

  const subtypeDisplayText = subtype.join(", ");

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" || propertyStatus === "Completed Unit / Developer Unit";

  const showCategoryBlock = saleType === "Rent" || (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent = saleType === "Rent" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  const showRoomRentalToggle = saleType === "Rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  const hideBatchToggleBecauseRoomRental = saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

  const resetAll = () => {
    setTypeForm?.({});
    setPropertyStatus?.("");
    setTypeValue?.("");
    setRoomRentalMode?.("whole");
    setRentBatchMode?.("no");
    setShowLayoutSuggest(false);
  };

  // ✅✅✅ 编辑模式回填：只 hydrate 一次（避免抖动）
  const hydratedSigRef = useRef("");
  useEffect(() => {
    if (!initialForm || typeof initialForm !== "object") return;
    const sig = stableStringify(initialForm);
    if (!sig || sig === hydratedSigRef.current) return;
    hydratedSigRef.current = sig;

    // 把 initialForm 填回父组件（关键：恢复你原本编辑回填）
    if (initialForm.saleType !== undefined) setSaleType?.(initialForm.saleType || "");
    if (initialForm.propertyStatus !== undefined) setPropertyStatus?.(initialForm.propertyStatus || "");
    if (initialForm.roomRentalMode !== undefined) setRoomRentalMode?.(initialForm.roomRentalMode || "whole");
    if (initialForm.rentBatchMode !== undefined) setRentBatchMode?.(initialForm.rentBatchMode || "no");

    // 把其它字段写进 typeForm
    setTypeForm?.((prev) => ({
      ...(prev || {}),
      usage: initialForm.usage || "",
      propertyTitle: initialForm.propertyTitle || "",
      affordable: initialForm.affordable || "",
      affordableType: initialForm.affordableType || "",
      tenure: initialForm.tenure || "",
      category: initialForm.category || "",
      finalType: initialForm.finalType || "",
      subtype: Array.isArray(initialForm.subtype) ? initialForm.subtype : [],
      auctionDate: initialForm.auctionDate || "",
      storeys: initialForm.storeys || "",
      roomCountMode: initialForm.roomCountMode || "single",
      roomCount: initialForm.roomCount ? Number(initialForm.roomCount) : 1,
      layoutCount: initialForm.layoutCount ? Number(initialForm.layoutCount) : 2,
    }));
  }, [initialForm, setSaleType, setPropertyStatus, setRoomRentalMode, setRentBatchMode, setTypeForm]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            const next = e.target.value;
            setSaleType?.(next);
            resetAll();
          }}
        >
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
          <option value="Homestay">Homestay</option>
          <option value="Hotel/Resort">Hotel/Resort</option>
        </select>
      </div>

      {saleType === "Sale" && (
        <>
          <div>
            <label className="block font-medium">Property Usage</label>
            <select
              className="w-full border rounded p-2"
              value={usage}
              onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), usage: e.target.value }))}
            >
              <option value="">请选择用途</option>
              {usageOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <PropertyTitleSelector
            value={propertyTitle}
            onChange={(val) => setTypeForm?.((prev) => ({ ...(prev || {}), propertyTitle: val }))}
          />

          <div>
            <label className="block font-medium">Property Status / Sale Type</label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus}
              onChange={(e) => {
                setPropertyStatus?.(e.target.value);
                setTypeForm?.((prev) => ({ ...(prev || {}), storeys: "" }));
              }}
            >
              <option value="">请选择</option>
              {saleTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {propertyStatus === "Auction Property" && (
            <div>
              <label className="block font-medium">Auction Date</label>
              <input
                type="date"
                className="w-full border rounded p-2"
                value={auctionDate}
                onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), auctionDate: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label className="block font-medium">Affordable Housing</label>
            <select
              className="w-full border rounded p-2"
              value={affordable}
              onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), affordable: e.target.value }))}
            >
              <option value="">是否属于政府可负担房屋计划？</option>
              <option value="Yes">是</option>
              <option value="No">否</option>
            </select>
          </div>

          {affordable === "Yes" && (
            <div>
              <label className="block font-medium">Affordable Housing Type</label>
              <select
                className="w-full border rounded p-2"
                value={affordableType}
                onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), affordableType: e.target.value }))}
              >
                <option value="">请选择</option>
                {affordableTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-medium">Tenure Type</label>
            <select
              className="w-full border rounded p-2"
              value={tenure}
              onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), tenure: e.target.value }))}
            >
              <option value="">请选择</option>
              {tenureOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {showCategoryBlock && saleType !== "Homestay" && saleType !== "Hotel/Resort" && (
        <>
          <div>
            <label className="block font-medium">Property Category</label>
            <select
              className="w-full border rounded p-2"
              value={category}
              onChange={(e) => {
                const cat = e.target.value;
                setTypeForm?.((prev) => ({
                  ...(prev || {}),
                  category: cat,
                  finalType: "",
                  subtype: [],
                }));
              }}
            >
              <option value="">请选择</option>
              {Object.keys(categoryOptions).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category && categoryOptions[category] && (
            <div>
              <label className="block font-medium">Sub Type</label>
              <select
                className="w-full border rounded p-2"
                value={finalType}
                onChange={(e) => setTypeForm?.((prev) => ({ ...(prev || {}), finalType: e.target.value }))}
              >
                <option value="">请选择具体类型</option>
                {categoryOptions[category].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showStoreys && (
            <FloorCountSelector
              value={storeys}
              onChange={(val) => setTypeForm?.((prev) => ({ ...(prev || {}), storeys: val }))}
            />
          )}

          {showSubtype && (
            <div className="relative" ref={subtypeRef}>
              <label className="block font-medium">Property Subtype</label>

              <div className="w-full border rounded p-2 bg-white cursor-pointer" onClick={() => setSubtypeOpen((p) => !p)}>
                {subtype.length === 0 ? (
                  <span className="text-gray-400">请选择 subtype（可多选）</span>
                ) : (
                  <span className="font-medium">{subtypeDisplayText}</span>
                )}
              </div>

              {subtypeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {subtypeOptions.map((opt) => {
                    const selected = subtype.includes(opt);
                    return (
                      <div
                        key={opt}
                        className={`px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 ${
                          selected ? "bg-gray-50 font-semibold" : ""
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleSubtype(opt);
                        }}
                      >
                        <span>{opt}</span>
                        {selected && <span className="text-green-600">✅</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showRoomRentalToggle && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">是否只是出租房间？</label>
              <select
                className="border rounded w-full p-2"
                value={roomRentalMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setRoomRentalMode?.(v);
                  if (v === "room") setRentBatchMode?.("no");
                }}
              >
                <option value="whole">不是，要出租整间</option>
                <option value="room">是的，只出租房间</option>
              </select>

              {roomRentalMode === "room" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">是否只有一个房间？</label>
                    <select
                      className="border rounded w-full p-2"
                      value={roomCountMode}
                      onChange={(e) => {
                        const mode = e.target.value;
                        setTypeForm?.((prev) => ({
                          ...(prev || {}),
                          roomCountMode: mode,
                          roomCount: mode === "single" ? 1 : 2,
                        }));
                      }}
                    >
                      <option value="single">是的，只有一个房间</option>
                      <option value="multi">不是，有多个房间</option>
                    </select>
                  </div>

                  {roomCountMode === "multi" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">选择房间数量</label>
                      <select
                        className="border rounded w-full p-2"
                        value={roomCount}
                        onChange={(e) =>
                          setTypeForm?.((prev) => ({ ...(prev || {}), roomCount: Number(e.target.value) || 2 }))
                          }
                      >
                        {Array.from({ length: 19 }, (_, i) => String(i + 2)).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {saleType === "Rent" && !!category && !hideBatchToggleBecauseRoomRental && (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => {
              const v = e.target.value;
              setRentBatchMode?.(v);
              setShowLayoutSuggest(false);
            }}
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>

          {rentBatchMode === "yes" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">这个项目有多少个屋型 / Layout 数量</label>

              <div className="relative">
                <input
                  className="border rounded w-full p-2"
                  value={layoutCountInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTypeForm?.((prev) => ({ ...(prev || {}), layoutCount: v }));
                    setShowLayoutSuggest(true);
                  }}
                  onFocus={() => setShowLayoutSuggest(true)}
                  onBlur={() => {
                    setTimeout(() => setShowLayoutSuggest(false), 120);
                    const n = clamp(toIntFromInput(layoutCountInput), 2, 20);
                    setTypeForm?.((prev) => ({ ...(prev || {}), layoutCount: addCommas(String(n)) }));
                  }}
                  inputMode="numeric"
                  placeholder="2 ~ 20"
                />

                {showLayoutSuggest && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                    {Array.from({ length: 19 }).map((_, i) => {
                      const v = String(i + 2);
                      return (
                        <div
                          key={v}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTypeForm?.((prev) => ({ ...(prev || {}), layoutCount: v }));
                            setShowLayoutSuggest(false);
                          }}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
