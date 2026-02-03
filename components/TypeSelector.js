// components/TypeSelector.js
"use client";

import { useEffect, useRef, useState } from "react";
import FloorCountSelector from "./FloorCountSelector";
import PropertyTitleSelector from "@/components/PropertyTitleSelector";

// ================== 选项常量 ==================
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

export default function TypeSelector({
  // ✅ 你 upload-property(31).js 现在用的就是这套 props（必须对齐）
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
}) {
  // ====== 其余字段存在 typeForm 里（保持你原本结构） ======
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

  // Rent room logic
  const [roomCountMode, setRoomCountMode] = useState("single");
  const [roomCount, setRoomCount] = useState("1");

  // Rent batch layout count（只给“整间出租 + 批量操作”）
  const [layoutCountInput, setLayoutCountInput] = useState("2");
  const [showLayoutSuggest, setShowLayoutSuggest] = useState(false);
  const layoutCount = clamp(toInt(layoutCountInput), 2, 20);

  // Property Subtype dropdown（可多选）
  const subtypeRef = useRef(null);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

  // ====== Hydrate from initialForm（编辑回填稳定） ======
  const hydratedSigRef = useRef("");
  useEffect(() => {
    if (!initialForm || typeof initialForm !== "object") return;
    const sig = stableStringify(initialForm);
    if (!sig || sig === hydratedSigRef.current) return;
    hydratedSigRef.current = sig;

    // 这些字段：如果 parent 还没回填，就补一下（不覆盖你 parent 现有值）
    if (!saleType && initialForm.saleType) setSaleType(initialForm.saleType);
    if (!propertyStatus && initialForm.propertyStatus) setPropertyStatus(initialForm.propertyStatus);
    if (!roomRentalMode && initialForm.roomRentalMode) setRoomRentalMode(initialForm.roomRentalMode);
    if (!rentBatchMode && initialForm.rentBatchMode) setRentBatchMode(initialForm.rentBatchMode);

    // 其余进本地 state
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

    // 同步回 typeForm（不破坏）
    setTypeForm((prev) => ({ ...(prev || {}), ...(initialForm || {}) }));
  }, [initialForm]); // ✅ 不要把一堆 setter 放 deps，避免抖动

  // 点击外部收起 subtype
  useEffect(() => {
    const onDoc = (e) => {
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) {
        setSubtypeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showSubtype =
    category === "Apartment / Condo / Service Residence" || category === "Business Property" || category === "Industrial Property";

  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" || propertyStatus === "Completed Unit / Developer Unit";

  const showCategoryBlock = saleType === "Rent" || (saleType === "Sale" && !isProjectStatus);

  const needStoreysForSale =
    ["Subsale / Secondary Market", "Auction Property", "Rent-to-Own Scheme"].includes(propertyStatus) &&
    NEED_STOREYS_CATEGORY.has(category);

  const needStoreysForRent = saleType === "Rent" && NEED_STOREYS_CATEGORY.has(category);

  const showStoreys = needStoreysForSale || needStoreysForRent;

  const showRoomRentalToggle = saleType === "Rent" && ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  // ✅✅✅关键：房间出租时，不允许出现“批量 Layout 数量”
  const isRoomRental = saleType === "Rent" && showRoomRentalToggle && roomRentalMode === "room";

  const subtypeDisplayText = subtype.join(", ");

  const patchTypeForm = (patch) => {
    setTypeForm((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  };

  const resetAllForSaleTypeChange = (nextSaleType) => {
    // ✅ 只 reset “类型选择相关”，不碰你其它表单 state
    setPropertyStatus("");
    setUsage("");
    setAffordable("");
    setAffordableType("");
    setTenure("");
    setCategory("");
    setFinalType("");
    setSubtype([]);
    setAuctionDate("");
    setStoreys("");
    setPropertyTitle("");

    // Rent extra
    setRoomRentalMode("whole");
    setRoomCountMode("single");
    setRoomCount("1");
    setRentBatchMode("no");
    setLayoutCountInput("2");
    setShowLayoutSuggest(false);

    // 同步 typeForm
    patchTypeForm({
      saleType: nextSaleType,
      propertyStatus: "",
      usage: "",
      propertyTitle: "",
      affordable: "",
      affordableType: "",
      tenure: "",
      category: "",
      finalType: "",
      subtype: [],
      auctionDate: "",
      storeys: "",
      roomRentalMode: "whole",
      roomCountMode: "single",
      roomCount: 1,
      rentBatchMode: "no",
      layoutCount: 2,
    });
  };

  const toggleSubtype = (opt) => {
    setSubtype((prev) => {
      const next = prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt];
      patchTypeForm({ subtype: next });
      return next;
    });
  };

  // ====== UI ======
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Sale / Rent / Homestay / Hotel</label>
        <select
          className="w-full border rounded p-2"
          value={saleType || ""}
          onChange={(e) => {
            const next = e.target.value;
            setSaleType(next);
            resetAllForSaleTypeChange(next);
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
              onChange={(e) => {
                setUsage(e.target.value);
                patchTypeForm({ usage: e.target.value });
              }}
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
            onChange={(val) => {
              setPropertyTitle(val);
              patchTypeForm({ propertyTitle: val });
            }}
          />

          <div>
            <label className="block font-medium">Property Status / Sale Type</label>
            <select
              className="w-full border rounded p-2"
              value={propertyStatus || ""}
              onChange={(e) => {
                setPropertyStatus(e.target.value);
                patchTypeForm({ propertyStatus: e.target.value });
                setStoreys("");
                patchTypeForm({ storeys: "" });
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
                onChange={(e) => {
                  setAuctionDate(e.target.value);
                  patchTypeForm({ auctionDate: e.target.value });
                }}
              />
            </div>
          )}

          <div>
            <label className="block font-medium">Affordable Housing</label>
            <select
              className="w-full border rounded p-2"
              value={affordable}
              onChange={(e) => {
                setAffordable(e.target.value);
                patchTypeForm({ affordable: e.target.value });
              }}
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
                onChange={(e) => {
                  setAffordableType(e.target.value);
                  patchTypeForm({ affordableType: e.target.value });
                }}
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
              onChange={(e) => {
                setTenure(e.target.value);
                patchTypeForm({ tenure: e.target.value });
              }}
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

      {/* Sale(非Project) / Rent 的 category block */}
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
                patchTypeForm({ category: cat, finalType: "", subtype: [] });
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
                onChange={(e) => {
                  setFinalType(e.target.value);
                  patchTypeForm({ finalType: e.target.value });
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
          )}

          {showStoreys && (
            <FloorCountSelector
              value={storeys}
              onChange={(val) => {
                setStoreys(val);
                patchTypeForm({ storeys: val });
              }}
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

          {/* ✅ Rent：整间/房间切换（你原本逻辑） */}
          {showRoomRentalToggle && (
            <div className="mt-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">是否只是出租房间？</label>
              <select
                className="border rounded w-full p-2"
                value={roomRentalMode}
                onChange={(e) => {
                  const v = e.target.value;

                  setRoomRentalMode(v);
                  patchTypeForm({ roomRentalMode: v });

                  // ✅ 一旦切到“房间出租”，强制关闭批量 Layout（避免你现在的 bug）
                  if (v === "room") {
                    setRentBatchMode("no");
                    patchTypeForm({ rentBatchMode: "no", layoutCount: 2 });

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
                        patchTypeForm({ roomCountMode: mode });

                        if (mode === "single") {
                          setRoomCount("1");
                          patchTypeForm({ roomCount: 1 });
                        } else {
                          setRoomCount("2");
                          patchTypeForm({ roomCount: 2 });
                        }
                      }}
                    >
                      <option value="single">是的，只有一个房间</option>
                      <option value="multi">不是，有多个房间</option>
                    </select>
                  </div>

                  {/* ✅ 只有选择“多个房间”才出现数量 */}
                  {roomCountMode === "multi" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">选择房间数量</label>
                      <select
                        className="border rounded w-full p-2"
                        value={roomCount}
                        onChange={(e) => {
                          setRoomCount(e.target.value);
                          patchTypeForm({ roomCount: Number(e.target.value) || 2 });
                        }}
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

      {/* ✅✅✅ Rent 批量操作：只允许“整间出租 whole”出现（房间出租时绝对不显示） */}
      {saleType === "Rent" && !!category && !isRoomRental && (
        <div className="mt-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">需要批量操作吗？</label>
          <select
            className="border rounded w-full p-2"
            value={rentBatchMode}
            onChange={(e) => {
              const v = e.target.value;
              setRentBatchMode(v);
              patchTypeForm({ rentBatchMode: v });
              setShowLayoutSuggest(false);

              // 关闭时重置 layoutCount
              if (v !== "yes") {
                setLayoutCountInput("2");
                patchTypeForm({ layoutCount: 2 });
              }
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
                    const n = clamp(toInt(layoutCountInput), 2, 20);
                    setLayoutCountInput(addCommas(String(n)));
                    patchTypeForm({ layoutCount: n });
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
                            patchTypeForm({ layoutCount: Number(v) });
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
