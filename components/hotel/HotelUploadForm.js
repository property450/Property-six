// components/hotel/HotelUploadForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// ✅ New Project 同款 Layout 图纸上传
import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";

// ✅ 你的选项（保持不动）
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
  "Cultural / Heritage Stay",
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
  layoutPhotos: [],

  unitCount: 1,
  unitCountInput: "1",
});

function formatWithCommas(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-US");
}

function parseDigitsToInt(v) {
  const cleaned = String(v ?? "").replace(/[^\d]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function hasAnyValue(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).length > 0;
}

function pickAny(obj, keys, fallback) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

// ✅ 防止无限 setState
function stableJson(obj) {
  const seen = new WeakSet();

  const sortDeep = (v) => {
    if (v === null || v === undefined) return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortDeep);

    if (typeof v === "object") {
      if (typeof File !== "undefined" && v instanceof File) return `[File:${v.name}]`;
      if (typeof Blob !== "undefined" && v instanceof Blob) return "[Blob]";

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

// ✅✅✅ 关键新增：编辑回填时先从 hotel_resort_form 里拿（你的 Supabase 新 column）
function getHotelSeed(formData) {
  const d = formData && typeof formData === "object" ? formData : {};
  const nested = d.hotel_resort_form && typeof d.hotel_resort_form === "object" ? d.hotel_resort_form : null;

  // 优先 nested，其次顶层（兼容旧数据）
  const src = nested || d;

  return {
    hotelResortType: pickAny(src, ["hotelResortType", "hotel_resort_type"], ""),
    roomLayouts: pickAny(src, ["roomLayouts", "room_layouts"], null),
    facilityImages: pickAny(src, ["facilityImages", "facility_images"], null),
    roomCount: pickAny(src, ["roomCount", "room_count"], null),
  };
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

  const getLayoutFileRef = (index) => {
    if (!layoutFileInputRefs.current[index]) layoutFileInputRefs.current[index] = { current: null };
    return layoutFileInputRefs.current[index];
  };

  const getUnitCountRef = (index) => {
    if (!unitCountDropdownRefs.current[index]) unitCountDropdownRefs.current[index] = { current: null };
    return unitCountDropdownRefs.current[index];
  };

  // ================== ✅✅✅ 关键：编辑回填 & 同步去重 ==================
  const lastInitHashRef = useRef("");
  const didUserEditRef = useRef(false);
  const readyToSyncRef = useRef(false);
  const lastSentRef = useRef("");

  // ✅✅✅ 新增：避免“回填 setState 后马上同步默认值覆盖”
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    const editing = !!props?.isEditing;
    if (editing) {
      // 编辑：等 formData 真正有内容再允许同步
      if (hasAnyValue(props?.formData)) readyToSyncRef.current = true;
      return;
    }
    // 新建：允许立即同步
    readyToSyncRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData, props?.isEditing]);

  useEffect(() => {
    const current = stableJson({ hotelResortType, roomCount, roomLayouts, facilityImages, roomCountInput });
    if (!current) return;
    if (lastInitHashRef.current && current !== lastInitHashRef.current) {
      didUserEditRef.current = true;
    }
  }, [hotelResortType, roomCount, roomLayouts, facilityImages, roomCountInput]);

  // ✅✅✅ 编辑回填：优先读取 hotel_resort_form
  useEffect(() => {
    const d = props?.formData;
    if (!hasAnyValue(d)) return;

    const incomingHash = stableJson(d);
    if (!incomingHash) return;

    if (incomingHash === lastInitHashRef.current) return;
    if (didUserEditRef.current) return;

    readyToSyncRef.current = true;

    const seed = getHotelSeed(d);

    // ✅ 回填即将 setState，下一次同步先跳过一次
    skipNextSyncRef.current = true;

    const _hotelType = seed.hotelResortType;
    setHotelResortType(typeof _hotelType === "string" ? _hotelType : "");

    const _layouts = seed.roomLayouts;
    if (Array.isArray(_layouts) && _layouts.length > 0) {
      const normalized = _layouts.map((l) => {
        const base = { ...createEmptyRoomLayout(), ...(l || {}) };
        const unitCountNum = Number(base.unitCount);
        if ((!base.unitCountInput || base.unitCountInput === "") && Number.isFinite(unitCountNum) && unitCountNum > 0) {
          base.unitCountInput = formatWithCommas(unitCountNum);
        }
        return base;
      });

      setRoomLayouts(normalized);
      setRoomCount(normalized.length);
      setRoomCountInput(String(normalized.length));
    } else {
      setRoomCountInput((prev) => (prev && prev !== "" ? prev : String(roomCount || 1)));
    }

    const _facilityImages = seed.facilityImages;
    if (_facilityImages && typeof _facilityImages === "object") setFacilityImages(_facilityImages);

    lastInitHashRef.current = stableJson({
      hotelResortType: typeof _hotelType === "string" ? _hotelType : "",
      roomLayouts: Array.isArray(_layouts) ? _layouts : [createEmptyRoomLayout()],
      facilityImages: _facilityImages && typeof _facilityImages === "object" ? _facilityImages : {},
      roomCount: Array.isArray(_layouts) ? _layouts.length : 1,
      roomCountInput: Array.isArray(_layouts) ? String(_layouts.length) : "1",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData]);

  // ✅✅✅ 同步回父层（保持你原来的写法）
  useEffect(() => {
    if (!readyToSyncRef.current) return;

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const patch = {
      hotelResortType,
      roomLayouts,
      facilityImages,
      roomCount,

      hotel_resort_type: hotelResortType,
      room_layouts: roomLayouts,
      facility_images: facilityImages,
      room_count: roomCount,
    };

    const nextHash = stableJson(patch);
    if (nextHash && nextHash === lastSentRef.current) return;
    lastSentRef.current = nextHash;

    if (typeof props?.setFormData === "function") {
      props.setFormData((prev) => ({ ...(prev || {}), ...patch }));
      return;
    }

    if (typeof props?.onFormChange === "function") {
      props.onFormChange(patch);
    }
  }, [hotelResortType, roomLayouts, facilityImages, roomCount, props]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideAnyUnitCount =
        unitCountDropdownRefs.current?.some((r) => r?.current && r.current.contains(e.target)) || false;

      if (!clickedInsideAnyUnitCount) setOpenUnitCountIndex(null);

      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================== UI 交互逻辑（不动） ==================
  const applyRoomCount = (n) => {
    const safeN = Math.max(1, Math.min(200, n));
    setRoomCount(safeN);
    setRoomCountInput(String(safeN));

    setRoomLayouts((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
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
      const next = Array.isArray(prev) ? [...prev] : [];
      next[index] = { ...(next[index] || createEmptyRoomLayout()), ...(patch || {}) };
      return next;
    });
  };

  const handleBlueprintUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setRoomLayouts((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const cur = next[index] || createEmptyRoomLayout();
      next[index] = { ...cur, layoutPhotos: [...(cur.layoutPhotos || []), ...files] };
      return next;
    });
  };

  const handleUnitCountInput = (index, raw) => {
    const n = parseDigitsToInt(raw);

    setRoomLayouts((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const cur = next[index] || createEmptyRoomLayout();

      if (raw === "" || raw == null) {
        next[index] = { ...cur, unitCountInput: "", unitCount: 0 };
      } else {
        const clamped = Math.max(1, Math.min(3000, n));
        next[index] = { ...cur, unitCountInput: String(raw), unitCount: clamped };
      }
      return next;
    });
  };

  const selectUnitCount = (index, n) => {
    const clamped = Math.max(1, Math.min(3000, n));
    setRoomLayouts((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const cur = next[index] || createEmptyRoomLayout();
      next[index] = { ...cur, unitCount: clamped, unitCountInput: formatWithCommas(clamped) };
      return next;
    });
    setOpenUnitCountIndex(null);
  };

  const handleUnitCountBlur = (index) => {
    setRoomLayouts((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const cur = next[index] || createEmptyRoomLayout();
      const n = Math.max(1, Math.min(3000, Number(cur.unitCount) || 1));
      next[index] = { ...cur, unitCount: n, unitCountInput: formatWithCommas(n) };
      return next;
    });
  };

  const handleFacilityImagesChange = (val) => setFacilityImages(val || {});

  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {shouldShowHotelResortType && (
        <div className="w-full">
          <label className="block font-medium mb-1">Hotel / Resort Type</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={hotelResortType || ""}
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

      <Button type="submit">提交酒店 / 度假屋房源</Button>
    </form>
  );
}
