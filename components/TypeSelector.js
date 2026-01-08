// components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";

// ================== 选项常量 ==================
const subtypeOptions = ["Penthouse", "Duplex", "Studio", "Loft", "SoHo", "SoVo", "SoFo", "Serviced Apartment (Homestay)", "Condominium", "Apartment", "Flat", "Townhouse", "Link House", "Terrace House", "Semi-Detached House", "Bungalow", "Villa", "Cluster House", "Zero-Lot Bungalow", "Link Bungalow", "Bungalow land", "Twin Villa", "Shop", "Office", "Retail", "Commercial Land", "Factory", "Warehouse", "Industrial Land", "Agricultural Land", "Residential Land", "Mixed Development Land", "Leasehold", "Freehold"];

const usageOptions = ["Residential", "Commercial", "Industrial", "Land"];

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

const categoryOptions = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terrace House", "Link House", "Townhouse"],
  "Business Property": ["Shop", "Office", "Retail", "Commercial Land"],
  "Industrial Property": ["Factory", "Warehouse", "Industrial Land"],
  Land: ["Residential Land", "Agricultural Land", "Mixed Development Land"],
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
  const [storeys, setStoreys] = useState("");

  // Rent: room rental
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole | room
  const [roomCountMode, setRoomCountMode] = useState("single"); // single | multi
  const [roomCount, setRoomCount] = useState("1");

  // Rent batch: layout count
  const [layoutCountInput, setLayoutCountInput] = useState("2");

  const [showSubtype, setShowSubtype] = useState(false);
  const [subtypeOpen, setSubtypeOpen] = useState(false);
  const subtypeRef = useRef(null);

  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);
  const layoutInputRef = useRef(null);

  const toIntFromInput = (v) => {
    const s = String(v ?? "").replace(/,/g, "").trim();
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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

  useEffect(() => {
    const form = {
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
    };

    onFormChange?.(form);
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

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  // ✅✅✅ 修复1：Rent 批量时也要显示 Category / SubType / Storeys / Subtype 等
  const showCategoryBlock =
    (saleType === "Rent") ||
    (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  // ✅✅✅ 修复2：Rent 批量时也不要隐藏 storeys
  const needStoreysForRent = saleType === "Rent" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  // ✅✅✅ 修复3：Rent 批量时也不要隐藏「出租整间 / 出租房间」
  const showRoomRentalToggle =
    saleType === "Rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  const hideBatchToggleBecauseRoomRental =
    saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

  // ================== UI 渲染（保持你原本结构不变） ==================
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => setSaleType(e.target.value)}
        >
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
          <option value="Homestay">Homestay</option>
          <option value="Hotel/Resort">Hotel/Resort</option>
        </select>
      </div>

      {/* ✅ Sale 的 Property Status 保持原样（Rent 不会出现） */}
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
              <option value="New Project / Under Construction">New Project / Under Construction</option>
              <option value="Completed Unit / Developer Unit">Completed Unit / Developer Unit</option>
              <option value="Subsale / Secondary Market">Subsale / Secondary Market</option>
              <option value="Auction Property">Auction Property</option>
              <option value="Rent-to-Own Scheme">Rent-to-Own Scheme</option>
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
              <select
                className="w-full border rounded p-2"
                value={affordableType}
                onChange={(e) => setAffordableType(e.target.value)}
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
              onChange={(e) => setTenure(e.target.value)}
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

      {/* ✅ Rent：保留你原本的出租整间/房间 + 批量操作（并且批量时不隐藏其它输入框） */}
      {saleType === "Rent" && (
        <>
          {showRoomRentalToggle && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">是否只是出租房间？</label>
              <select className="border rounded w-full p-2" value={roomRentalMode} onChange={(e) => setRoomRentalMode(e.target.value)}>
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
                        const v = e.target.value;
                        setRoomCountMode(v);
                        if (v === "single") setRoomCount("1");
                      }}
                    >
                      <option value="single">是的，只有一个房间</option>
                      <option value="multi">不是，有多个房间</option>
                    </select>
                  </div>

                  {roomCountMode === "multi" && (
                    <div className="mt-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">有多少个房间</label>
                      <input
                        className="border rounded w-full p-2"
                        value={roomCount}
                        onChange={(e) => setRoomCount(e.target.value)}
                        placeholder="2 ~ 20"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {saleType === "Rent" && !!category && !hideBatchToggleBecauseRoomRental && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
              <select
                className="border rounded w-full p-2"
                value={rentBatchMode}
                onChange={(e) => onChangeRentBatchMode?.(e.target.value)}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </div>
          )}

          {saleType === "Rent" && rentBatchMode === "yes" && !hideBatchToggleBecauseRoomRental && (
            <div className="relative mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">这个项目有多少个房型 / Layout</label>
              <input
                ref={layoutInputRef}
                className="border rounded w-full p-2"
                value={layoutCountInput}
                onChange={(e) => setLayoutCountInput(e.target.value)}
                onFocus={() => setShowLayoutSuggest(true)}
                onBlur={() => setTimeout(() => setShowLayoutSuggest(false), 150)}
                placeholder="2 ~ 20"
              />

              {showLayoutSuggest && (
                <div className="absolute z-50 mt-1 w-full border rounded bg-white shadow p-2 max-h-56 overflow-auto">
                  {Array.from({ length: 19 }).map((_, i) => {
                    const v = String(i + 2);
                    return (
                      <div
                        key={v}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer rounded"
                        onMouseDown={() => setLayoutCountInput(v)}
                      >
                        {v}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ✅ Category / Sub Type / Storeys / Property Subtype：Rent 批量也不会隐藏 */}
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
              <select
                className="w-full border rounded p-2"
                value={finalType}
                onChange={(e) => setFinalType(e.target.value)}
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
            <FloorCountSelector value={storeys} onChange={(val) => setStoreys(val)} />
          )}

          {showSubtype && (
            <div className="relative" ref={subtypeRef}>
              <label className="block font-medium">Property Subtype</label>

              <div
                className="w-full border rounded p-2 bg-white cursor-pointer"
                onClick={() => setSubtypeOpen((v) => !v)}
              >
                {subtype.length > 0 ? subtype.join(", ") : "请选择 subtype（可多选）"}
              </div>

              {subtypeOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto border rounded bg-white p-2 shadow">
                  {subtypeOptions.map((opt) => {
                    const checked = subtype.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSubtype((prev) => {
                              if (prev.includes(opt)) return prev.filter((x) => x !== opt);
                              return [...prev, opt];
                            });
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
