// components/TypeSelector.js
"use client";

import { useState, useEffect } from "react";
import FloorCountSelector from "./FloorCountSelector";

export default function TypeSelector({
  value = "",
  onChange = () => {},
  onFormChange,
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
  const [storeys, setStoreys] = useState(""); // ⭐ 有多少层

  const subtypeOptions = [
    "Penthouse",
    "Duplex",
    "Triplex",
    "Dual Key",
    "None / Not Applicable",
  ];

  // Homestay 和 Hotel/Resort 分类
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

  // 初始化 finalType（只在父组件第一次传入时同步一次）
  useEffect(() => {
    if (value && value !== finalType) {
      setFinalType(value);
    }
    // ⚠️ 不依赖 finalType，否则会循环
  }, [value]);

  // 当 saleType 或 finalType 改变时，组合成对外暴露的字符串
  useEffect(() => {
    let newValue;
    if (saleType === "Homestay" || saleType === "Hotel/Resort") {
      newValue = finalType ? `${saleType} - ${finalType}` : "";
    } else {
      newValue = finalType;
    }

    if (newValue && newValue !== value) {
      onChange(newValue);
    }
  }, [saleType, finalType, onChange]); // 不依赖 value

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
    "Terrace / Link House": [
      // ✅ 只保留这两个
      "Terraced House",
      "Townhouse",
    ],
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

  // ⭐ 当前是否为「项目类」成交状态（New Project / Completed Unit）
  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  // ⭐ Property Category 什么时候显示？
  // 1. Sale & 非项目类（Subsale / Auction / RTO）
  // 2. Rent
  // 3. 或者已经选了 usage（但项目类仍然不显示）
  const showCategory =
    (!isProjectStatus && saleType === "Sale") ||
    saleType === "Rent" ||
    (!isProjectStatus && !!usage);

  // 哪些 Category 要显示「有多少层」
  const needStoreysCategories = new Set([
    "Bungalow / Villa",
    "Business Property",
    "Industrial Property",
    "Semi-Detached House",
    "Terrace / Link House",
  ]);

  // 把所有表单字段回传给父组件（UploadProperty 用 onFormChange 拿 propertyStatus 等）
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

  return (
    <div className="space-y-4">
      {/* Sale / Rent / Homestay / Hotel */}
      <div>
        <label className="block font-medium">
          Sale / Rent / Homestay / Hotel
        </label>
        <select
          className="w-full border rounded p-2"
          value={saleType}
          onChange={(e) => {
            const newSaleType = e.target.value;
            setSaleType(newSaleType);
            setFinalType("");

            // 如果切去 Homestay/Hotel，清空 Sale 专用字段
            if (newSaleType === "Homestay" || newSaleType === "Hotel/Resort") {
              setUsage("");
              setPropertyStatus("");
              setCategory("");
              setSubtype("");
              setStoreys("");
            }
          }}
        >
          <option value="">请选择</option>
          <option value="Sale">Sale</option>
          <option value="Rent">Rent</option>
          <option value="Homestay">Homestay</option>
          <option value="Hotel/Resort">Hotel/Resort</option>
        </select>
      </div>

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

      {/* Hotel/Resort 分类 */}
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

      {/* Sale 相关字段 */}
      {saleType === "Sale" && (
        <>
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

          <div>
            <label className="block font-medium">
              Property Status / Sale Type
            </label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus}
              onChange={(e) => {
                const status = e.target.value;
                setPropertyStatus(status);

                const nextIsProject =
                  status === "New Project / Under Construction" ||
                  status === "Completed Unit / Developer Unit";

                // ⭐ 从 Subsale 切去 New Project / Completed Unit：
                // 1. 顶部的 Property Category / Subtype / 层数全部清空
                // 2. 顶部 Category 隐藏，只保留 Layout 里的 Category
                if (nextIsProject) {
                  setCategory("");
                  setSubtype("");
                  setStoreys("");
                }
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

      {/* Property Category —— 只在 非 Homestay/Hotel 且 非项目类 时显示 */}
      {showCategory &&
        saleType !== "Homestay" &&
        saleType !== "Hotel/Resort" &&
        !isProjectStatus && (
          <>
            <div>
              <label className="block font-medium">Property Category</label>
              <select
                className="w-full border rounded p-2"
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  setFinalType("");
                  setSubtype("");
                  setStoreys("");
                }}
              >
                <option value="">请选择类别</option>
                {Object.keys(categoryOptions)
                  .filter((cat) => {
                    if (affordable === "Yes") {
                      return ![
                        "Business Property",
                        "Industrial Property",
                        "Land",
                      ].includes(cat);
                    }
                    return true;
                  })
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            {category && categoryOptions[category] && (
              <>
                <div>
                  <label className="block font-medium">Sub Type</label>
                  <select
                    className="w-full border rounded p-2"
                    value={finalType}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setFinalType(selected);

                      const shouldShowSubtype =
                        category ===
                          "Apartment / Condo / Service Residence" ||
                        category === "Business Property";
                      setShowSubtype(shouldShowSubtype);
                    }}
                  >
                    <option value="">请选择具体类型</option>
                    {categoryOptions[category].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 有多少层（和你 Layout 里的一样白色下拉） */}
                {needStoreysCategories.has(category) && (
                  <FloorCountSelector
                    value={storeys}
                    onChange={(val) => setStoreys(val)}
                  />
                )}

                {showSubtype && (
                  <div>
                    <label className="block font-medium">
                      Property Subtype
                    </label>
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
          </>
        )}
    </div>
  );
}
