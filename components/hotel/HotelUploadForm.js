// components/hotel/HotelUploadForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// 创建一个空的房型结构
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
});

// 共享字段
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

  // 新增：可编辑的输入框与下拉状态
  const [roomCountInput, setRoomCountInput] = useState("1");
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  /** 点击空白自动收起 */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current || dropdownRef.current.contains(e.target)) return;
      setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** 更新房型数量 */
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

  /** 单个房型更新 */
  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...patch };
      next[index] = updated;

      // 第一个房型 → 自动同步到其它房型
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("提交数据", { roomLayouts, facilityImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 房型数量选择框（已替换为下拉 + 输入） */}
      <div className="relative max-w-xs" ref={dropdownRef}>
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
          placeholder="选择或输入 1 ~ 200"
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

      {/* 房型表单 */}
      {roomLayouts.map((layout, index) => (
        <div
          key={index}
          className="border rounded-xl p-4 space-y-4 bg-white shadow-sm"
        >
          <h3 className="font-semibold text-lg mb-2">
            房型 {index + 1} / {roomLayouts.length}
          </h3>

          <HotelRoomTypeForm
            index={index}
            total={roomLayouts.length}
            data={layout}
            onChange={(patch) => handleRoomLayoutChange(index, patch)}
          />
        </div>
      ))}

      {/* 公共设施照片上传 */}
      <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h3 className="font-semibold text-lg">
          这个酒店/度假屋的设施或卖点照片
        </h3>
        <p className="text-sm text-gray-500">
          例如：游泳池、大堂、外观、BBQ 区等（所有房型共用）。
        </p>

        <ImageUpload
          config={{
            id: "hotel_facility_images",
            label: "上传酒店 / 度假屋设施照片",
            multiple: true,
          }}
          images={facilityImages}
          setImages={setFacilityImages}
        />
      </div>

      <Button type="submit" className="mt-4">
        提交酒店 / 度假屋房源
      </Button>
    </form>
  );
}
