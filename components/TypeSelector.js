// components/TypeSelector.js
"use client";

import { useEffect, useRef, useState } from "react";
import FloorCountSelector from "./FloorCountSelector";
import PropertyTitleSelector from "@/components/PropertyTitleSelector";

// ================== 选项常量（保持你原本风格） ==================
const subtypeOptions = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

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

// ✅✅✅（保持你原本的 categoryOptions）
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

function toInt(v) {
  const s = String(v ?? "").replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function addCommas(s) {
  const n = String(s ?? "").replace(/,/g, "").trim();
  if (!n) return "";
  if (!/^\d+$/.test(n)) return s;
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
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

export default function TypeSelector(props) {
  // ✅✅✅ 兼容两套 props：
  // A) 你现在 upload-property 用的：saleType / setSaleType / typeForm / setTypeForm ...
  // B) 旧版：value / onChange / onFormChange / rentBatchMode / onChangeRentBatchMode ...
  const saleType = props.saleType ?? props.value ?? "";
  const setSaleType =
    props.setSaleType ??
    props.onChange ??
    (() => {
      /* no-op */
    });

  const typeValue = props.typeValue ?? "";
  const setTypeValue =
    props.setTypeValue ??
    (() => {
      /* no-op */
    });

  const propertyStatus = props.propertyStatus ?? "";
  const setPropertyStatus =
    props.setPropertyStatus ??
    (() => {
      /* no-op */
    });

  const roomRentalMode = props.roomRentalMode ?? "whole";
  const setRoomRentalMode =
    props.setRoomRentalMode ??
    (() => {
      /* no-op */
    });

  const rentBatchMode = props.rentBatchMode ?? "no";
  const setRentBatchMode =
    props.setRentBatchMode ??
    props.onChangeRentBatchMode ??
    (() => {
      /* no-op */
    });

  const typeForm = props.typeForm ?? {};
  const setTypeForm =
    props.setTypeForm ??
    props.onFormChange ??
    (() => {
      /* no-op */
    });

  const initialForm = props.initialForm ?? null;

  // ============ 本地 state（只管理 TypeSelector 自己的字段） ============
  const [usage, setUsage] = useState("");
  const [affordable, setAffordable] = useState("");
  const [affordableType, setAffordableType] = useState("");
  const [tenure, setTenure] = useState("");

  const [category, setCategory] = useState("");
  const [finalType, setFinalType] = useState("");

  const [subtype, setSubtype] = useState([]);
  const [auctionDate, setAuctionDate] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");

  // Rent 房间出租：数量
  const [roomCountMode, setRoomCountMode] = useState("single"); // single | multi
  const [roomCount, setRoomCount] = useState("1");

  // Rent 整租批量：layout 数量（只允许整租）
  const [layoutCountInput, setLayoutCountInput] = useState("2");
  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);
  const layoutCount = clamp(toInt(layoutCountInput), 2, 20);

  // subtype dropdown
  const subtypeRef = useRef(null);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

  const patchTypeForm = (patch) => {
    // props.onFormChange 版本可能是直接接收 object，不一定是 setState(fn)
    if (typeof setTypeForm === "function") {
      try {
        // 如果是 setState(fn)
        setTypeForm((prev) => ({ ...(prev || {}), ...(patch || {}) }));
      } catch {
        // 如果是 onFormChange(obj)
        setTypeForm({ ...(typeForm || {}), ...(patch || {}) });
      }
    }
  };

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  const showCategoryBlock = String(saleType || "").toLowerCase() === "rent" || (saleType === "Sale" && !isProjectStatus);

  const showSubtype =
    category === "Apartment / Condo / Service Residence" || category === "Business Property" || category === "Industrial Property";

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent = String(saleType || "").toLowerCase() === "rent" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  const showRoomRentalToggle = String(saleType || "").toLowerCase() === "rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  const isRoomRental = String(saleType || "").toLowerCase() === "rent" && String(roomRentalMode || "") === "room";

  // ✅✅✅ 最关键：只要是房间出租，就强制关闭批量 + reset layoutCount（防止你截图同时出现）
  useEffect(() => {
    if (String(saleType || "").toLowerCase() !== "rent") return;

    if (String(roomRentalMode || "") === "room") {
      if (rentBatchMode !== "no") setRentBatchMode("no");
      if (layoutCountInput !== "2") setLayoutCountInput("2");
      setShowLayoutSuggest(false);

      patchTypeForm({
        rentBatchMode: "no",
        layoutCount: 2,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleType, roomRentalMode]);

  // 点击外部收起 subtype
  useEffect(() => {
    const onDoc = (e) => {
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) setSubtypeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ✅✅✅ 编辑回填：全部 setter 都安全调用（不会再 setSaleType is not a function）
  const hydratedSigRef = useRef("");
  useEffect(() => {
    if (!initialForm || typeof initialForm !== "object") return;

    const sig = stableStringify(initialForm);
    if (!sig || sig === hydratedSigRef.current) return;
    hydratedSigRef.current = sig;

    // safe setters
    if (initialForm.saleType && typeof setSaleType === "function") setSaleType(initialForm.saleType);
    if (initialForm.typeValue !== undefined && typeof setTypeValue === "function") setTypeValue(initialForm.typeValue);
    if (initialForm.propertyStatus && typeof setPropertyStatus === "function") setPropertyStatus(initialForm.propertyStatus);
    if (initialForm.roomRentalMode && typeof setRoomRentalMode === "function") setRoomRentalMode(initialForm.roomRentalMode);
    if (initialForm.rentBatchMode && typeof setRentBatchMode === "function") setRentBatchMode(initialForm.rentBatchMode);

    setUsage(initialForm.usage || "");
    setPropertyTitle(initialForm.propertyTitle || "");
    setAffordable(initialForm.affordable || "");
    setAffordableType(initialForm.affordableType || "");
    setTenure(initialForm.tenure || "");
    setCategory(initialForm.category || "");
    setFinalType(initialForm.finalType || "");
    setSubtype(Array.isArray(initialForm.subtype) ? initialForm.subtype : []);
    setAuctionDate(initialForm.auctionDate || "");
    setStoreys(initialForm.storeys || "");
    setRoomCountMode(initialForm.roomCountMode || "single");
    setRoomCount(initialForm.roomCount ? String(initialForm.roomCount) : "1");
    if (initialForm.layoutCount) setLayoutCountInput(String(initialForm.layoutCount));

    // 如果回填就是房间出租，强制关批量
    if ((initialForm.saleType || "") === "Rent" && (initialForm.roomRentalMode || "") === "room") {
      if (typeof setRentBatchMode === "function") setRentBatchMode("no");
      setLayoutCountInput("2");
      setShowLayoutSuggest(false);
    }

    patchTypeForm({ ...(initialForm || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialForm]);

  // 同步进 typeForm（保存用）
  useEffect(() => {
    patchTypeForm({
      saleType,
      typeValue,
      usage,
      propertyTitle,
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
      rentBatchMode,
      layoutCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saleType,
    typeValue,
    usage,
    propertyTitle,
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
    rentBatchMode,
    layoutCount,
  ]);

  const toggleSubtype = (opt) => {
    setSubtype((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType || ""}
          onChange={(e) => {
            const next = e.target.value;
            if (typeof setSaleType === "function") setSaleType(next);

            // 只 reset TypeSelector 相关（不碰你其它表单）
            setUsage("");
            if (typeof setPropertyStatus === "function") setPropertyStatus("");
            setAffordable("");
            setAffordableType("");
            setTenure("");
            setCategory("");
            setFinalType("");
            setSubtype([]);
            setAuctionDate("");
            setStoreys("");
            setPropertyTitle("");

            if (typeof setRoomRentalMode === "function") setRoomRentalMode("whole");
            setRoomCountMode("single");
            setRoomCount("1");

            if (typeof setRentBatchMode === "function") setRentBatchMode("no");
            setLayoutCountInput("2");
            setShowLayoutSuggest(false);
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

          <PropertyTitleSelector value={propertyTitle} onChange={(val) => setPropertyTitle(val)} />

          <div>
            <label className="block font-medium">Property Status / Sale Type</label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus || ""}
              onChange={(e) => {
                if (typeof setPropertyStatus === "function") setPropertyStatus(e.target.value);
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
                  <span className="font-medium">{subtype.join(", ")}</span>
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

          {/* ✅ Rent：整间 / 房间 */}
          {showRoomRentalToggle && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">是否只是出租房间？</label>
              <select
                className="border rounded w-full p-2"
                value={roomRentalMode}
                onChange={(e) => {
                  const v = e.target.value;
                  if (typeof setRoomRentalMode === "function") setRoomRentalMode(v);

                  // ✅ 切到房间出租：强制关闭批量 + reset layout
                  if (v === "room") {
                    if (typeof setRentBatchMode === "function") setRentBatchMode("no");
                    setLayoutCountInput("2");
                    setShowLayoutSuggest(false);
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

                        // 房间出租永远不允许 batch
                        if (typeof setRentBatchMode === "function") setRentBatchMode("no");
                        setLayoutCountInput("2");
                        setShowLayoutSuggest(false);
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

      {/* ✅✅✅ Rent 批量操作：只允许“整间出租”出现；房间出租时永远不显示 */}
      {String(saleType || "").toLowerCase() === "rent" && !!category && String(roomRentalMode || "") !== "room" && (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => {
              const v = e.target.value;
              if (typeof setRentBatchMode === "function") setRentBatchMode(v);
              setShowLayoutSuggest(false);
              if (v !== "yes") setLayoutCountInput("2");
            }}
          >
            <option value="no">否，只是单一房源</option>
            <option value="yes">是，这个项目有多个房型</option>
          </select>

          {rentBatchMode === "yes" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">这个项目有多少个房型 / Layout 数量</label>

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
                    const n = clamp(toInt(layoutCountInput), 2, 20);
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
