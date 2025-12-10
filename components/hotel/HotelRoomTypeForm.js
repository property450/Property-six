// components/hotel/HotelUploadForm.js
"use client";

import { useState, useRef, useEffect } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

/** 生成空白房型结构 */
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
    otherFee: { mode: "free", value: "", note: "" },
  },

  availability: {},
  photos: {},
});

/** 需要从第一个房型复制到其它房型的字段 */
const SHARED_KEYS = [
  "beds",
  "guests",
  "smoking",
  "checkinService",
  "breakfast",
  "petPolicy",
  "cancellationPolicy",

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

  /** ▼▼▼ 房型数量下拉选择状态 ▼▼▼ */
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [dropdownAllowed, setDropdownAllowed] = useState(true);
  const roomRef = useRef(null);

  /** 点击空白收起下拉 */
  useEffect(() => {
    function handleOutside(e) {
      if (roomRef.current && !roomRef.current.contains(e.target)) {
        setShowRoomDropdown(false);
        setDropdownAllowed(true);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  /** 房型数量变化 */
  const handleRoomCountChange = (count) => {
    const n = Number(count) || 1;
    setRoomCount(n);

    setRoomLayouts((prev) => {
      const arr = [...prev];
      if (arr.length < n) {
        while (arr.length < n) arr.push(createEmptyRoomLayout());
      } else if (arr.length > n) {
        arr.length = n;
      }
      return arr;
    });
  };

  /** 单个房型更新（第一个房型自动复制到其它房型） */
  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...patch };
      next[index] = updated;

      if (index === 0 && next.length > 1) {
        const shared = {};
        SHARED_KEYS.forEach((key) => {
          shared[key] = updated[key];
        });
        for (let i = 1; i < next.length; i++) {
          next[i] = { ...next[i], ...shared };
        }
      }
      return next;
    });
  };

  /** 提交 */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      roomLayouts,
      facilityImages,
    };

    console.log("准备提交酒店房型数据：", payload);
    // TODO：你自己的 Supabase 插入逻辑
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 房型数量选择（下拉 + 手动输入） */}
      <div ref={roomRef}>
        <label className="block font-medium mb-1">
          这个 Homestay / Hotel 有多少个房型 / layout？
        </label>

        <div
          className="border rounded px-3 py-2 w-40 bg-white cursor-pointer flex justify-between items-center"
          onClick={() => dropdownAllowed && setShowRoomDropdown(true)}
        >
          <input
            type="text"
            className="outline-none bg-transparent w-full"
            placeholder="选择数量"
            value={roomCount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, "");
              setRoomCount(cleaned);
              handleRoomCountChange(cleaned);
              setShowRoomDropdown(false);
              setDropdownAllowed(false);
            }}
            onFocus={() => {
              if (dropdownAllowed) setShowRoomDropdown(true);
            }}
          />
          <span className="text-gray-500">▾</span>
        </div>

        {showRoomDropdown && (
          <ul className="absolute z-20 mt-1 w-40 max-h-60 overflow-y-auto bg-white border rounded shadow">
            {Array.from({ length: 200 }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setRoomCount(num);
                  handleRoomCountChange(num);
                  setShowRoomDropdown(false);
                  setDropdownAllowed(false);
                }}
              >
                {num}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 每个房型的表单 */}
      {roomLayouts.map((layout, index) => (
        <div key={index} className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">
          <HotelRoomTypeForm
            index={index}
            total={roomCount}
            data={layout}
            onChange={(patch) => handleRoomLayoutChange(index, patch)}
          />
        </div>
      ))}

      {/* 公共设施 / 卖点照片上传 */}
      <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h3 className="font-semibold text-lg">这个酒店/度假屋的设施或卖点照片</h3>
        <p className="text-sm text-gray-500">
          例如：游泳池、Lobby、大堂、外观、餐厅、BBQ 区等。
        </p>

        <ImageUpload
          config={{
            id: "hotel_facility_images",
            multiple: true,
            label: "上传酒店 / 度假屋设施照片",
          }}
          images={facilityImages}
          setImages={setFacilityImages}
        />
      </div>

      {/* 提交按钮 */}
      <Button type="submit" className="mt-4">
        提交酒店 / 度假屋房源
      </Button>
    </form>
  );
}
