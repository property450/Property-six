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
  "Shared Accommodation",

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

function safeParseHotelFormData(v) {
  if (!v) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (typeof v === "object") return v;
  return null;
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

  // ✅✅✅ 编辑回填：外层 formData 可能是异步拿到的，第一次有值时要灌回本地 state
  const didHydrateRef = useRef(false);
  useEffect(() => {
    const parsed = safeParseHotelFormData(props?.formData);
    if (!parsed) return;

    if (didHydrateRef.current) return;

    setHotelResortType(parsed?.hotelResortType || "");
    const nextRoomLayouts =
      Array.isArray(parsed?.roomLayouts) && parsed.roomLayouts.length > 0
        ? parsed.roomLayouts
        : [createEmptyRoomLayout()];
    const nextRoomCount =
      parsed?.roomCount ||
      parsed?.roomLayouts?.length ||
      nextRoomLayouts.length ||
      1;

    setRoomCount(nextRoomCount);
    setRoomCountInput(String(nextRoomCount));
    setRoomLayouts(nextRoomLayouts);

    setFacilityImages(parsed?.facilityImages || {});

    didHydrateRef.current = true;
  }, [props?.formData]);

  // ✅✅✅ 把本地选择同步回外层（让 upload-property 能保存/编辑回填）
  useEffect(() => {
    // 如果是编辑模式（有 formData），但还没 hydrate，就不要把初始空值写回去
    if (props?.formData && !didHydrateRef.current) return;

    const patch = {
      hotelResortType,
      roomCount,
      roomLayouts,
      facilityImages,
    };

    if (typeof props?.setFormData === "function") {
      props.setFormData((prev) => ({ ...(prev || {}), ...patch }));
    }

    if (typeof props?.onFormChange === "function") {
      props.onFormChange(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelResortType, roomCount, roomLayouts, facilityImages]);

  // ✅ Layout 图纸上传 refs（每个房型一个）
  const layoutFileInputRefs = useRef([]);
  const unitCountDropdownRefs = useRef([]); // ✅ 每个房型数量框外层 ref

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
      return next;
    });
  };

  // ✅ Layout 数量建议：1~200
  const layoutOptions = Array.from({ length: 200 }, (_, i) => i + 1);

  // ✅ 房型数量建议：1~3000
  const unitCountOptions = useRef(Array.from({ length: 3000 }, (_, i) => i + 1));

  const applyUnitCount = (index, n) => {
    const safeN = Math.max(1, Math.min(3000, n));
    setRoomLayouts((prev) => {
      const next = [...prev];
      const target = next[index] || createEmptyRoomLayout();
      next[index] = {
        ...target,
        unitCount: safeN,
        unitCountInput: formatWithCommas(safeN),
      };
      return next;
    });
    setOpenUnitCountIndex(null);
  };

  const handleUnitCountInputChange = (index, raw) => {
    const digits = String(raw ?? "").replace(/[^\d]/g, "");
    const n = parseDigitsToInt(digits);

    setRoomLayouts((prev) => {
      const next = [...prev];
      const target = next[index] || createEmptyRoomLayout();
      next[index] = {
        ...target,
        unitCountInput: digits ? formatWithCommas(n) : "",
        unitCount: digits ? Math.max(1, Math.min(3000, n)) : 1,
      };
      return next;
    });
  };

  const handleUploadLayoutPhotos = async (roomIndex, files) => {
    const fileArray = Array.from(files || []);
    if (fileArray.length === 0) return;

    // ✅ 不动你原本逻辑：这里只是把文件对象保存到 layoutPhotos
    setRoomLayouts((prev) => {
      const next = [...prev];
      const curr = next[roomIndex] || createEmptyRoomLayout();
      const existing = Array.isArray(curr.layoutPhotos) ? curr.layoutPhotos : [];
      next[roomIndex] = { ...curr, layoutPhotos: [...existing, ...fileArray] };
      return next;
    });
  };

  const handleRemoveLayoutPhoto = (roomIndex, photoIndex) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const curr = next[roomIndex] || createEmptyRoomLayout();
      const arr = Array.isArray(curr.layoutPhotos) ? [...curr.layoutPhotos] : [];
      arr.splice(photoIndex, 1);
      next[roomIndex] = { ...curr, layoutPhotos: arr };
      return next;
    });
  };

  const handleRemoveFacilityPhoto = (labelKey, idx) => {
    setFacilityImages((prev) => {
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[labelKey]) ? [...next[labelKey]] : [];
      list.splice(idx, 1);
      next[labelKey] = list;
      return next;
    });
  };

  const handleSetFacilityPhotos = (labelKey, updated) => {
    setFacilityImages((prev) => ({ ...(prev || {}), [labelKey]: updated }));
  };

  const copySharedToAllRooms = () => {
    if (!roomLayouts?.length) return;
    const seed = roomLayouts[0] || createEmptyRoomLayout();

    setRoomLayouts((prev) => {
      const next = [...prev];
      for (let i = 1; i < next.length; i++) {
        const curr = next[i] || createEmptyRoomLayout();
        const merged = { ...curr };
        SHARED_KEYS.forEach((k) => {
          merged[k] = seed[k];
        });
        next[i] = merged;
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ✅ Hotel/Resort Type */}
      {shouldShowHotelResortType && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Hotel / Resort Type
          </label>
          <select
            className="w-full border rounded p-2 bg-white"
            value={hotelResortType || ""}
            onChange={(e) => setHotelResortType(e.target.value)}
          >
            <option value="">请选择类型</option>
            {HOTEL_RESORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ 房型数量 */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium mb-1">
          这个项目有多少个房型 / Layout 数量
        </label>

        <input
          className="w-full border rounded p-2 bg-white"
          value={roomCountInput}
          onChange={(e) => {
            const digits = String(e.target.value).replace(/[^\d]/g, "");
            setRoomCountInput(digits);
            const n = parseDigitsToInt(digits);
            if (n) applyRoomCount(n);
          }}
          onFocus={() => setShowDropdown(true)}
          onClick={() => setShowDropdown(true)}
          placeholder="例如：2 ~ 200"
        />

        {showDropdown && (
          <div className="absolute z-30 w-full mt-1 bg-white border rounded shadow max-h-60 overflow-auto">
            {layoutOptions.map((n) => (
              <div
                key={n}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyRoomCount(n);
                  setShowDropdown(false);
                }}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ 快速复制（共享字段） */}
      <div className="flex gap-2">
        <Button type="button" onClick={copySharedToAllRooms}>
          复制第一个房型（共享字段）到所有房型
        </Button>
      </div>

      {/* ✅ 房型表单 */}
      {roomLayouts.map((layout, idx) => (
        <div key={idx}>
          {/* ✅✅✅ 每个房型数量（1~3000） */}
          <div className="relative mt-4" ref={getUnitCountRef(idx)}>
            <label className="block text-sm font-medium mb-1">
              这个房型的数量有多少？
            </label>

            <input
              className="w-full border rounded p-2 bg-white"
              value={layout?.unitCountInput ?? formatWithCommas(layout?.unitCount || 1)}
              onChange={(e) => handleUnitCountInputChange(idx, e.target.value)}
              onFocus={() => setOpenUnitCountIndex(idx)}
              onClick={() => setOpenUnitCountIndex(idx)}
              placeholder="例如：1 ~ 3,000"
            />

            {openUnitCountIndex === idx && (
              <div className="absolute z-30 w-full mt-1 bg-white border rounded shadow max-h-60 overflow-auto">
                {unitCountOptions.current.map((n) => (
                  <div
                    key={n}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyUnitCount(idx, n);
                    }}
                  >
                    {formatWithCommas(n)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ 房型详情表单 */}
          <HotelRoomTypeForm
            index={idx}
            total={roomLayouts.length}
            data={layout}
            onChange={(next) => handleRoomLayoutChange(idx, next)}
          />

          {/* ✅ Layout 图纸上传（New Project 同款） */}
          <div className="mt-4">
            <BlueprintUploadSection
              fileInputRef={getLayoutFileRef(idx)}
              images={layout?.layoutPhotos || []}
              onUpload={(files) => handleUploadLayoutPhotos(idx, files)}
              onRemove={(photoIndex) => handleRemoveLayoutPhoto(idx, photoIndex)}
              title="房型图纸上传（可多张）"
              subtitle="上传这个房型的图纸/平面图（可选）"
            />
          </div>
        </div>
      ))}

      {/* ✅ 公共设施照片（不动你原本结构） */}
      <div className="mt-6 space-y-3">
        <p className="font-semibold">公共设施/环境照片（可选）</p>

        <ImageUpload
          config={{
            id: "hotel_facility_outdoor",
            label: "酒店/民宿外观/环境",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) => handleSetFacilityPhotos("hotel_facility_outdoor", updated)}
        />

        <ImageUpload
          config={{
            id: "hotel_facility_lobby",
            label: "大堂 / Lobby",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) => handleSetFacilityPhotos("hotel_facility_lobby", updated)}
        />

        <ImageUpload
          config={{
            id: "hotel_facility_pool",
            label: "泳池 / Pool",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) => handleSetFacilityPhotos("hotel_facility_pool", updated)}
        />

        <ImageUpload
          config={{
            id: "hotel_facility_gym",
            label: "健身房 / Gym",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) => handleSetFacilityPhotos("hotel_facility_gym", updated)}
        />

        <ImageUpload
          config={{
            id: "hotel_facility_restaurant",
            label: "餐厅 / Restaurant",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) =>
            handleSetFacilityPhotos("hotel_facility_restaurant", updated)
          }
        />

        <ImageUpload
          config={{
            id: "hotel_facility_other",
            label: "其它公共设施",
            multiple: true,
          }}
          images={facilityImages}
          setImages={(updated) => handleSetFacilityPhotos("hotel_facility_other", updated)}
        />
      </div>
    </div>
  );
}
