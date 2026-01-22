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
  "Cultural / Heritage Stay",
  "Glamping",
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

export default function HotelUploadForm(props) {
  // ✅✅✅ Homestay 模式隐藏 Hotel / Resort Type
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

  const dropdownRef = useRef(null);

  // ✅✅✅ 关键修复：让 upload-property 的 singleFormData 真正能保存/回填（Hotel / Resort）
  const formData = props?.formData || {};
  const setFormData = props?.setFormData;
  const onFormChange = props?.onFormChange;

  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (!formData || typeof formData !== "object") return;

    // ✅✅✅ 关键修复：只有当 formData 真的带有编辑数据时才 hydrate（避免空对象时就锁死）
    const hasData =
      (typeof formData.hotelResortType === "string" && formData.hotelResortType !== "") ||
      typeof formData.roomCount === "number" ||
      (Array.isArray(formData.roomLayouts) && formData.roomLayouts.length > 0) ||
      !!formData.facilityImages;

    if (!hasData) return;

    // 只在第一次拿到编辑数据时 hydrate，避免你在表单里操作时被覆盖
    if (didHydrateRef.current) return;

    if (typeof formData.hotelResortType === "string") setHotelResortType(formData.hotelResortType);

    if (typeof formData.roomCount === "number") {
      setRoomCount(formData.roomCount);
      setRoomCountInput(String(formData.roomCount));
    }

    if (Array.isArray(formData.roomLayouts) && formData.roomLayouts.length > 0) {
      // ✅✅✅ 关键修复：合并默认结构，确保 availability（日历价格）不会在回填时丢失/变成空
      setRoomLayouts(
        formData.roomLayouts.map((l) => ({
          ...createEmptyRoomLayout(),
          ...(l || {}),
          availability: (l && l.availability) || {},
          photos: (l && l.photos) || {},
          layoutPhotos: (l && l.layoutPhotos) || [],
        }))
      );
    }

    if (formData.facilityImages) {
      setFacilityImages(formData.facilityImages || {});
    }

    didHydrateRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // ✅ 把本地状态同步回父层（保存到 Supabase 的 singleFormData）
  useEffect(() => {
    if (typeof setFormData !== "function" && typeof onFormChange !== "function") return;

    const patch = {
      hotelResortType,
      roomCount,
      roomLayouts,
      facilityImages,
    };

    if (typeof setFormData === "function") {
      setFormData((prev) => ({ ...(prev || {}), ...patch }));
    }
    if (typeof onFormChange === "function") {
      onFormChange(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelResortType, roomCount, roomLayouts, facilityImages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLayoutFileRef = (index, layoutFileInputRefs) => {
    if (!layoutFileInputRefs.current[index]) {
      layoutFileInputRefs.current[index] = { current: null };
    }
    return layoutFileInputRefs.current[index];
  };

  const layoutFileInputRefs = useRef([]);

  const applyRoomCount = (n) => {
    const safeN = Math.max(1, Math.min(200, n));
    setRoomCount(safeN);
    setRoomCountInput(String(safeN));

    setRoomLayouts((prev) => {
      const arr = [...(Array.isArray(prev) ? prev : [])];
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
      const next = [...(Array.isArray(prev) ? prev : [])];
      const updated = { ...(next[index] || createEmptyRoomLayout()), ...(patch || {}) };
      next[index] = updated;
      return next;
    });
  };

  const layoutOptions = Array.from({ length: 200 }, (_, i) => i + 1);

  const copySharedToAllRooms = () => {
    if (!roomLayouts?.length) return;
    const seed = roomLayouts[0] || createEmptyRoomLayout();

    setRoomLayouts((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
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

  const handleUploadLayoutPhotos = async (roomIndex, files) => {
    const fileArray = Array.from(files || []);
    if (fileArray.length === 0) return;

    setRoomLayouts((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const curr = next[roomIndex] || createEmptyRoomLayout();
      const existing = Array.isArray(curr.layoutPhotos) ? curr.layoutPhotos : [];
      next[roomIndex] = { ...curr, layoutPhotos: [...existing, ...fileArray] };
      return next;
    });
  };

  const handleRemoveLayoutPhoto = (roomIndex, photoIndex) => {
    setRoomLayouts((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const curr = next[roomIndex] || createEmptyRoomLayout();
      const arr = Array.isArray(curr.layoutPhotos) ? [...curr.layoutPhotos] : [];
      arr.splice(photoIndex, 1);
      next[roomIndex] = { ...curr, layoutPhotos: arr };
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
            const n = Number(digits || 0);
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
          <HotelRoomTypeForm
            index={idx}
            total={roomLayouts.length}
            data={layout}
            onChange={(next) => handleRoomLayoutChange(idx, next)}
          />

          {/* ✅ Layout 图纸上传（New Project 同款） */}
          <div className="mt-4">
            <BlueprintUploadSection
              fileInputRef={getLayoutFileRef(idx, layoutFileInputRefs)}
              images={layout?.layoutPhotos || []}
              onUpload={(files) => handleUploadLayoutPhotos(idx, files)}
              onRemove={(photoIndex) => handleRemoveLayoutPhoto(idx, photoIndex)}
              title="房型图纸上传（可多张）"
              subtitle="上传这个房型的图纸/平面图（可选）"
            />
          </div>
        </div>
      ))}

      {/* ✅✅✅ 你的原本照片上传设计：保持只有这一个（不再出现一堆框） */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          上传设施 / 外观 / 环境照片
        </label>
        <ImageUpload
          config={{
            id: "hotel_facility_images",
            multiple: true,
          }}
          images={facilityImages}
          setImages={setFacilityImages}
        />
      </div>
    </div>
  );
}
