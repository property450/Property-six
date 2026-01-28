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
  petPolicy: { type: "", note: "" },
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

  // ✅ 每个房型数量
  unitCount: 1,
  unitCountInput: "1",
});

function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

function pickAny(obj, keys, fallback) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function formatWithCommas(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-US");
}

function parseDigitsToInt(v) {
  const cleaned = String(v ?? "").replace(/[^\d]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function HotelUploadForm(props) {
  // ✅✅✅ Homestay 模式隐藏 Hotel / Resort Type
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

  // ✅✅✅ 最关键：永远用 props.setFormData（upload-property 传进来的 setSingleFormData）
  const setFormDataRef = useRef(props?.setFormData);
  useEffect(() => {
    setFormDataRef.current = props?.setFormData;
  }, [props?.setFormData]);

  const syncToParent = (patch) => {
    const setFn = setFormDataRef.current;
    if (typeof setFn !== "function") return;

    // ✅ 同时写 camel + snake，兼容你旧数据（避免“保存了但读不到”）
    const camel = patch || {};
    const snake = {};
    if ("hotelResortType" in camel) snake.hotel_resort_type = camel.hotelResortType;
    if ("roomLayouts" in camel) snake.room_layouts = camel.roomLayouts;
    if ("facilityImages" in camel) snake.facility_images = camel.facilityImages;
    if ("roomCount" in camel) snake.room_count = camel.roomCount;

    setFn((prev) => ({
      ...(prev || {}),
      ...camel,
      ...snake,
    }));
  };

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

  // ✅✅✅ 编辑回填：从 singleFormData 里读（兼容 roomLayouts / room_layouts 等）
  const hydratedOnceRef = useRef(false);
  useEffect(() => {
    const d = props?.formData;
    if (!hasAnyValue(d)) return;
    if (hydratedOnceRef.current) return;

    const t = pickAny(d, ["hotelResortType", "hotel_resort_type"], "");
    setHotelResortType(typeof t === "string" ? t : "");

    const layouts = pickAny(d, ["roomLayouts", "room_layouts"], null);
    if (Array.isArray(layouts) && layouts.length > 0) {
      // ✅ 保证结构完整（避免旧数据缺字段）
      const normalized = layouts.map((x) => ({ ...createEmptyRoomLayout(), ...(x || {}) }));
      // ✅ unitCountInput 补齐
      normalized.forEach((l) => {
        const n = Number(l.unitCount);
        if ((!l.unitCountInput || l.unitCountInput === "") && Number.isFinite(n) && n > 0) {
          l.unitCountInput = formatWithCommas(n);
        }
      });

      setRoomLayouts(normalized);
      setRoomCount(normalized.length);
      setRoomCountInput(String(normalized.length));

      // ✅ 重要：回填后也同步一次父层（确保 singleFormData 里有 camelKey）
      syncToParent({
        roomLayouts: normalized,
        roomCount: normalized.length,
      });
    }

    const fi = pickAny(d, ["facilityImages", "facility_images"], {});
    if (fi && typeof fi === "object") {
      setFacilityImages(fi);
      syncToParent({ facilityImages: fi });
    }

    // ✅ 同步一次 hotelResortType
    syncToParent({ hotelResortType: typeof t === "string" ? t : "" });

    hydratedOnceRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData]);

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
      // ✅ 立刻写回父层（关键）
      syncToParent({ roomLayouts: arr, roomCount: safeN });
      return arr;
    });
  };

  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || createEmptyRoomLayout()), ...(patch || {}) };

      // ✅ 立刻写回父层（关键）
      syncToParent({ roomLayouts: next });

      return next;
    });
  };

  // ✅ Layout 图纸上传 -> 存进 layoutPhotos
  const handleBlueprintUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setRoomLayouts((prev) => {
      const next = [...prev];
      const cur = next[index] || createEmptyRoomLayout();
      next[index] = { ...cur, layoutPhotos: [...(cur.layoutPhotos || []), ...files] };

      syncToParent({ roomLayouts: next });
      return next;
    });
  };

  // ✅ 每个房型数量：手动输入
  const handleUnitCountInput = (index, raw) => {
    const n = parseDigitsToInt(raw);

    setRoomLayouts((prev) => {
      const next = [...prev];
      const cur = next[index] || createEmptyRoomLayout();

      if (raw === "" || raw == null) {
        next[index] = { ...cur, unitCountInput: "", unitCount: 0 };
      } else {
        const clamped = Math.max(1, Math.min(3000, n));
        next[index] = { ...cur, unitCountInput: String(raw), unitCount: clamped };
      }

      syncToParent({ roomLayouts: next });
      return next;
    });
  };

  const selectUnitCount = (index, n) => {
    const clamped = Math.max(1, Math.min(3000, n));
    setRoomLayouts((prev) => {
      const next = [...prev];
      const cur = next[index] || createEmptyRoomLayout();
      next[index] = { ...cur, unitCount: clamped, unitCountInput: formatWithCommas(clamped) };

      syncToParent({ roomLayouts: next });
      return next;
    });
    setOpenUnitCountIndex(null);
  };

  const handleUnitCountBlur = (index) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const cur = next[index] || createEmptyRoomLayout();
      const n = Math.max(1, Math.min(3000, Number(cur.unitCount) || 1));
      next[index] = { ...cur, unitCount: n, unitCountInput: formatWithCommas(n) };

      syncToParent({ roomLayouts: next });
      return next;
    });
  };

  const handleFacilityImagesChange = (val) => {
    setFacilityImages(val || {});
    syncToParent({ facilityImages: val || {} });
  };

  const handleHotelResortTypeChange = (val) => {
    setHotelResortType(val);
    syncToParent({ hotelResortType: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 这里不做保存，保存是 upload-property 的按钮做的
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {shouldShowHotelResortType && (
        <div className="w-full">
          <label className="block font-medium mb-1">Hotel / Resort Type</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={hotelResortType || ""}
            onChange={(e) => handleHotelResortTypeChange(e.target.value)}
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
            onChange={(val) => handleRoomLayoutChange(index, val)}
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
          setImages={handleFacilityImagesChange}
        />
      </div>

      {/* 这里保留按钮，不影响 upload-property 的保存逻辑 */}
      <Button type="submit">提交酒店 / 度假屋房源</Button>
    </form>
  );
}
