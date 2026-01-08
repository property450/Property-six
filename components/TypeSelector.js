// components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";

// ================== 选项常量 ==================
const subtypeOptions = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

const homestayOptions = [
  "Entire Place",
  "Private Room",
  "Shared Room",
  "Serviced Apartment (Homestay)",
];

const hotelOptions = [
  "Single Room",
  "Double Room",
  "Twin Room",
  "Family Room",
  "Suite",
  "Villa",
  "Resort Room",
];

const usageOptions = ["Residential", "Commercial", "Industrial", "Land"];

const saleTypeOptions = [
  "New Project / Under Construction",
  "Completed Unit / Developer Unit",
  "Subsale / Secondary Market",
  "Auction Property",
  "Rent-to-Own Scheme",
];

const affordableTypeOptions = [
  "Rumah Mampu Milik",
  "PR1MA",
  "Rumah Selangorku",
  "Rumah Mesra Rakyat",
  "PPA1M",
  "RUMAWIP",
  "MyHome",
  "RUMAHWIP",
];

const tenureOptions = ["Freehold", "Leasehold", "Malay Reserved", "Bumi Lot"];

// ✅✅✅ 这里就是你“之前的设计”的 categoryOptions（完全照回，不乱改）
const categoryOptions = {
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
  "Terrace / Link House": ["Terrace House", "Link House", "Townhouse"],
  "Business Property": [
    "Shop",
    "Office",
    "Retail",
    "Commercial Land",
    "Hotel",
    "Hotel Apartment",
    "Hostel / Guesthouse",
    "Capsule / Pod Stay",
    "Cultural / Heritage Lodge",
    "Shophouse",
    "Shop Apartment",
    "Food Court",
    "Restaurant / Cafe",
    "Entertainment / Leisure",
    "Convention / Exhibition Space",
    "Co-working Space",
    "Business Centre",
    "Data Centre",
    "Studio / Production Space",
    "Sports / Recreation Facility",
    "Education / Training Centre",
    "Childcare / Kindergarten",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Event Hall / Ballroom",
    "Car Wash",
    "Petrol Station",
    "Showroom",
    "Bank / Financial Office",
    "Government Office",
    "Warehouse Retail",
    "Supermarket / Hypermarket",
  ],
  "Industrial Property": [
    "Factory",
    "Warehouse",
    "Industrial Land",
    "Detached Factory",
    "Semi-Detached Factory",
    "Terrace Factory",
    "Cluster Factory",
    "Light Industrial",
    "Heavy Industrial",
    "Logistics / Distribution Centre",
    "Cold Storage / Warehouse",
    "Workshop",
    "Plant / Mill",
    "Recycling / Waste Facility",
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

export default function TypeSelector({
  value,
  onChange,
  onFormChange,
  rentBatchMode,
  onChangeRentBatchMode,
}) {
  const [saleType, setSaleType] = useState("");
  const [usage, setUsage] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [affordable, setAffordable] = useState("");
  const [affordableType, setAffordableType] = useState("");
  const [tenure, setTenure] = useState("");
  const [category, setCategory] = useState("");
  const [finalType, setFinalType] = useState("");

  const [subtype, setSubtype] = useState([]);
  const [auctionDate, setAuctionDate] = useState("");
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState("");

  // Rent room rental
  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [roomCountMode, setRoomCountMode] = useState("single");
  const [roomCount, setRoomCount] = useState("1");

  // Rent batch: layout count (✅ 这里也给 Sale Project 复用，不改你原本的 UI)
  const [layoutCountInput, setLayoutCountInput] = useState("2");
  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);

  const layoutCount = clamp(toIntFromInput(layoutCountInput), 2, 20);

  const subtypeRef = useRef(null);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

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
    setSubtype((prev) => {
      if (prev.includes(opt)) return prev.filter((x) => x !== opt);
      return [...prev, opt];
    });
  };

  const subtypeDisplayText = subtype.join(", ");

  // ✅ Sale Project statuses（New Project / Completed Unit Developer Unit）
  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  // ✅ 你要的：Sale 模式下 New Project / Completed Unit 都要有 layout 数量
  const isSaleProject = saleType === "Sale" && isProjectStatus;

  const showCategoryBlock = saleType === "Rent" || (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent = saleType === "Rent" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  const showRoomRentalToggle = saleType === "Rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  const hideBatchToggleBecauseRoomRental =
    saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

  const resetAll = () => {
    setUsage("");
    setPropertyStatus("");
    setAffordable("");
    setAffordableType("");
    setTenure("");
    setCategory("");
    setFinalType("");
    setSubtype([]);
    setAuctionDate("");
    setStoreys("");

    setRoomRentalMode("whole");
    setRoomCountMode("single");
    setRoomCount("1");

    setLayoutCountInput("2");
    setShowLayoutSuggest(false);

    onChangeRentBatchMode?.("no");
  };

  useEffect(() => {
    onFormChange?.({
      saleType,
      usage,
      propertyStatus,
      affordable,
      affordableType,
      tenure,
      category,
      finalType,
      subtype,
      auctionDate,
      storeys,

      roomRentalMode,
      roomCountMode,
      roomCount: Number(roomCount) || 1,

      layoutCount,
    });
  }, [
    saleType,
    usage,
    propertyStatus,
    affordable,
    affordableType,
    tenure,
    category,
    finalType,
    subtype,
    auctionDate,
    storeys,
    roomRentalMode,
    roomCountMode,
    roomCount,
    layoutCount,
    onFormChange,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            const next = e.target.value;
            setSaleType(next);
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
            <select className="w-full border rounded p-2" value={usage} onChange={(e) => setUsage(e.target.value)}>
              <option value="">请选择用途</option>
              {usageOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Property Status / Sale Type</label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus}
              onChange={(e) => {
                setPropertyStatus(e.target.value);
                setStoreys("");
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
                onChange={(e) => setAuctionDate(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block font-medium">Affordable Housing</label>
            <select className="w-full border rounded p-2" value={affordable} onChange={(e) => setAffordable(e.target.value)}>
              <option value="">是否属于政府可负担房屋计划？</option>
              <option value="Yes">是</option>
              <option value="No">否</option>
            </select>
          </div>

          {affordable === "Yes" && (
            <div>
              <label className="block font-medium">Affordable Housing Type</label>
              <select className="w-full border rounded p-2" value={affordableType} onChange={(e) => setAffordableType(e.target.value)}>
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
            <select className="w-full border rounded p-2" value={tenure} onChange={(e) => setTenure(e.target.value)}>
              <option value="">请选择</option>
              {tenureOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* ✅✅✅ 关键新增：Sale 模式（New Project / Completed Unit Developer Unit）也显示 Layout 数量 */}
          {isSaleProject && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">这个项目有多少个屋型 / Layout 数量</label>

              <div className="relative">
                <input
                  className="border rounded w-full p-2"
                  value={layoutCountInput}
                  onChange={(e) => {
                    setLayoutCountInput(e.target.value);
                    setShowLayoutSuggest(true);
                  }}
                  onFocus={() => setShowLayoutSuggest(true)}
                  onBlur={() => {
                    setTimeout(() => setShowLayoutSuggest(false), 120);
                    const n = clamp(toIntFromInput(layoutCountInput), 2, 20);
                    setLayoutCountInput(addCommas(String(n)));
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
                            setLayoutCountInput(v);
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
                setCategory(cat);
                setFinalType("");
                setSubtype([]);
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
              <select className="w-full border rounded p-2" value={finalType} onChange={(e) => setFinalType(e.target.value)}>
                <option value="">请选择具体类型</option>
                {categoryOptions[category].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showStoreys && <FloorCountSelector value={storeys} onChange={(val) => setStoreys(val)} />}

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

          {/* ✅ Rent：出租房间选择（只加了“切到 room 自动关闭批量”这一行，其他不动） */}
          {showRoomRentalToggle && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">是否只是出租房间？</label>
              <select
                className="border rounded w-full p-2"
                value={roomRentalMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setRoomRentalMode(v);
                  // ✅ 唯一新增：切到“出租房间”自动关闭批量，避免残留导致出现第1/第2房型表单
                  if (v === "room") {
                    onChangeRentBatchMode?.("no");
                  }
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
                        setRoomCountMode(mode);
                        if (mode === "single") setRoomCount("1");
                        else setRoomCount("2");
                      }}
                    >
                      <option value="single">是的，只有一个房间</option>
                      <option value="multi">不是，有多个房间</option>
                    </select>
                  </div>

                  {roomCountMode === "multi" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">选择房间数量</label>
                      <select className="border rounded w-full p-2" value={roomCount} onChange={(e) => setRoomCount(e.target.value)}>
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

      {/* ✅ Rent：批量操作（保持原逻辑，不乱动，只保留你原本的显示/文字） */}
      {saleType === "Rent" && !!category && !hideBatchToggleBecauseRoomRental && (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => {
              const v = e.target.value;
              onChangeRentBatchMode?.(v);
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
                    setLayoutCountInput(e.target.value);
                    setShowLayoutSuggest(true);
                  }}
                  onFocus={() => setShowLayoutSuggest(true)}
                  onBlur={() => {
                    setTimeout(() => setShowLayoutSuggest(false), 120);
                    const n = clamp(toIntFromInput(layoutCountInput), 2, 20);
                    setLayoutCountInput(addCommas(String(n)));
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
                            setLayoutCountInput(v);
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
