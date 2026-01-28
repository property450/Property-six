// components/hotel/HotelUploadForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// ✅ New Project 同款 Layout 图纸上传
import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";

// ✅ 仅新增：Hotel / Resort Type 超全选项（你给的 + 我补充的）
const HOTEL_RESORT_TYPES = [
  // 你给的
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

  // 我补充（更全）
  "Motel",
  "Lodge",
  "Eco Resort",
  "Eco Lodge",
  "Heritage Hotel",
  "All-Inclusive Resort",
  "Villa Resort",
  "Overwater / Water Villa Resort",
  "Family Resort",
  "Theme Resort",
  "Beach Resort",
  "Island Resort",
  "Mountain Resort",
  "Golf Resort",
  "Ski Resort",
  "Wellness Resort",
  "Retreat Resort",
  "Luxury Resort",
  "Budget Resort",

  "City Hotel",
  "Downtown Hotel",
  "Suburban Hotel",
  "Roadside Hotel",

  "Serviced Residence (Hotel)",
  "Apartment Hotel",
  "Apart-Hotel",
  "Residence Hotel",

  "Co-living Hotel",
  "Co-living Space",
  "Shared Hotel",
  "Shared Accommodation",
  "Shared Hostel",

  "Youth Hostel",
  "Youth Hotel",
  "Backpacker Hostel",
  "Guesthouse",
  "Inn",
  "Bed & Breakfast (B&B)",
  "Boutique Guesthouse",
  "Heritage Guesthouse",

  "Homestay Lodge",
  "Farmstay",
  "Kampung Stay",
  "Glamping",
  "Tiny House Stay",
  "Container Stay",

  "Transit Hotel",
  "Railway Station Hotel",
  "Port / Ferry Terminal Hotel",

  "Conference Hotel",
  "MICE Hotel",
  "Wedding Hotel",
  "Event Hotel",

  "Medical Hotel",
  "Hospitality Suites",
  "Student Accommodation",
  "Worker Dorm / Hostel",

  "Ryokan (Japanese Inn)",
  "Onsen Hotel",
  "Shophouse Hotel",
  "Heritage Shophouse Hotel",

  "Pet-Friendly Hotel",
  "Adults Only Hotel",
  "Family Friendly Hotel",
];

const createEmptyRoomLayout = () => ({
  name: "",
  code: "",
  roomRange: "",
  beds: [],
  guests: { adults: "", children: "" },
  smoking: "",
  checkinService: {},
  breakfast: "",
  cancellationPolicy: { type: "", condition: "" },

  roomCounts: {
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carparks: "",
  },
  extraSpaces: [],

  indoorFacilities: [],
  bathroomFacilities: [],
  kitchenFacilities: [],
  otherFacilities: [],
  views: [],

  otherServices: { tags: [], note: "" },

  fees: {
    serviceFee: { mode: "free", value: "" },
    cleaningFee: { mode: "free", value: "" },
    deposit: { mode: "free", value: "" },
    otherFee: { amount: "", note: "" },
  },

  availability: {},
  photos: {},

  // ✅ Layout 图纸（New Project 同款）
  layoutPhotos: [],

  unitCount: 1,
  unitCountInput: "1",

  // ✅ petPolicy（你现在已经能记住）
  petPolicy: { type: "", note: "" },
});

const SHARED_KEYS = [
  "roomCounts",
  "extraSpaces",
  "indoorFacilities",
  "bathroomFacilities",
  "kitchenFacilities",
  "otherFacilities",
  "otherFacilities",
  "views",
  "otherServices",
  "fees",
];

function formatWithCommas(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-US");
}
function parseDigitsToInt(v) {
  const cleaned = String(v ?? "").replace(/[^\d]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

// ✅ 稳定 stringify（防闪烁）
function stableJson(obj) {
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

// ✅✅✅ 关键：兼容旧字段名（snake_case / 旧命名）
function pickAny(obj, keys, fallback) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function normalizeFees(rawFees) {
  const f = rawFees && typeof rawFees === "object" ? rawFees : {};

  // 旧版可能是：
  // service_fee / cleaning_fee / deposit / other_fee
  const serviceFee = pickAny(f, ["serviceFee", "service_fee"], null);
  const cleaningFee = pickAny(f, ["cleaningFee", "cleaning_fee"], null);
  const deposit = pickAny(f, ["deposit", "deposit_fee"], null);
  const otherFee = pickAny(f, ["otherFee", "other_fee"], null);

  // 也可能旧版把这些“直接放在 layout 上”
  const directService = pickAny(rawFees, ["serviceFee", "service_fee"], null);
  const directCleaning = pickAny(rawFees, ["cleaningFee", "cleaning_fee"], null);
  const directDeposit = pickAny(rawFees, ["deposit", "deposit_fee"], null);
  const directOther = pickAny(rawFees, ["otherFee", "other_fee"], null);

  const base = createEmptyRoomLayout().fees;

  return {
    serviceFee: serviceFee || directService || base.serviceFee,
    cleaningFee: cleaningFee || directCleaning || base.cleaningFee,
    deposit: deposit || directDeposit || base.deposit,
    otherFee: otherFee || directOther || base.otherFee,
  };
}

function normalizeRoomCounts(rawCounts) {
  const c = rawCounts && typeof rawCounts === "object" ? rawCounts : {};
  const base = createEmptyRoomLayout().roomCounts;

  // 旧版可能是 room_counts
  const bedrooms = pickAny(c, ["bedrooms", "bed_rooms"], base.bedrooms);
  const bathrooms = pickAny(c, ["bathrooms", "bath_rooms"], base.bathrooms);
  const kitchens = pickAny(c, ["kitchens"], base.kitchens);
  const livingRooms = pickAny(c, ["livingRooms", "living_rooms"], base.livingRooms);
  const carparks = pickAny(c, ["carparks", "car_parks"], base.carparks);

  return { bedrooms, bathrooms, kitchens, livingRooms, carparks };
}

function normalizeLayout(l) {
  const base = createEmptyRoomLayout();
  const raw = l && typeof l === "object" ? l : {};

  // ✅ 兼容旧 key → 新 key
  const smoking = pickAny(raw, ["smoking", "smoking_policy"], base.smoking);
  const breakfast = pickAny(raw, ["breakfast", "breakfastIncluded", "breakfast_included"], base.breakfast);

  const checkinService = pickAny(raw, ["checkinService", "checkin_service"], base.checkinService);

  const cancellationPolicy = pickAny(raw, ["cancellationPolicy", "cancellation_policy"], base.cancellationPolicy);

  const otherServices = pickAny(raw, ["otherServices", "other_services"], base.otherServices);

  const roomCountsRaw = pickAny(raw, ["roomCounts", "room_counts"], base.roomCounts);

  const feesRaw = pickAny(raw, ["fees"], raw); // 有些旧版把费用直接放在 layout 顶层

  const out = {
    ...base,
    ...raw,

    // 覆盖成你现在表单真正读取的字段名
    smoking,
    breakfast,
    checkinService,
    cancellationPolicy,
    otherServices,

    roomCounts: normalizeRoomCounts(roomCountsRaw),
    fees: normalizeFees(feesRaw),

    // petPolicy：你现在已经能记住，继续兼容
    petPolicy: pickAny(raw, ["petPolicy", "pet_policy"], base.petPolicy),
  };

  // unitCountInput 处理（你现在的逻辑）
  const unitCountNum = Number(out.unitCount);
  if ((!out.unitCountInput || out.unitCountInput === "") && Number.isFinite(unitCountNum) && unitCountNum > 0) {
    out.unitCountInput = formatWithCommas(unitCountNum);
  }

  return out;
}

export default function HotelUploadForm(props) {
  const shouldShowHotelResortType =
    props?.mode !== "homestay" &&
    !props?.hideHotelResortTypeSelector &&
    !props?.hideHotelResortType;

  const [hotelResortType, setHotelResortType] = useState("");
  const [roomCount, setRoomCount] = useState(1);
  const [roomLayouts, setRoomLayouts] = useState([createEmptyRoomLayout()]);
  const [facilityImages, setFacilityImages] = useState({});

  const [roomCountInput, setRoomCountInput] = useState("1");
  const [showDropdown, setShowDropdown] = useState(false);

  const [openUnitCountIndex, setOpenUnitCountIndex] = useState(null);

  const dropdownRef = useRef(null);
  const layoutFileInputRefs = useRef([]);
  const unitCountDropdownRefs = useRef([]);

  const setFormDataRef = useRef(props?.setFormData);
  const onFormChangeRef = useRef(props?.onFormChange);

  useEffect(() => {
    setFormDataRef.current = props?.setFormData;
    onFormChangeRef.current = props?.onFormChange;
  }, [props?.setFormData, props?.onFormChange]);

  const getLayoutFileRef = (index) => {
    if (!layoutFileInputRefs.current[index]) {
      layoutFileInputRefs.current[index] = { current: null };
    }
    return layoutFileInputRefs.current[index];
  };

  const getUnitCountRef = (index) => {
    if (!unitCountDropdownRefs.current[index]) {
      unitCountDropdownRefs.current[index] = { current: null };
    }
    return unitCountDropdownRefs.current[index];
  };

  const lastInitHashRef = useRef("");
  const didUserEditRef = useRef(false);
  const readyToSyncRef = useRef(false);

  useEffect(() => {
    if (!hasAnyValue(props?.formData)) {
      readyToSyncRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData]);

  useEffect(() => {
    const current = stableJson({ hotelResortType, roomCount, roomLayouts, facilityImages, roomCountInput });
    if (!current) return;
    if (lastInitHashRef.current && current !== lastInitHashRef.current) {
      didUserEditRef.current = true;
    }
  }, [hotelResortType, roomCount, roomLayouts, facilityImages, roomCountInput]);

  // ✅✅✅【关键修复点】：回填时把旧 layout 转为新结构
  useEffect(() => {
    const d = props?.formData;
    if (!hasAnyValue(d)) return;

    const incomingHash = stableJson(d);
    if (!incomingHash) return;
    if (incomingHash === lastInitHashRef.current) return;
    if (didUserEditRef.current) return;

    readyToSyncRef.current = true;

    // ✅ hotelResortType 也兼容旧字段名
    const t = pickAny(d, ["hotelResortType", "hotel_resort_type"], "");
    setHotelResortType(typeof t === "string" ? t : "");

    // ✅ roomLayouts 兼容旧字段名 room_layouts
    const layoutsRaw = pickAny(d, ["roomLayouts", "room_layouts"], null);
    if (Array.isArray(layoutsRaw) && layoutsRaw.length > 0) {
      const normalized = layoutsRaw.map((l) => normalizeLayout(l));
      setRoomLayouts(normalized);
      setRoomCount(normalized.length);
      setRoomCountInput(String(normalized.length));
    }

    // ✅ facilityImages 兼容旧字段名 facility_images
    const fi = pickAny(d, ["facilityImages", "facility_images"], {});
    if (fi && typeof fi === "object") setFacilityImages(fi);

    lastInitHashRef.current = stableJson({
      hotelResortType: typeof t === "string" ? t : "",
      roomLayouts: Array.isArray(layoutsRaw) && layoutsRaw.length ? layoutsRaw : [createEmptyRoomLayout()],
      facilityImages: fi && typeof fi === "object" ? fi : {},
      roomCount: Array.isArray(layoutsRaw) && layoutsRaw.length ? layoutsRaw.length : 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData]);

  // ✅ 同步回父层（保持你原本的写法，不改结构）
  const lastSentRef = useRef("");
  useEffect(() => {
    if (!readyToSyncRef.current) return;

    const patch = {
      hotelResortType,
      roomLayouts,
      facilityImages,
      roomCount,
    };

    const nextHash = stableJson(patch);
    if (nextHash && nextHash === lastSentRef.current) return;
    lastSentRef.current = nextHash;

    const setFn = setFormDataRef.current;
    const onFn = onFormChangeRef.current;

    if (typeof setFn === "function") {
      setFn((prev) => ({ ...(prev || {}), ...(patch || {}) }));
      return;
    }
    if (typeof onFn === "function") {
      onFn(patch);
    }
  }, [hotelResortType, roomLayouts, facilityImages, roomCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideAnyUnitCount =
        unitCountDropdownRefs.current?.some((r) => r?.current && r.current.contains(e.target)) || false;

      if (!clickedInsideAnyUnitCount) {
        setOpenUnitCountIndex(null);
      }

      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyRoomCount = (n) => {
    const safeN = Math.max(1, Math.min(200, n));
    setRoomCount(safeN);
    setRoomCountInput(String(safeN));

    setRoomLayouts((prev) => {
      const arr = [...prev];
      if (arr.length < safeN) {
        while (arr.length < safeN) arr.push(createEmptyRoomLayout());
      } else if (arr.length > safeN) {
        arr.length = safeN;
      }
      return arr;
    });
  };

  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...patch };
      next[index] = updated;

      // Layout1 同步通用字段（保持你原逻辑）
      if (index === 0 && next.length > 1) {
        const shared = {};
        SHARED_KEYS.forEach((key) => (shared[key] = updated[key]));
        for (let i = 1; i < next.length; i++) {
          next[i] = { ...next[i], ...shared };
        }
      }
      return next;
    });
  };

  const handleBlueprintUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(roomLayouts[index]?.layoutPhotos || []), ...files];
    handleRoomLayoutChange(index, { layoutPhotos: newPhotos });
  };

  const handleUnitCountInput = (index, raw) => {
    const n = parseDigitsToInt(raw);

    if (raw === "" || raw == null) {
      handleRoomLayoutChange(index, {
        unitCountInput: "",
        unitCount: 0,
      });
      return;
    }

    const clamped = Math.max(1, Math.min(3000, n));
    handleRoomLayoutChange(index, {
      unitCountInput: String(raw),
      unitCount: clamped,
    });
  };

  const selectUnitCount = (index, n) => {
    const clamped = Math.max(1, Math.min(3000, n));
    handleRoomLayoutChange(index, {
      unitCount: clamped,
      unitCountInput: formatWithCommas(clamped),
    });
    setOpenUnitCountIndex(null);
  };

  const handleUnitCountBlur = (index) => {
    const layout = roomLayouts[index] || {};
    const n = Math.max(1, Math.min(3000, Number(layout.unitCount) || 1));
    handleRoomLayoutChange(index, {
      unitCount: n,
      unitCountInput: formatWithCommas(n),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("提交数据", { hotelResortType, roomLayouts, facilityImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {shouldShowHotelResortType && (
        <div className="w-full">
          <label className="block font-medium mb-1">Hotel / Resort Type</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={hotelResortType}
            onChange={(e) => setHotelResortType(e.target.value)}
          >
            <option value="">请选择 Hotel/Resort 类型</option>
            {HOTEL_RESORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative w-40" ref={dropdownRef}>
        <label className="block font-medium mb-1">这个 Homestay / Hotel 有多少个房型 / layout？</label>

        <input
          type="text"
          value={roomCountInput}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^\d]/g, "");
            setRoomCountInput(cleaned);
            const n = Number(cleaned);
            if (n >= 1 && n <= 200) applyRoomCount(n);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="1 ~ 200"
          className="border rounded px-3 py-2 w-full"
        />

        {showDropdown && (
          <ul
            className="absolute z-20 w-full max-h-60 bg-white border rounded shadow mt-1 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {Array.from({ length: 200 }, (_, i) => i + 1).map((n) => (
              <li
                key={n}
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  applyRoomCount(n);
                  setShowDropdown(false);
                }}
              >
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {roomLayouts.map((layout, index) => (
        <div key={index} className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
          <h3 className="font-semibold text-lg mb-2">
            房型 {index + 1} / {roomLayouts.length}
          </h3>

          <BlueprintUploadSection
            fileInputRef={getLayoutFileRef(index)}
            onUpload={(e) => handleBlueprintUpload(index, e)}
          />

          <div className="relative w-72" ref={getUnitCountRef(index)}>
            <label className="block font-medium mb-1">请问这个房型的数量有多少？</label>

            <input
              type="text"
              value={layout.unitCountInput != null && layout.unitCountInput !== "" ? layout.unitCountInput : ""}
              onChange={(e) => handleUnitCountInput(index, e.target.value)}
              onFocus={() => setOpenUnitCountIndex(index)}
              onBlur={() => handleUnitCountBlur(index)}
              placeholder="1 ~ 3,000"
              className="border rounded px-3 py-2 w-full"
            />

            {openUnitCountIndex === index && (
              <ul
                className="absolute z-30 w-full max-h-60 bg-white border rounded shadow mt-1 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {Array.from({ length: 3000 }, (_, i) => i + 1).map((n) => (
                  <li
                    key={n}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectUnitCount(index, n)}
                  >
                    {formatWithCommas(n)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <HotelRoomTypeForm
            index={index}
            total={roomLayouts.length}
            data={layout}
            onChange={(patch) => handleRoomLayoutChange(index, patch)}
          />
        </div>
      ))}

      <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h3 className="font-semibold text-lg">这个酒店/度假屋的设施照片</h3>
        <ImageUpload
          config={{
            id: "hotel_facility_images",
            multiple: true,
          }}
          images={facilityImages}
          setImages={setFacilityImages}
        />
      </div>

      <Button type="submit">提交酒店 / 度假屋房源</Button>
    </form>
  );
}
