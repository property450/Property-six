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

  // ✅✅ 只新增：每个房型数量（1~3000，带逗号显示）
  unitCount: 1,
  unitCountInput: "1",
});

const SHARED_KEYS = [
  "roomCounts",
  "extraSpaces",
  "indoorFacilities",
  "bathroomFacilities",
  "kitchenFacilities",
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

function hasAnyValue(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).length > 0;
}

export default function HotelUploadForm(props) {
  // ✅✅✅ 关键：Homestay 模式隐藏 Hotel / Resort Type（只改这一处判断，不动其它逻辑）
  const shouldShowHotelResortType =
    props?.mode !== "homestay" &&
    !props?.hideHotelResortTypeSelector &&
    !props?.hideHotelResortType;

  // ✅ 仅新增：Hotel / Resort 类型
  const [hotelResortType, setHotelResortType] = useState("");

  const [roomCount, setRoomCount] = useState(1);
  const [roomLayouts, setRoomLayouts] = useState([createEmptyRoomLayout()]);
  const [facilityImages, setFacilityImages] = useState({});

  const [roomCountInput, setRoomCountInput] = useState("1");
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ 每个房型“数量下拉”当前展开的是哪一个
  const [openUnitCountIndex, setOpenUnitCountIndex] = useState(null);

  const dropdownRef = useRef(null);

  // ✅ Layout 图纸上传 refs（每个房型一个）
  const layoutFileInputRefs = useRef([]);
  const unitCountDropdownRefs = useRef([]); // ✅ 每个房型数量框外层 ref

  // ✅✅✅ 修复无限循环：把父层传进来的函数放进 ref，不放进 useEffect 依赖
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

  // ✅✅✅【核心修复 1】编辑模式/回填：从 props.formData 初始化一次（支持异步加载后再回填）
  const didInitFromPropsRef = useRef(false);
  useEffect(() => {
    if (didInitFromPropsRef.current) return;

    const d = props?.formData;
    if (!hasAnyValue(d)) return;

    if (typeof d.hotelResortType === "string") {
      setHotelResortType(d.hotelResortType);
    }

    if (Array.isArray(d.roomLayouts) && d.roomLayouts.length > 0) {
      const normalized = d.roomLayouts.map((l) => {
        const base = { ...createEmptyRoomLayout(), ...(l || {}) };
        const unitCountNum = Number(base.unitCount);
        if (
          (!base.unitCountInput || base.unitCountInput === "") &&
          Number.isFinite(unitCountNum) &&
          unitCountNum > 0
        ) {
          base.unitCountInput = formatWithCommas(unitCountNum);
        }
        return base;
      });

      setRoomLayouts(normalized);
      setRoomCount(normalized.length);
      setRoomCountInput(String(normalized.length));
    }

    if (d.facilityImages && typeof d.facilityImages === "object") {
      setFacilityImages(d.facilityImages);
    }

    didInitFromPropsRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.formData]);

  // ✅✅✅【核心修复 2】实时同步回父层（不会再无限循环）
  // 重点：
  // - 不把 props 放进依赖
  // - 用 ref 拿 setFormData / onFormChange
  // - 有 setFormData 就优先用它（避免 setFormData + onFormChange 双重更新）
  useEffect(() => {
    const patch = {
      hotelResortType,
      roomLayouts,
      facilityImages,
      roomCount,
    };

    const setFn = setFormDataRef.current;
    const onFn = onFormChangeRef.current;

    if (typeof setFn === "function") {
      setFn((prev) => ({ ...(prev || {}), ...patch }));
      return;
    }
    if (typeof onFn === "function") {
      onFn(patch);
    }
  }, [hotelResortType, roomLayouts, facilityImages, roomCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // 关闭房型数量 dropdown：只要点到任何一个数量框内就不关闭
      const clickedInsideAnyUnitCount =
        unitCountDropdownRefs.current?.some(
          (r) => r?.current && r.current.contains(e.target)
        ) || false;

      if (!clickedInsideAnyUnitCount) {
        setOpenUnitCountIndex(null);
      }

      // 关闭 layout 数量 dropdown（你原本的）
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

      // ✅ 保持你原逻辑：Layout1 同步通用字段到其它房型
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

  // ✅ Layout 图纸上传 -> 存进 layoutPhotos
  const handleBlueprintUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(roomLayouts[index]?.layoutPhotos || []), ...files];
    handleRoomLayoutChange(index, { layoutPhotos: newPhotos });
  };

  // ✅ 每个房型数量：手动输入
  const handleUnitCountInput = (index, raw) => {
    const n = parseDigitsToInt(raw);

    // 允许空值输入过程（比如用户正在删）
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

  // ✅ 每个房型数量：选择下拉
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
    // ✅ 仅新增：把 hotelResortType 也打印出来（不影响你其它逻辑）
    console.log("提交数据", { hotelResortType, roomLayouts, facilityImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ✅✅ 仅新增：Hotel / Resort Type */}
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

      {/* 你原本的“有多少个房型/layout” */}
      <div className="relative w-40" ref={dropdownRef}>
        <label className="block font-medium mb-1">
          这个 Homestay / Hotel 有多少个房型 / layout？
        </label>

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

      {/* 每个房型表单 */}
      {roomLayouts.map((layout, index) => (
        <div
          key={index}
          className="border rounded-xl p-4 space-y-4 bg-white shadow-sm"
        >
          <h3 className="font-semibold text-lg mb-2">
            房型 {index + 1} / {roomLayouts.length}
          </h3>

          {/* ✅ Layout 图纸（New Project 同款） */}
          <BlueprintUploadSection
            fileInputRef={getLayoutFileRef(index)}
            onUpload={(e) => handleBlueprintUpload(index, e)}
          />

          {/* ✅✅ 只新增：每个房型数量（1~3000，可编辑，千分位） */}
          <div className="relative w-72" ref={getUnitCountRef(index)}>
            <label className="block font-medium mb-1">
              请问这个房型的数量有多少？
            </label>

            <input
              type="text"
              value={
                layout.unitCountInput != null && layout.unitCountInput !== ""
                  ? layout.unitCountInput
                  : ""
              }
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

      {/* 公共设施上传（保持你原本） */}
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
