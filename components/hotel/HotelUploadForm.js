// components/hotel/HotelUploadForm.js
"use client";

import { useState, useEffect } from "react";
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";
import HotelRoomTypeForm from "./HotelRoomTypeForm";

const HOTEL_TYPES = [
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
];

const makeEmptyRoom = () => ({
  name: "",
  code: "",
  roomRange: "",
  roomCounts: {
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
  },
  beds: [], // 床型+数量
  guests: {
    adults: "",
    children: "",
  },
  smoking: "",
  checkinService: {
    type: "",
    timeRange: {
      startHour: "",
      startMinute: "",
      startPeriod: "AM",
      endHour: "",
      endMinute: "",
      endPeriod: "PM",
    },
  },
  breakfast: "",
  cancellationPolicy: {
    type: "",
    condition: "",
  },
  extraSpaces: [],
  indoorFacilities: [],
  bathroomFacilities: [],
  kitchenFacilities: [],
  otherFacilities: [],
  views: [],
  otherServices: [],
  fees: {
    serviceFee: { mode: "free", value: "" },
    cleaningFee: { mode: "free", value: "" },
    deposit: { mode: "free", value: "" },
    otherFee: { mode: "free", value: "" },
  },
  availability: {}, // 日历
  photos: [], // 此房型照片
});

export default function HotelUploadForm() {
  const [hotelType, setHotelType] = useState("");
  const [hasMultipleTypes, setHasMultipleTypes] = useState("no"); // "yes" | "no"
  const [roomTypeCount, setRoomTypeCount] = useState(1);
  const [roomTypes, setRoomTypes] = useState([makeEmptyRoom()]);
  const [hotelAvailability, setHotelAvailability] = useState({}); // 整体日历（可选）

  // 当「是否多个房型」切换成否时，只保留 1 个房型
  useEffect(() => {
    if (hasMultipleTypes === "no") {
      setRoomTypeCount(1);
      setRoomTypes((prev) => (prev.length ? [prev[0]] : [makeEmptyRoom()]));
    }
  }, [hasMultipleTypes]);

  // 调整房型数量
  const handleRoomTypeCountChange = (value) => {
    let n = parseInt(String(value || "1").replace(/\D/g, ""), 10);
    if (!Number.isFinite(n) || n <= 0) n = 1;
    if (n > 20) n = 20; // 最多 20 种房型

    setRoomTypeCount(n);

    setRoomTypes((prev) => {
      if (prev.length === n) return prev;

      const cloneBase = prev[0] || makeEmptyRoom();

      // 先保证至少 1 个
      let next = prev.length ? [...prev] : [makeEmptyRoom()];

      if (n > next.length) {
        // 新增房型：复制第一个房型的配置（深拷贝简易版）
        const base = JSON.parse(JSON.stringify(cloneBase));
        for (let i = next.length; i < n; i++) {
          // 名称/代码/房号范围给空，让你自己填
          next.push({
            ...base,
            name: "",
            code: "",
            roomRange: "",
          });
        }
      } else {
        // 减少房型
        next = next.slice(0, n);
      }

      return next;
    });
  };

  // 更新单个房型
  const updateRoomType = (index, updated) => {
    setRoomTypes((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* 酒店大类 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Hotel / Resort Type
        </label>
        <select
          className="w-full border rounded p-2"
          value={hotelType}
          onChange={(e) => setHotelType(e.target.value)}
        >
          <option value="">请选择 Hotel/Resort 类型</option>
          {HOTEL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* 是否有多个房型？ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            是否有多个房型？
          </label>
          <select
            className="w-full border rounded p-2"
            value={hasMultipleTypes}
            onChange={(e) => setHasMultipleTypes(e.target.value)}
          >
            <option value="no">否，只需要 1 个房型</option>
            <option value="yes">是，有多个房型</option>
          </select>
        </div>

        {hasMultipleTypes === "yes" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              有多少个房型？
            </label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full border rounded p-2"
              value={roomTypeCount}
              onChange={(e) => handleRoomTypeCountChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 整体酒店的可租日期 / 价格（日历）——专业版保留一份 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          整体酒店 / 度假村的可租日期 & 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={hotelAvailability}
          onChange={setHotelAvailability}
        />
      </div>

      {/* 房型列表 */}
      <div className="flex justify-between items-center mt-4">
        <h2 className="font-semibold">房型设置</h2>
        {hasMultipleTypes === "no" && (
          <span className="text-xs text-gray-500">
            当前为单一房型模式，如需多个房型请上面选择 “是”
          </span>
        )}
      </div>

      {roomTypes.map((room, idx) => (
        <HotelRoomTypeForm
          key={idx}
          index={idx}
          room={room}
          onChange={(updated) => updateRoomType(idx, updated)}
        />
      ))}
    </div>
  );
}
