// components/hotel/HotelUploadForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// ✅ New Project 同款
import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";

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

  // ✅ Layout 图纸（New Project 同款用这个字段）
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

export default function HotelUploadForm() {
  const [roomCount, setRoomCount] = useState(1);
  const [roomLayouts, setRoomLayouts] = useState([createEmptyRoomLayout()]);

  const [facilityImages, setFacilityImages] = useState({});

  const [roomCountInput, setRoomCountInput] = useState("1");
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  // ✅ 每个房型一个 file input ref（给 BlueprintUploadSection 用）
  const layoutFileInputRefs = useRef([]);

  const getLayoutFileRef = (index) => {
    if (!layoutFileInputRefs.current[index]) {
      layoutFileInputRefs.current[index] = { current: null };
    }
    return layoutFileInputRefs.current[index];
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current || dropdownRef.current.contains(e.target)) return;
      setShowDropdown(false);
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

      // 同步 Layout 1 的通用信息（保持你原逻辑）
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

  // ✅ New Project 同款：处理 Layout 图纸上传 -> 存进 layoutPhotos
  const handleBlueprintUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(roomLayouts[index]?.layoutPhotos || []), ...files];
    handleRoomLayoutChange(index, { layoutPhotos: newPhotos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("提交数据", { roomLayouts, facilityImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* ✅✅✅ 这里就是 New Project 同款的 Layout 图纸上传（点击上传 Layout 图纸） */}
          <BlueprintUploadSection
            fileInputRef={getLayoutFileRef(index)}
            onUpload={(e) => handleBlueprintUpload(index, e)}
          />

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
