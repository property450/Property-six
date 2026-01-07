// components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";

const subtypeOptions = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

const homestayOptions = [
  "Entire Place",
  "Private Room",
  "Shared Room",
  "Serviced Apartment (Homestay)",
  "Villa Homestay",
  "Farmstay / Kampung Stay",
  "Hostel / Guesthouse",
  "Capsule / Pod Stay",
  "Glamping / Camping",
  "Chalet / Cabin",
];

const hotelResortOptions = [
  "Beach Resort",
  "Island Resort",
  "Mountain Resort",
  "Luxury Resort",
  "Budget Hotel",
  "Business Hotel",
  "Boutique Hotel",
  "5-Star Hotel",
  "4-Star Hotel",
  "3-Star Hotel",
  "Serviced Apartment Hotel",
  "Convention Hotel",
  "Spa / Hot Spring Hotel",
  "Casino Hotel",
  "Extended Stay Hotel",
  "Capsule Hotel",
  "Hostel / Backpacker Hotel",
  "Airport Hotel",
];

const categoryOptions = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terraced House", "Townhouse"],
  "Business Property": [
    "Hotel / Resort",
    "Hostel / Dormitory",
    "Boutique Hotel",
    "Office",
    "Office Suite",
    "Business Suite",
    "Retail Shop",
    "Retail Space",
    "Retail Office",
    "Shop",
    "Shop Office",
    "Shop Lot",
    "Showroom",
    "Warehouse (Commercial)",
    "Restaurant",
    "Cafe",
    "Food Court",
    "Petrol Station",
    "Other Business",
  ],
  "Industrial Property": [
    "Factory",
    "Cluster Factory",
    "Semi-D Factory",
    "Detached Factory",
    "Terrace Factory",
    "Warehouse",
    "Showroom cum Warehouse",
    "Light Industrial",
    "Heavy Industrial",
  ],
  Land: [
    "Agricultural Land",
    "Industrial Land",
    "Commercial Land",
    "Residential Land",
    "Malay Reserved Land",
    "Bumi Lot Land",
    "Orchard Land",
    "Plantation Land",
    "Other Land",
  ],
  Others: ["Other"],
};

const usageOptions = ["Residential", "Commercial", "Industrial", "Land", "Others"];

const saleTypeOptions = [
  "Subsale / Secondary Market",
  "New Project / Under Construction",
  "Completed Unit / Developer Unit",
  "Auction Property",
  "Rent-to-Own",
];

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

  const [homestayType, setHomestayType] = useState("");
  const [hotelType, setHotelType] = useState("");

  const [category, setCategory] = useState("");
  const [finalType, setFinalType] = useState("");
  const [subtype, setSubtype] = useState([]);

  const [storeys, setStoreys] = useState("");

  const [subtypeOpen, setSubtypeOpen] = useState(false);

  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [roomCountMode, setRoomCountMode] = useState("single");
  const [roomCount, setRoomCount] = useState("2");

  const subtypeRef = useRef(null);

  const resetAll = () => {
    setUsage("");
    setPropertyStatus("");
    setHomestayType("");
    setHotelType("");
    setCategory("");
    setFinalType("");
    setSubtype([]);
    setStoreys("");
    setSubtypeOpen(false);
    setRoomRentalMode("whole");
    setRoomCountMode("single");
    setRoomCount("2");
  };

  // 根据 category 自动判断是否需要显示 “Subtype 多选按钮区域”
  // （你原本就有，但现在页面用的是 Sub Type 下拉，不会影响）
  useEffect(() => {
    const shouldShow = false;
    if (!shouldShow) {
      setSubtypeOpen(false);
    }
  }, [category]);

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" || propertyStatus === "Completed Unit / Developer Unit";

  // ✅ 你原本逻辑：Rent 且非批量（no）才显示 Category（批量 yes 时 Category 在 layout 里选）
  const showCategoryBlock =
    (saleType === "Rent" && rentBatchMode !== "yes") || (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property"].includes(propertyStatus);

  const showStoreys =
    saleType === "Sale" && needStoreysForSale && ["Bungalow / Villa", "Semi-Detached House", "Terrace / Link House"].includes(category);

  const showRoomRentalToggle = saleType === "Rent";

  const subtypeDisplayText =
    subtype.length === 0 ? "请选择 subtype（可多选）" : subtype.map((v) => `${v} ✅`).join("，");

  // 房间出租模式下隐藏“需要批量操作吗？”
  const hideBatchToggleBecauseRoomRental = saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

  // 把选择内容回传给父组件（你原本就有）
  useEffect(() => {
    if (!saleType) return;

    const form = {
      saleType,
      usage,
      propertyStatus,
      homestayType,
      hotelType,
      propertyCategory: category,
      finalType,
      subtype,
      storeys,
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
    homestayType,
    hotelType,
    category,
    finalType,
    subtype,
    storeys,
    roomRentalMode,
    roomCountMode,
    roomCount,
    onFormChange,
    onChange,
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

      {saleType === "Homestay" && (
        <div>
          <label className="block font-medium">Homestay type</label>
          <select className="w-full border rounded p-2" value={homestayType} onChange={(e) => setHomestayType(e.target.value)}>
            <option value="">请选择</option>
            {homestayOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {saleType === "Hotel/Resort" && (
        <div>
          <label className="block font-medium">Hotel/Resort type</label>
          <select className="w-full border rounded p-2" value={hotelType} onChange={(e) => setHotelType(e.target.value)}>
            <option value="">请选择</option>
            {hotelResortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ Rent 不需要 Usage / Property Status，你原本就已经是 Sale 才显示 */}
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
        </>
      )}

      {/* ✅ 你要的 “原本那套” Category + Sub Type 下拉 */}
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
                setStoreys("");
                setSubtypeOpen(false);

                setRoomRentalMode("whole");
                setRoomCountMode("single");
                setRoomCount("2");
              }}
            >
              <option value="">请选择类别</option>
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
            <FloorCountSelector
              value={storeys}
              onChange={(val) => setStoreys(val)}
            />
          )}
        </>
      )}

      {/* Rent：房间出租模式（你原本逻辑保留） */}
      {saleType === "Rent" && showRoomRentalToggle && (
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
            <option value="room">Room Rental</option>
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

      {/* ✅✅✅ 关键修复：Rent 的批量选择框必须“先选了 Property Category”才出现 */}
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
