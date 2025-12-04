// components/TypeSelector.js
"use client";

import { useState, useEffect } from "react";
import FloorCountSelector from "./FloorCountSelector";

export default function TypeSelector({
  value,
  onChange,
  onFormChange,
  rentBatchMode,         // "no" | "yes"
  onChangeRentBatchMode, // function
}) {
  // 顶层状态
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel
  const [usage, setUsage] = useState("");       // Residential / Commercial 等
  const [propertyStatus, setPropertyStatus] = useState(""); // New Project / Subsale...
  const [affordable, setAffordable] = useState("");
  const [affordableType, setAffordableType] = useState("");
  const [tenure, setTenure] = useState("");
  const [category, setCategory] = useState(""); // Property Category
  const [finalType, setFinalType] = useState(""); // 具体类型 Apartment / Bungalow...
  const [subtype, setSubtype] = useState("");     // Penthouse / Duplex...
  const [auctionDate, setAuctionDate] = useState("");
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState("");     // ⭐ 有多少层（单一 Rent、Subsale 用）

  // ================= Homestay / Hotel 选项 =================
  const subtypeOptions = [
    "Penthouse",
    "Duplex",
    "Triplex",
    "Dual Key",
    "None / Not Applicable",
  ];

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

  // ================= Category & 其它下拉选项 =================
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

  const usageOptions = [
    "Residential",
    "Commercial",
    "Commercial Under HDA",
    "Industrial",
    "Agricultural",
  ];

  // ⭐ 哪些 Category 要显示「有多少层」
  const NEED_STOREYS_CATEGORY = new Set([
    "Bungalow / Villa",
    "Business Property",
    "Industrial Property",
    "Semi-Detached House",
    "Terrace / Link House",
  ]);

  // ============ 1. 计算当前是否项目类状态 ============
  const isProjectStatus =
    saleType === "Sale" &&
    (propertyStatus?.includes("New Project") ||
      propertyStatus?.includes("Under Construction") ||
      propertyStatus?.includes("Completed Unit") ||
      propertyStatus?.includes("Developer Unit"));

  // Category 是否显示：
  // - Sale：但不是项目类 (New Project / Completed Unit / Developer Unit)
  // - Rent：只有「不批量」时显示（批量时每个 Layout 自己选）
  const showCategory =
    (saleType === "Sale" && !isProjectStatus) ||
    (saleType === "Rent" && rentBatchMode !== "yes");

  // FloorCountSelector 什么时候显示：
  // - Category 在 NEED_STOREYS_CATEGORY 里
  // - 并且 (单一 Rent) 或 (Sale + Subsale)
  const showStoreys =
    NEED_STOREYS_CATEGORY.has(category) &&
    ((saleType === "Rent" && rentBatchMode !== "yes") ||
      (saleType === "Sale" &&
        propertyStatus === "Subsale / Secondary Market"));

  // ============ 2. 把内部状态组合成对外的 value ============
  useEffect(() => {
    let newValue = "";

    if (saleType === "Homestay" || saleType === "Hotel/Resort") {
      // Homestay / Hotel: 「Homestay - Entire Place」
      newValue = finalType ? `${saleType} - ${finalType}` : saleType;
    } else {
      // Sale / Rent：用具体类型 finalType，如果还没选就用 saleType
      newValue = finalType || saleType || "";
    }

    if (newValue !== value) {
      onChange && onChange(newValue);
    }
  }, [saleType, finalType]); // 不依赖 value，避免死循环

  // ============ 3. 把整份表单其它字段通过 onFormChange 回传 ============
  useEffect(() => {
    const formData = {
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
      storeys, // ⭐ 把层数也回传出去
    };
    if (typeof onFormChange === "function") {
      onFormChange(formData);
    }
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
    onFormChange,
  ]);

  // =========================== JSX ===========================
  return (
    <div className="space-y-4">
      {/* Sale / Rent / Homestay / Hotel */}
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            const v = e.target.value;
            setSaleType(v);

            // 切换大类时清空其它字段
            setUsage("");
            setPropertyStatus("");
            setAffordable("");
            setAffordableType("");
            setTenure("");
            setCategory("");
            setFinalType("");
            setSubtype("");
            setAuctionDate("");
            setShowSubtype(false);
            setStoreys("");
          }}
        >
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
          <option value="Homestay">Homestay</option>
          <option value="Hotel/Resort">Hotel/Resort</option>
        </select>
      </div>

      {/* ================== Homestay / Hotel 选项 ================== */}
      {saleType === "Homestay" && (
        <div>
          <label className="block font-medium">Homestay Type</label>
          <select
            className="w-full border rounded p-2"
            value={finalType}
            onChange={(e) => setFinalType(e.target.value)}
          >
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
          <select
            className="w-full border rounded p-2"
            value={finalType}
            onChange={(e) => setFinalType(e.target.value)}
          >
            <option value="">请选择 Hotel/Resort 类型</option>
            {hotelResortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ================== Sale 相关字段 ================== */}
      {saleType === "Sale" && (
        <>
          {/* Property Usage */}
          <div>
            <label className="block font-medium">Property Usage</label>
            <select
              className="w-full border rounded p-2"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
            >
              <option value="">请选择用途</option>
              {usageOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Property Status / Sale Type */}
          <div>
            <label className="block font-medium">
              Property Status / Sale Type
            </label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus}
              onChange={(e) => setPropertyStatus(e.target.value)}
            >
              <option value="">请选择</option>
              {saleTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 拍卖日期 */}
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

          {/* Affordable Housing */}
          <div>
            <label className="block font-medium">Affordable Housing</label>
            <select
              className="w-full border rounded p-2"
              value={affordable}
              onChange={(e) => setAffordable(e.target.value)}
            >
              <option value="">是否属于政府可负担房屋计划？</option>
              <option value="Yes">是</option>
              <option value="No">否</option>
            </select>
          </div>

          {affordable === "Yes" && (
            <div>
              <label className="block font-medium">
                Affordable Housing Type
              </label>
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

          {/* Tenure */}
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

      {/* ================== Rent: 是否需要批量操作 ================== */}
      {saleType === "Rent" && (
        <div>
          <label className="block font-medium text-gray-700">
            需要批量操作吗？
          </label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode || "no"}
            onChange={(e) =>
              onChangeRentBatchMode && onChangeRentBatchMode(e.target.value)
            }
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>
        </div>
      )}

      {/* ================== Property Category + Sub Type ================== */}
      {showCategory && saleType !== "Homestay" && saleType !== "Hotel/Resort" && (
        <>
          {/* Category */}
          <div>
            <label className="block font-medium">Property Category</label>
            <select
              className="w-full border rounded p-2"
              value={category}
              onChange={(e) => {
                const cat = e.target.value;
                setCategory(cat);
                setFinalType("");
                setSubtype("");
                setShowSubtype(
                  cat === "Apartment / Condo / Service Residence" ||
                    cat === "Business Property"
                );
                setStoreys("");
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

          {/* Sub Type */}
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

          {/* ⭐ 单一 Rent 或 Subsale：显示有多少层 */}
          {showStoreys && (
            <div className="mt-2">
              <FloorCountSelector
                value={storeys}
                onChange={(val) => setStoreys(val)}
              />
            </div>
          )}

          {/* Property Subtype（Penthouse / Duplex 等） */}
          {showSubtype && (
            <div>
              <label className="block font-medium">Property Subtype</label>
              <select
                className="w-full border rounded p-2"
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
              >
                <option value="">请选择 subtype（如有）</option>
                {subtypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
