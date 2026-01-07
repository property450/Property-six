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
  "Cultural / Heritage Homestay",
  "Monthly Rental Stay",
];

const hotelResortOptions = [
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
    "Shop / Office",
    "Sofo",
    "Soho",
    "Sovo",
    "Commercial Bungalow",
    "Commercial Semi-Detached House",
    "Mall / Commercial Complex",
    "School / University",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Government Office",
    "Community Hall / Public Utilities",
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
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
]);

const affordableOptions = [
  "Rumah Mampu Milik",
  "PPR",
  "PR1MA",
  "Rumah Selangorku",
  "Rumah WIP (Wilayah Persekutuan)",
  "Rumah Mampu Milik Johor (RMMJ)",
  "Rumah Mesra Rakyat",
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

const saleTypeOptions = [
  "New Project / Under Construction",
  "Completed Unit / Developer Unit",
  "Subsale / Secondary Market",
  "Auction Property",
  "Rent-to-Own Scheme",
];

const usageOptions = ["Residential", "Commercial", "Commercial Under HDA", "Industrial", "Agricultural"];

// ---------- helpers ----------
function addCommas(n) {
  const s = String(n ?? "");
  if (!s) return "";
  const raw = s.replace(/,/g, "").trim();
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toIntFromInput(v) {
  const s = String(v ?? "").replace(/,/g, "").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n);
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
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

  // 房间出租：whole / room
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  // 是否只有一个房间：single / multi
  const [roomCountMode, setRoomCountMode] = useState("single");
  const [roomCount, setRoomCount] = useState("1");

  // ✅ Rent 批量：Layout 数量（2~20，可输入 + 下拉建议）
  const [layoutCountInput, setLayoutCountInput] = useState("2"); // 显示用（带逗号）
  const layoutCount = clamp(toIntFromInput(layoutCountInput), 2, 20);
  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);
  const layoutInputRef = useRef(null);

  const [subtypeOpen, setSubtypeOpen] = useState(false);
  const subtypeRef = useRef(null);

  // 外部最终 type
  useEffect(() => {
    let newValue = "";
    if (saleType === "Homestay" || saleType === "Hotel/Resort") {
      newValue = finalType ? `${saleType} - ${finalType}` : saleType;
    } else {
      newValue = finalType || saleType || "";
    }
    if (newValue !== value) onChange?.(newValue);
  }, [saleType, finalType, value, onChange]);

  // 通知外部表单数据
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
      rentBatchMode,
      roomRentalMode,
      roomCountMode,
      roomCount,

      // ✅ 关键：把 layoutCount 传出去给 upload-property 用
      layoutCount, // number
      layoutCountInput, // string（显示用）
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
    rentBatchMode,
    roomRentalMode,
    roomCountMode,
    roomCount,
    layoutCount,
    layoutCountInput,
    onFormChange,
  ]);

  // 点击空白关 subtype 下拉
  useEffect(() => {
    const onDoc = (e) => {
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) setSubtypeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // 什么时候显示 subtype
  useEffect(() => {
    const shouldShow =
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property" ||
      category === "Industrial Property";
    setShowSubtype(shouldShow);
  }, [category]);

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" || propertyStatus === "Completed Unit / Developer Unit";

  // Rent 批量 yes 时隐藏 category block（batch 会在每个 layout 表单里选 category）
  const showCategoryBlock =
    (saleType === "Rent" && rentBatchMode !== "yes") || (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent = saleType === "Rent" && rentBatchMode !== "yes" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  const showRoomRentalToggle =
    saleType === "Rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category) && rentBatchMode !== "yes";

  // 房间出租模式下隐藏“需要批量操作吗？”
  const hideBatchToggleBecauseRoomRental = saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

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
    setShowSubtype(false);
    setSubtypeOpen(false);

    setRoomRentalMode("whole");
    setRoomCountMode("single");
    setRoomCount("1");

    onChangeRentBatchMode?.("no");
    setLayoutCountInput("2");
  };

  const toggleSubtype = (item) => {
    setSubtype((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
  };

  const subtypeDisplayText =
    subtype.length === 0 ? "请选择 subtype（可多选）" : subtype.map((v) => `${v} ✅`).join("，");

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
          <label className="block font-medium">Homestay Type</label>
          <select className="w-full border rounded p-2" value={finalType} onChange={(e) => setFinalType(e.target.value)}>
            <option value="">请选择 Homestay 类型</option>
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
          <label className="block font-medium">Hotel / Resort Type</label>
          <select className="w-full border rounded p-2" value={finalType} onChange={(e) => setFinalType(e.target.value)}>
            <option value="">请选择 Hotel/Resort 类型</option>
            {hotelResortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

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
              <select
                className="w-full border rounded p-2"
                value={affordableType}
                onChange={(e) => setAffordableType(e.target.value)}
              >
                <option value="">请选择</option>
                {affordableOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
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
                setStoreys("");
                setSubtypeOpen(false);

                setRoomRentalMode("whole");
                setRoomCountMode("single");
                setRoomCount("1");
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
                        {Array.from({ length: 9 }, (_, i) => String(i + 2)).map((n) => (
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

      {/* ✅ Rent：批量操作开关 */}
      {saleType === "Rent" && !!category && !(saleType === "Rent" && roomRentalMode === "room") && (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => {
              const v = e.target.value;
              onChangeRentBatchMode?.(v);

              if (v === "yes") setLayoutCountInput("2");
            }}
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>

          {/* ✅ 单一输入框 + 下拉建议（datalist） */}
          {rentBatchMode === "yes" && (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      这个项目有多少个屋型 / Layout 数量
    </label>

    <div className="relative">
      <input
        ref={layoutInputRef}
        className="border rounded w-full p-2 bg-white"
        value={layoutCountInput}
        onChange={(e) => {
          setLayoutCountInput(addCommas(e.target.value));
          setShowLayoutSuggest(true);
        }}
        onFocus={() => setShowLayoutSuggest(true)}
        onBlur={() => {
          // 让点击建议项先执行（所以延迟关闭）
          setTimeout(() => setShowLayoutSuggest(false), 120);

          const n = clamp(toIntFromInput(layoutCountInput), 2, 20);
          setLayoutCountInput(addCommas(String(n)));
        }}
        inputMode="numeric"
        placeholder="2 ~ 20"
      />

      {showLayoutSuggest && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {Array.from({ length: 19 }, (_, i) => i + 2)
            .filter((n) => {
              // 简单过滤：输入了数字就只显示匹配前缀（例如输入 1 显示 10~19 但我们范围到20，所以会显示 10~19）
              const raw = String(layoutCountInput || "").replace(/,/g, "").trim();
              if (!raw) return true;
              return String(n).startsWith(raw);
            })
            .map((n) => (
              <button
                key={n}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                onMouseDown={(e) => {
                  // 防止 blur 抢先触发
                  e.preventDefault();
                  setLayoutCountInput(String(n)); // 2~20 不需要逗号
                  setShowLayoutSuggest(false);

                  // 让输入框保持 focus（体验更像白色下拉）
                  requestAnimationFrame(() => layoutInputRef.current?.focus());
                }}
              >
                {n}
              </button>
            ))}
        </div>
      )}
    </div>

    <div className="text-xs text-gray-500">
      当前：{layoutCount} 个屋型（自动限制 2～20）
    </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
