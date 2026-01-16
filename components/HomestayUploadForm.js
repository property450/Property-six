// components/HomestayUploadForm.js
"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

import AreaSelector from "./AreaSelector";
import RoomCountSelector from "./RoomCountSelector";
import CarparkCountSelector from "./CarparkCountSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import FurnitureSelector from "./FurnitureSelector";
import TransitSelector from "./TransitSelector";
import AdvancedAvailabilityCalendar from "./AdvancedAvailabilityCalendar";
import ImageUpload from "./ImageUpload";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

// 把各种值统一变成数组
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

/* ================= Layout 图纸上传（仅新增，不影响其它逻辑） ================= */
function LayoutBlueprintUpload({ value = [], onChange }) {
  const inputRef = useRef(null);
  const files = Array.isArray(value) ? value : [];

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    onChange?.([...(files || []), ...picked]);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  return (
    <div className="space-y-2 border rounded-lg p-4">
      <h3 className="font-semibold mb-1">Layout 图纸上传</h3>

      <button
        type="button"
        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => inputRef.current?.click()}
      >
        上传 Layout 图纸
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={addFiles}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border rounded-lg px-3 py-2"
            >
              <div className="text-sm text-gray-800 break-all">
                {f?.name || `文件 ${idx + 1}`}
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => removeAt(idx)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= 仅新增：Homestay 的 Property Category / Sub Type / Storeys / Property Subtype ================= */
const HOMESTAY_PROPERTY_CATEGORIES = [
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
  "Land",
];

// 只做基本子类型（不加“自定义/Other”），避免你不想要的选项
const HOMESTAY_SUBTYPE_MAP = {
  "Bungalow / Villa": ["Bungalow", "Villa"],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condo",
    "Service Residence",
    "Studio",
    "Loft",
  ],
  "Semi-Detached House": ["Semi-Detached", "Cluster House"],
  "Terrace / Link House": ["Terrace House", "Link House", "Townhouse"],
  "Business Property": ["Shop", "Office", "Shop Office", "Retail Lot"],
  "Industrial Property": ["Factory", "Warehouse", "Workshop"],
  Land: ["Residential Land", "Commercial Land", "Industrial Land", "Agricultural Land"],
};

const NEED_STOREYS_CATEGORIES = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
]);

const HOMESTAY_PROPERTY_SUBTYPE_OPTIONS = [
  "Penthouse",
  "Duplex",
  "Triplex",
  "Dual Key",
];

export default function HomestayUploadForm({ onSubmit }) {
  // 基本信息
  const [title, setTitle] = useState("");
  const [homestayType, setHomestayType] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [recommendedGuests, setRecommendedGuests] = useState("");
  const [tags, setTags] = useState(""); // 简单用逗号分隔

  // ✅ 仅新增：Homestay 的 Property Category / Sub Type / Storeys / Property Subtype
  const [hsCategory, setHsCategory] = useState("");
  const [hsSubType, setHsSubType] = useState("");
  const [hsStoreys, setHsStoreys] = useState("");
  const [hsPropertySubtypes, setHsPropertySubtypes] = useState([]);

  // 地址 / 经纬度
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // 房型 & 面积
  const [roomCounts, setRoomCounts] = useState({
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
  });
  const [carpark, setCarpark] = useState("");
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  // 价格 & 日历
  const [weekdayPrice, setWeekdayPrice] = useState("");
  const [weekendPrice, setWeekendPrice] = useState("");
  const [cleaningFee, setCleaningFee] = useState("");
  const [deposit, setDeposit] = useState("");
  const [minNights, setMinNights] = useState("");
  const [maxNights, setMaxNights] = useState("");
  const [availability, setAvailability] = useState({}); // 高级日历

  // 设施 / 家私 / 额外空间 / 朝向
  const [extraSpaces, setExtraSpaces] = useState([]);
  const [facing, setFacing] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [furniture, setFurniture] = useState([]);

  // 交通
  const [transitInfo, setTransitInfo] = useState(null);

  // 入住规则
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [allowSmoking, setAllowSmoking] = useState(false);
  const [allowPets, setAllowPets] = useState(false);
  const [allowParty, setAllowParty] = useState(false);
  const [allowBBQ, setAllowBBQ] = useState(true);
  const [extraRuleNote, setExtraRuleNote] = useState("");

  // 描述 & 照片
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState({}); // 给 ImageUpload 用

  // ✅ 仅新增：Layout 图纸
  const [layoutPhotos, setLayoutPhotos] = useState([]);

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLat(lat);
    setLng(lng);
    setAddress(address);
  };

  // 提供给 ImageUpload 的配置，让它生成「卧室/浴室/设施/家私」对应的上传框
  const photoConfig = {
    bedrooms: roomCounts.bedrooms || "",
    bathrooms: roomCounts.bathrooms || "",
    kitchens: roomCounts.kitchens || "",
    livingRooms: roomCounts.livingRooms || "",
    carpark: carpark || "",
    extraSpaces: extraSpaces || [],
    facilities: facilities || [],
    furniture: furniture || [],
    orientation: facing || [],
    transit: transitInfo || null,
  };

  const handleSubmit = () => {
    const payload = {
      formType: "homestay",
      title,
      homestayType,

      // ✅ 仅新增：Homestay 类型（property category / subtype / storeys / property subtype）
      homestayPropertyType: {
        category: hsCategory,
        subType: hsSubType,
        storeys: hsStoreys,
        propertySubtypes: hsPropertySubtypes,
      },

      maxGuests,
      recommendedGuests,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      address,
      lat,
      lng,
      area: areaData,
      roomCounts,
      carpark,
      pricing: {
        weekdayPrice,
        weekendPrice,
        cleaningFee,
        deposit,
        minNights,
        maxNights,
      },
      availability,
      facilities,
      extraSpaces,
      furniture,
      facing: toArray(facing),
      transit: transitInfo,
      rules: {
        checkInTime,
        checkOutTime,
        allowSmoking,
        allowPets,
        allowParty,
        allowBBQ,
        extraRuleNote,
      },
      description,
      photos,

      // ✅ 仅新增：Layout 图纸
      layoutPhotos,
    };

    if (onSubmit) {
      onSubmit(payload);
    } else {
      console.log("Homestay upload payload:", payload);
      alert("Homestay 表单数据已打印在控制台（暂未接 Supabase）");
    }
  };

  const hsSubTypeOptions = hsCategory ? (HOMESTAY_SUBTYPE_MAP[hsCategory] || []) : [];
  const showStoreys = NEED_STOREYS_CATEGORIES.has(hsCategory);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Homestay 上传表单</h2>

      {/* 地址 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">位置 / 地址</label>
        <AddressSearchInput onLocationSelect={handleLocationSelect} />
        {address && (
          <p className="text-xs text-gray-600 mt-1">已选择地址：{address}</p>
        )}
      </div>

      {/* 基本信息 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">基本信息</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium">房源标题</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：吉隆坡市中心高级公寓靠近双子塔"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* ✅✅ 仅新增：Homestay 的 Property Category / Sub Type / Storeys / Property Subtype */}
        <div className="space-y-3 border rounded-lg p-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Property Category</label>
            <select
              className="w-full border rounded p-2"
              value={hsCategory}
              onChange={(e) => {
                const v = e.target.value;
                setHsCategory(v);
                // category 改变时，重置 subType / storeys（避免旧值残留）
                setHsSubType("");
                setHsStoreys("");
              }}
            >
              <option value="">请选择</option>
              {HOMESTAY_PROPERTY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Sub Type</label>
            <select
              className="w-full border rounded p-2"
              value={hsSubType}
              onChange={(e) => setHsSubType(e.target.value)}
              disabled={!hsCategory}
            >
              <option value="">{hsCategory ? "请选择具体类型" : "请先选择 Property Category"}</option>
              {hsSubTypeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {showStoreys && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">有多少层（Storeys）</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                placeholder="例如：2 或 2.5"
                value={hsStoreys}
                onChange={(e) => setHsStoreys(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Property Subtype</label>
            <div className="border rounded p-2 space-y-2">
              <div className="text-sm text-gray-500">请选择 subtype（可多选）</div>
              <div className="space-y-2">
                {HOMESTAY_PROPERTY_SUBTYPE_OPTIONS.map((opt) => {
                  const checked = hsPropertySubtypes.includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setHsPropertySubtypes((prev) => {
                            if (on) return [...prev, opt];
                            return prev.filter((x) => x !== opt);
                          });
                        }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Homestay Type（保持你原本不动） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Homestay Type</label>
          <select
            className="w-full border rounded p-2"
            value={homestayType}
            onChange={(e) => setHomestayType(e.target.value)}
          >
            <option value="">请选择 Homestay 类型</option>
            <option value="Entire Place">Entire Place（整间单位）</option>
            <option value="Private Room">Private Room</option>
            <option value="Shared Room">Shared Room</option>
            <option value="Serviced Apartment (Homestay)">
              Serviced Apartment (Homestay)
            </option>
            <option value="Villa Homestay">Villa Homestay</option>
            <option value="Farmstay / Kampung Stay">
              Farmstay / Kampung Stay
            </option>
            <option value="Hostel / Guesthouse">Hostel / Guesthouse</option>
            <option value="Capsule / Pod Stay">Capsule / Pod Stay</option>
            <option value="Cultural / Heritage Homestay">
              Cultural / Heritage Homestay
            </option>
            <option value="Monthly Rental Stay">Monthly Rental Stay</option>
          </select>
        </div>

        {/* Guests */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">最大入住人数</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
              placeholder="例如：6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">建议入住人数（可选）</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={recommendedGuests}
              onChange={(e) => setRecommendedGuests(e.target.value)}
              placeholder="例如：4"
            />
          </div>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium">
            房源标签（逗号分隔，例如：family-friendly, sea view）
          </label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：family-friendly, near MRT, Muslim-friendly"
          />
        </div>
      </div>

      {/* 房型 & 面积 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">房型 & 面积</h3>

        <RoomCountSelector
          value={roomCounts}
          onChange={(patch) => setRoomCounts((prev) => ({ ...prev, ...patch }))}
        />

        <CarparkCountSelector value={carpark} onChange={setCarpark} mode="single" />

        <AreaSelector initialValue={areaData} onChange={(data) => setAreaData(data)} />
      </div>

      {/* 价格 & Availability */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">价格 & 可租日期</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">平日价格（每晚）</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">RM</span>
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={weekdayPrice}
                onChange={(e) => setWeekdayPrice(e.target.value)}
                placeholder="例如：250"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              周末 / 旺日价格（每晚，可选）
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">RM</span>
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={weekendPrice}
                onChange={(e) => setWeekendPrice(e.target.value)}
                placeholder="例如：320"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">清洁费（一次性，可选）</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">RM</span>
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={cleaningFee}
                onChange={(e) => setCleaningFee(e.target.value)}
                placeholder="例如：80"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">押金（可选）</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">RM</span>
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="例如：200"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">最少入住天数</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={minNights}
              onChange={(e) => setMinNights(e.target.value)}
              placeholder="例如：1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">最多入住天数（可选）</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={maxNights}
              onChange={(e) => setMaxNights(e.target.value)}
              placeholder="例如：30"
            />
          </div>
        </div>

        {/* 高级日历：可设置封房 & 特殊价格 */}
        <AdvancedAvailabilityCalendar value={availability} onChange={setAvailability} />
      </div>

      {/* 设施 / 家私 / 额外空间 / 朝向 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">设施 & 家私</h3>
        <FacilitiesSelector value={facilities} onChange={setFacilities} />
        <ExtraSpacesSelector value={extraSpaces} onChange={setExtraSpaces} />
        <FurnitureSelector value={furniture} onChange={setFurniture} />
        <FacingSelector value={facing} onChange={setFacing} />
      </div>

      {/* 交通信息 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">交通信息</h3>
        <TransitSelector onChange={setTransitInfo} />
      </div>

      {/* 入住规则 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">入住规则</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">入住时间（Check-in）</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">退房时间（Check-out）</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
         
