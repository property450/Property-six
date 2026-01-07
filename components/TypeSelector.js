// components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";

const subtypeOptions = [
  "Penthouse",
  "Duplex",
  "Triplex",
  "Townhouse",
  "Loft",
  "Studio",
  "SOHO",
  "SOVO",
  "Serviced Apartment",
  "Cluster",
  "Other",
];
const tenureOptions = ["Freehold", "Leasehold", "Malay Reserved", "Bumi Lot", "Other"];

const saleTypeOptions = ["Sale", "Rent", "Homestay", "Hotel / Resort"];
const propertyStatusOptions = [
  "Subsale / Secondary Market",
  "New Project / Under Construction",
  "Completed Unit / Developer Unit",
  "Auction Property",
  "Rent-to-Own",
];

const affordableOptions = ["No", "Yes"];
const affordableTypeOptions = [
  "PR1MA",
  "Rumah Selangorku",
  "Rumah Mampu Milik",
  "PPA1M",
  "RUMAWIP",
  "MyHome",
  "Other",
];

const usageOptions = ["Residential", "Commercial", "Industrial", "Land", "Others"];

const categoryOptions = {
  Residential: [
    "Bungalow / Villa",
    "Semi-Detached House",
    "Terrace / Link House",
    "Townhouse",
    "Cluster House",
    "Apartment / Condo / Service Residence",
    "Flat",
    "Studio",
    "SOHO / SOVO / SOFO",
    "Penthouse",
    "Duplex / Triplex",
    "Serviced Apartment",
    "Other Residential",
  ],
  Commercial: [
    "Shop / Office",
    "Retail Space",
    "Office Space",
    "Commercial Land",
    "Hotel / Resort",
    "Other Commercial",
  ],
  Industrial: ["Factory", "Warehouse", "Industrial Land", "Other Industrial"],
  Land: ["Residential Land", "Commercial Land", "Industrial Land", "Agricultural Land", "Other Land"],
  Others: ["Other"],
};

// 哪些 category 需要楼层数
const NEED_STOREYS_CATEGORY = [
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Townhouse",
  "Cluster House",
  "Shop / Office",
  "Factory",
  "Warehouse",
];

// 哪些 category 才能房间出租
const ROOM_RENTAL_ELIGIBLE_CATEGORIES = [
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Townhouse",
  "Cluster House",
  "Apartment / Condo / Service Residence",
  "Flat",
  "Studio",
  "SOHO / SOVO / SOFO",
  "Serviced Apartment",
  "Other Residential",
];
const ROOM_RENTAL_ELIGIBLE_SALETYPE = ["Rent"];

function normalizeSubtype(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function TypeSelector({
  value,
  onChange,
  onFormChange,
  rentBatchMode = "no",
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

  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [roomCountMode, setRoomCountMode] = useState("single");
  const [roomCount, setRoomCount] = useState("2");

  const subtypeRef = useRef(null);
  const didHydrateRef = useRef(false);

  // hydrate from value
  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    if (!value || typeof value !== "object") return;

    setSaleType(value.saleType || "");
    setUsage(value.usage || "");
    setPropertyStatus(value.propertyStatus || "");
    setAffordable(value.affordable || "");
    setAffordableType(value.affordableType || "");
    setTenure(value.tenure || "");
    setCategory(value.propertyCategory || "");
    setFinalType(value.finalType || "");
    setSubtype(normalizeSubtype(value.subtype));
    setAuctionDate(value.auctionDate || "");
    setStoreys(value.storeys || "");
    setRoomRentalMode(value.roomRentalMode || "whole");
    setRoomCountMode(value.roomCountMode || "single");
    setRoomCount(value.roomCount || "2");
  }, [value]);

  // subtype show/hide
  useEffect(() => {
    const shouldShow =
      !!category &&
      (category.includes("Apartment") ||
        category.includes("Condo") ||
        category.includes("Service") ||
        category.includes("SOHO") ||
        category.includes("SOVO") ||
        category.includes("SOFO") ||
        category.includes("Penthouse") ||
        category.includes("Duplex") ||
        category.includes("Triplex") ||
        category.includes("Studio") ||
        category.includes("Serviced") ||
        category.includes("Townhouse") ||
        category.includes("Cluster"));

    setShowSubtype(shouldShow);
    if (!shouldShow) setSubtype([]);
  }, [category]);

  // ✅ Rent 模式：不显示 usage，但为了 categoryOptions 能用，内部固定为 Residential
  useEffect(() => {
    if (saleType === "Rent") {
      if (!usage) setUsage("Residential");
      // Rent 不需要 propertyStatus
      if (propertyStatus) setPropertyStatus("");
      // Rent 不需要 Sale 才有的字段
      if (affordable) setAffordable("");
      if (affordableType) setAffordableType("");
      if (tenure) setTenure("");
    }
  }, [saleType]); // eslint-disable-line react-hooks/exhaustive-deps

  // when usage changes, reset category if mismatch (只对 Sale 有意义，Rent usage 固定 Residential)
  useEffect(() => {
    if (!usage) return;
    if (!categoryOptions[usage]?.includes(category)) {
      setCategory("");
    }
  }, [usage]); // eslint-disable-line react-hooks/exhaustive-deps

  // build finalType + emit
  useEffect(() => {
    const parts = [];
    if (saleType) parts.push(saleType);

    // ✅ Rent 不显示 usage/status，但 finalType 仍可保留 usage（也可不加，你要更短我也能改）
    if (usage) parts.push(usage);

    // ✅ Sale 才加入 propertyStatus
    if (saleType === "Sale" && propertyStatus) parts.push(propertyStatus);

    // Sale 才有 affordable/tenure
    if (saleType === "Sale" && affordable) {
      parts.push(affordable === "Yes" ? "Affordable" : "Not Affordable");
      if (affordable === "Yes" && affordableType) parts.push(affordableType);
    }
    if (saleType === "Sale" && tenure) parts.push(tenure);

    if (category) parts.push(category);

    const t = parts.join(" / ");
    setFinalType(t);

    const form = {
      saleType,
      usage,
      propertyStatus: saleType === "Sale" ? propertyStatus : "",
      affordable: saleType === "Sale" ? affordable : "",
      affordableType: saleType === "Sale" ? affordableType : "",
      tenure: saleType === "Sale" ? tenure : "",
      propertyCategory: category,
      subtype,
      auctionDate: saleType === "Sale" ? auctionDate : "",
      storeys,
      finalType: t,
      roomRentalMode,
      roomCountMode,
      roomCount,
    };

    onFormChange?.(form);
    onChange?.(form);
  }, [
    saleType,
    usage,
    propertyStatus,
    affordable,
    affordableType,
    tenure,
    category,
    subtype,
    auctionDate,
    storeys,
    roomRentalMode,
    roomCountMode,
    roomCount,
    onFormChange,
    onChange,
  ]);

  // ✅ 显示条件：Rent 不显示 status/usage
  const showPropertyStatus = saleType === "Sale";
  const showAffordable = saleType === "Sale";
  const showTenure = saleType === "Sale";
  const showUsage = saleType === "Sale";

  // ✅ Category：Sale 需要先选 usage；Rent 直接显示
  const showCategoryBlock =
    saleType === "Rent" ? true : !!usage && saleType === "Sale";

  const needStoreys = NEED_STOREYS_CATEGORY.includes(category);
  const canRoomRental =
    ROOM_RENTAL_ELIGIBLE_SALETYPE.includes(saleType) &&
    ROOM_RENTAL_ELIGIBLE_CATEGORIES.includes(category);

  const hideBatchToggleBecauseRoomRental = saleType === "Rent" && roomRentalMode === "room";

  return (
    <div className="space-y-4">
      {/* Sale / Rent / Homestay / Hotel */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Sale / Rent / Homestay / Hotel
        </label>
        <select
          className="border rounded w-full p-2"
          value={saleType}
          onChange={(e) => {
            const v = e.target.value;
            setSaleType(v);

            // reset downstream when switching top type
            setUsage("");
            setPropertyStatus("");
            setAffordable("");
            setAffordableType("");
            setTenure("");
            setCategory("");
            setSubtype([]);
            setAuctionDate("");
            setStoreys("");

            setRoomRentalMode("whole");
            setRoomCountMode("single");
            setRoomCount("2");
          }}
        >
          <option value="">请选择</option>
          {saleTypeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Property Status (Sale only) */}
      {showPropertyStatus && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Status</label>
          <select
            className="border rounded w-full p-2"
            value={propertyStatus}
            onChange={(e) => {
              const v = e.target.value;
              setPropertyStatus(v);
              if (v !== "Auction Property") setAuctionDate("");
            }}
          >
            <option value="">请选择</option>
            {propertyStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {propertyStatus === "Auction Property" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Auction Date</label>
              <input
                type="date"
                className="border rounded w-full p-2"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Affordable (Sale only) */}
      {showAffordable && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Affordable Housing?</label>
          <select
            className="border rounded w-full p-2"
            value={affordable}
            onChange={(e) => {
              const v = e.target.value;
              setAffordable(v);
              if (v !== "Yes") setAffordableType("");
            }}
          >
            <option value="">请选择</option>
            {affordableOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {affordable === "Yes" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Affordable Type</label>
              <select
                className="border rounded w-full p-2"
                value={affordableType}
                onChange={(e) => setAffordableType(e.target.value)}
              >
                <option value="">请选择</option>
                {affordableTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tenure (Sale only) */}
      {showTenure && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Tenure</label>
          <select
            className="border rounded w-full p-2"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          >
            <option value="">请选择</option>
            {tenureOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Usage (Sale only) */}
      {showUsage && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Usage</label>
          <select
            className="border rounded w-full p-2"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
          >
            <option value="">请选择</option>
            {usageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Property Category (Sale: after usage; Rent: direct) */}
      {showCategoryBlock && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Category</label>
          <select
            className="border rounded w-full p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">请选择类别</option>
            {(categoryOptions[usage] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Subtype (multi) */}
          {showSubtype && (
            <div className="mt-2" ref={subtypeRef}>
              <label className="block text-sm font-medium text-gray-700">Property Subtype（可多选）</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subtypeOptions.map((opt) => {
                  const checked = subtype.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        setSubtype((prev) => {
                          const arr = Array.isArray(prev) ? prev : [];
                          if (arr.includes(opt)) return arr.filter((x) => x !== opt);
                          return [...arr, opt];
                        });
                      }}
                      className={`px-3 py-1 rounded border ${
                        checked ? "bg-blue-600 text-white border-blue-600" : "bg-white"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storeys */}
          {needStoreys && (
            <div className="mt-2">
              <FloorCountSelector value={storeys} onChange={setStoreys} />
            </div>
          )}

          {/* Rent room rental mode */}
          {saleType === "Rent" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Rent Mode</label>
              <select
                className="border rounded w-full p-2"
                value={roomRentalMode}
                onChange={(e) => {
                  const v = e.target.value;
                  setRoomRentalMode(v);
                  if (v !== "room") {
                    setRoomCountMode("single");
                    setRoomCount("2");
                  }
                }}
              >
                <option value="whole">Whole Unit</option>
                <option value="room" disabled={!canRoomRental}>
                  Room Rental (只适用于部分住宅类型)
                </option>
              </select>

              {roomRentalMode === "room" && (
                <div className="mt-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">房间数量模式</label>
                  <select
                    className="border rounded w-full p-2"
                    value={roomCountMode}
                    onChange={(e) => setRoomCountMode(e.target.value)}
                  >
                    <option value="single">单一房间出租</option>
                    <option value="multiple">多个房间出租</option>
                  </select>

                  {roomCountMode === "multiple" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700">房间数量</label>
                      <select
                        className="border rounded w-full p-2"
                        value={roomCount}
                        onChange={(e) => setRoomCount(e.target.value)}
                      >
                        {Array.from({ length: 9 }, (_, i) => String(i + 2)).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rent batch toggle: Rent + selected category only */}
      {saleType === "Rent" && !!category && !hideBatchToggleBecauseRoomRental && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => onChangeRentBatchMode?.(e.target.value)}
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>
        </div>
      )}
    </div>
  );
}
