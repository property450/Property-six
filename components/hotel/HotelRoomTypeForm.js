// components/hotel/HotelUploadForm.js
"use client";

import { useState } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// 1 ~ 200 的房型数量选项
const ROOM_COUNT_OPTIONS = Array.from({ length: 200 }, (_, i) => i + 1);

// 创建一个空的房型结构（给每个房型用）
const createEmptyRoomLayout = () => ({
  name: "",
  code: "",
  roomRange: "",
  beds: [],
  guests: { adults: "", children: "" },
  smoking: "",
  checkinService: undefined,
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

  otherServices: {
    tags: [],
    note: "",
  },

  fees: {
    serviceFee: { mode: "free", value: "" },
    cleaningFee: { mode: "free", value: "" },
    deposit: { mode: "free", value: "" },
    otherFee: { mode: "free", value: "", note: "" },
  },

  availability: {},
  photos: {},
});

// -------- 组件主体 --------
export default function HotelUploadForm() {
  // 房型数量 & 输入框展示文字
  const [roomCount, setRoomCount] = useState(1);
  const [roomCountInput, setRoomCountInput] = useState("1");
  const [showCountDropdown, setShowCountDropdown] = useState(false);

  // 每个房型的表单数据
  const [roomLayouts, setRoomLayouts] = useState([createEmptyRoomLayout()]);

  // 酒店公共设施 / 卖点照片（所有房型共用）
  const [facilityImages, setFacilityImages] = useState({});

  // 根据房型数量同步 roomLayouts 的长度
  const syncLayoutsToCount = (count) => {
    setRoomLayouts((prev) => {
      let arr = [...prev];
      if (arr.length < count) {
        while (arr.length < count) {
          arr.push(createEmptyRoomLayout());
        }
      } else if (arr.length > count) {
        arr = arr.slice(0, count);
      }
      return arr;
    });
  };

  // 设置房型数量（下拉或手动输入都会用到）
  const applyRoomCount = (n) => {
    if (!Number.isFinite(n) || n <= 0) return;
    setRoomCount(n);
    setRoomCountInput(String(n));
    syncLayoutsToCount(n);
  };

  // 输入框手动输入 1~200
  const handleRoomCountInputChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d]/g, ""); // 只留数字
    setRoomCountInput(cleaned);

    const n = Number(cleaned);
    if (n >= 1 && n <= 200) {
      applyRoomCount(n);
    }
  };

  // 点击下拉选项
  const handleSelectRoomCount = (n) => {
    applyRoomCount(n);
    setShowCountDropdown(false);
  };

  // 某个房型表单更新
  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const current = next[index] || createEmptyRoomLayout();
      const updated = { ...current, ...patch };
      next[index] = updated;

      // ✅ 第一个房型更新时，把共享字段复制到其它房型
      if (index === 0 && next.length > 1) {
        const first = updated;
        for (let i = 1; i < next.length; i++) {
          const existing = next[i] || createEmptyRoomLayout();
          const existingFees = existing.fees || {};
          const firstFees = first.fees || {};

          next[i] = {
            ...existing,
            roomCounts: first.roomCounts || existing.roomCounts,
            extraSpaces: first.extraSpaces || [],
            indoorFacilities: first.indoorFacilities || [],
            bathroomFacilities: first.bathroomFacilities || [],
            kitchenFacilities: first.kitchenFacilities || [],
            otherFacilities: first.otherFacilities || [],
            views: first.views || [],
            otherServices: first.otherServices || existing.otherServices,
            fees: {
              ...existingFees,
              serviceFee: firstFees.serviceFee || existingFees.serviceFee,
              cleaningFee: firstFees.cleaningFee || existingFees.cleaningFee,
              deposit: firstFees.deposit || existingFees.deposit,
              otherFee: firstFees.otherFee || existingFees.otherFee,
            },
          };
        }
      }

      return next;
    });
  };

  // 提交（之后你再接 Supabase）
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      roomLayouts,
      facilityImages,
    };
    console.log("提交酒店 / 度假屋房源：", payload);
    // TODO: 在这里插入 Supabase 逻辑
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1️⃣ 房型数量：下拉 + 手动输入 */}
      <div className="relative max-w-xs">
        <label className="block font-medium mb-1">
          这个 Homestay / Hotel 有多少个房型 / layout？
        </label>
        <input
          type="text"
          value={roomCountInput}
          onChange={handleRoomCountInputChange}
          onFocus={() => setShowCountDropdown(true)}
          placeholder="选择或输入 1 ~ 200"
          className="border rounded px-3 py-2 w-full"
        />
        {showCountDropdown && (
          <ul
            className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto bg-white border rounded shadow"
            // 防止点选项时先触发 blur 把下拉关掉
            onMouseDown={(e) => e.preventDefault()}
          >
            {ROOM_COUNT_OPTIONS.map((n) => (
              <li
                key={n}
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSelectRoomCount(n)}
              >
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2️⃣ 每个房型的表单 */}
      {roomLayouts.map((layout, index) => (
        <div
          key={index}
          className="border rounded-xl p-4 space-y-4 bg-white shadow-sm"
        >
          <HotelRoomTypeForm
            index={index}
            total={roomLayouts.length}
            data={layout}
            onChange={(patch) => handleRoomLayoutChange(index, patch)}
          />
        </div>
      ))}

      {/* 3️⃣ 这个酒店/度假屋的公共设施 / 卖点照片（所有房型共用） */}
      <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <h3 className="font-semibold text-lg">
          这个酒店/度假屋的设施或卖点照片
        </h3>
        <p className="text-sm text-gray-500">
          例如：游泳池、Lobby、大堂、外观、餐厅、BBQ 区等等。
          这些照片是所有房型共用的，所以放在最后统一上传。
        </p>

        <ImageUpload
          config={{
            id: "hotel_facility_images",
            label: "上传酒店 / 度假屋设施或卖点照片",
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
