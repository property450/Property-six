// components/TypeSelector.js
"use client";

import { useState, useEffect } from "react";
import FloorCountSelector from "./FloorCountSelector";

// ================== 选项常量 ==================
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

// 哪些 Category 需要显示「有多少层」
const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
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

const usageOptions = [
  "Residential",
  "Commercial",
  "Commercial Under HDA",
  "Industrial",
  "Agricultural",
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
  const [affordable, setAffordable] = useState("");
  const [affordableType, setAffordableType] = useState("");
  const [tenure, setTenure] = useState("");
  const [category, setCategory] = useState("");
  const [finalType, setFinalType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [auctionDate, setAuctionDate] = useState("");
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState("");

  // ---------- 外部 value（最终 type） ----------
  useEffect(() => {
    let newValue = "";

    if (saleType === "Homestay" || saleType === "Hotel/Resort") {
      newValue = finalType ? `${saleType} - ${finalType}` : saleType;
    } else {
      newValue = finalType || saleType || "";
    }

    if (newValue !== value) {
      onChange && onChange(newValue);
    }
  }, [saleType, finalType, value, onChange]);

  // ---------- 通知外部完整表单 ----------
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
      storeys,
      rentBatchMode,
    };
    onFormChange && onFormChange(formData);
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
    onFormChange,
  ]);

  // Apartment / Business 时显示 subtype 下拉
  useEffect(() => {
    const shouldShow =
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property";
    setShowSubtype(shouldShow);
  }, [category]);

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  // 顶部 Category 是否显示
  const showCategoryBlock =
    (saleType === "Rent" && rentBatchMode !== "yes") ||
    (saleType === "Sale" && !isProjectStatus);

  // 需要显示楼层的情况：
  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(
      propertyStatus
    ) && NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent =
    saleType === "Rent" &&
    rentBatchMode !== "yes" &&
    NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  return (
    <div className="space-y-4">
      {/* ---------- 顶部：Sale / Rent / Homestay / Hotel ---------- */}
      <div>
        <label className="block font-medium">
          Sale / Rent / Homestay / Hotel
        </label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            const v = e.target.value;
            setSaleType(v);

            // 切换大类时重置
            setUsage("");
            setPropertyStatus("");
            setAffordable("");
            setAffordableType("");
            setTenure("");
            setCategory("");
            setFinalType("");
            setSubtype("");
            setAuctionDate("");
            setStoreys("");
            setShowSubtype(false);
            onChangeRentBatchMode && onChangeRentBatchMode("no");
          }}
        >
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
          <option value="Homestay">Homestay</option>
          <option value="Hotel/Resort">Hotel/Resort</option>
        </select>
      </div>

      {/* Rent 批量开关 */}
      {saleType === "Rent" && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            需要批量操作吗？
          </label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) =>
              onChangeRentBatchMode && onChangeRentBatchMode(e.target.value)
            }
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>
        </div>
      )}

      {/* Homestay 分类 */}
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

      {/* Hotel / Resort 分类 */}
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

      {/* ---------- Sale 相关字段 ---------- */}
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

          {/* Auction Date */}
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

      {/* ---------- Category + Sub Type + Storeys ---------- */}
      {showCategoryBlock &&
        saleType !== "Homestay" &&
        saleType !== "Hotel/Resort" && (
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

            {/* ✅ 在 Sub Type 下面显示「有多少层」 */}
            {showStoreys && (
              <FloorCountSelector
                value={storeys}
                onChange={(val) => setStoreys(val)}
              />
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
