// components/homestay/HomestayUploadForm.js
"use client";

import { useEffect, useRef, useState } from "react";
import FloorCountSelector from "@/components/FloorCountSelector";

// ✅ 复用 Hotel/Resort 表单（你项目真实路径保持不变）
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

// ================= Homestay Options =================
export const homestayOptions = [
  "Entire Place",
  "Private Room",
  "Shared Room",

  // 补齐的 Homestay 类型
  "Serviced Apartment (Homestay)",
  "Villa Homestay",
  "Farmstay / Kampung Stay",
  "Cultural / Heritage Homestay",
  "Monthly Rental Stay",
  "Hostel / Guesthouse",
  "Capsule / Pod Stay",
];

// ================== 从你的 TypeSelector.js 复制来的选项（保持原设计不变） ==================
const subtypeOptions = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

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

// ================== 工具函数 ==================
function safeArray(v) {
  if (Array.isArray(v)) return v;
  return [];
}

export default function HomestayUploadForm(props) {
  /**
   * ✅ 兼容你不同页面的传参方式：
   * - 如果外层是 formData + setFormData，就自动 merge 进去
   * - 如果外层是 onFormChange，也会回传
   */
  const formData = props?.formData || {};
  const setFormData = props?.setFormData;
  const onFormChange = props?.onFormChange;

  // ✅ 新增：Homestay Type
  const [homestayType, setHomestayType] = useState(
    formData?.homestayType || ""
  );

  // 从外部已有值初始化（如果外层已经存过）
  const [category, setCategory] = useState(formData?.category || "");
  const [finalType, setFinalType] = useState(formData?.finalType || "");
  const [storeys, setStoreys] = useState(formData?.storeys || "");
  const [subtype, setSubtype] = useState(safeArray(formData?.subtype));

  // property subtype dropdown
  const subtypeRef = useRef(null);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

  // storeys dropdown closeSignal（需要 FloorCountSelector 支持 closeSignal；若你没加也不会报错）
  const storeysWrapRef = useRef(null);
  const [storeysCloseSignal, setStoreysCloseSignal] = useState(0);

  // ✅✅✅ 编辑回填：外层 formData 可能是异步拿到的，第一次有值时要灌回本地 state
  const didHydrateRef = useRef(false);
  useEffect(() => {
    const fd = props?.formData;
    if (!fd || typeof fd !== "object") return;

    if (didHydrateRef.current) return;

    setHomestayType(fd?.homestayType || "");
    setCategory(fd?.category || "");
    setFinalType(fd?.finalType || "");
    setStoreys(fd?.storeys || "");
    setSubtype(safeArray(fd?.subtype));

    didHydrateRef.current = true;
  }, [props?.formData]);

  // 是否显示 Property Subtype（照你 TypeSelector 的逻辑）
  const shouldShowSubtype =
    category === "Apartment / Condo / Service Residence" ||
    category === "Business Property" ||
    category === "Industrial Property";

  // 是否显示 Storeys（照你 TypeSelector 的规则）
  const showStoreys = NEED_STOREYS_CATEGORY.has(category);

  const toggleSubtype = (opt) => {
    setSubtype((prev) => {
      const curr = Array.isArray(prev) ? prev : [];
      if (curr.includes(opt)) return curr.filter((x) => x !== opt);
      return [...curr, opt];
    });
  };

  // ✅ 点击空白自动收回（property subtype + storeys）
  useEffect(() => {
    const onDocDown = (e) => {
      const t = e.target;

      // subtype dropdown 收起
      if (subtypeRef.current && !subtypeRef.current.contains(t)) {
        setSubtypeOpen(false);
      }

      // storeys 收起（通知 FloorCountSelector）
      if (storeysWrapRef.current && !storeysWrapRef.current.contains(t)) {
        setStoreysCloseSignal((x) => x + 1);
      }
    };

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  // ✅ 把选择同步回外层（不改变你外层结构，只做 merge）
  useEffect(() => {
    const patch = {
      homestayType,
      category,
      finalType,
      storeys,
      subtype,
    };

    if (typeof setFormData === "function") {
      setFormData((prev) => ({ ...(prev || {}), ...patch }));
    }

    if (typeof onFormChange === "function") {
      onFormChange(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homestayType, category, finalType, storeys, subtype]);

  return (
    <div className="space-y-4">
      {/* ✅ 你要的类型选择区块（跟 TypeSelector 选项一致） */}
      <div className="space-y-4">
        {/* ✅✅✅ Homestay Type（现在放在 return 里面，并且在 Property Category 上面） */}
        <div>
          <label className="block font-medium">Homestay Type</label>
          <select
            className="w-full border rounded p-2"
            value={homestayType}
            onChange={(e) => setHomestayType(e.target.value)}
          >
            <option value="">请选择 Homestay 类型</option>
            {homestayOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Property Category</label>
          <select
            className="w-full border rounded p-2"
            value={category}
            onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              setFinalType("");
              setSubtype([]);
              setStoreys("");
              setStoreysCloseSignal((x) => x + 1);
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
          <div ref={storeysWrapRef}>
            <FloorCountSelector
              value={storeys}
              onChange={(val) => setStoreys(val)}
              closeSignal={storeysCloseSignal}
            />
          </div>
        )}

        {shouldShowSubtype && (
          <div className="relative" ref={subtypeRef}>
            <label className="block font-medium">Property Subtype</label>

            <div
              className="w-full border rounded p-2 bg-white cursor-pointer"
              onClick={() => setSubtypeOpen((p) => !p)}
            >
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
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleSubtype(opt);
                      }}
                    >
                      <input type="checkbox" checked={selected} readOnly />
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅✅✅ 复用 Hotel/Resort 表单（并隐藏 Hotel/Resort Type selector） */}
      <HotelUploadForm
        {...props}
        mode="homestay"
        hideHotelResortTypeSelector
      />
    </div>
  );
}
