// components/HotelUploadForm.js
"use client";

import { useRef, useState } from "react";
import RoomCountSelector from "./RoomCountSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import ImageUpload from "./ImageUpload";
import AdvancedAvailabilityCalendar from "./AdvancedAvailabilityCalendar";

// 酒店 / 度假村的类型
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

/* ================= Layout 图纸上传（仅新增，不影响其它逻辑） ================= */
function LayoutBlueprintUpload({ value = [], onChange }) {
  const inputRef = useRef(null);
  const files = Array.isArray(value) ? value : [];

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    onChange?.([...(files || []), ...picked]);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Layout 图纸上传</div>
          <div className="text-sm text-gray-500">支持多张图片 / PDF（可多选）</div>
        </div>

        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
        >
          上传 Layout 图纸
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={addFiles}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border rounded-lg px-3 py-2"
            >
              <div className="text-sm text-gray-800 break-all">
                {f?.name || `文件 ${idx + 1}`}
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => removeAt(idx)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 单个房型表单
function HotelRoomTypeForm({ index, room, onChange }) {
  const safeRoom = room || {};
  const roomCounts = safeRoom.roomCounts || {};
  const extraSpaces = safeRoom.extraSpaces || [];
  const furniture = safeRoom.furniture || [];
  const facilities = safeRoom.facilities || [];
  const photos = safeRoom.photos || [];
  const availability = safeRoom.availability || {};
  const layoutPhotos = safeRoom.layoutPhotos || [];

  // 更新房型
  const updateRoom = (patch) => {
    onChange?.({ ...safeRoom, ...patch });
  };

  // 更新房间数量
  const handleRoomCountsChange = (patch) => {
    updateRoom({
      roomCounts: {
        ...roomCounts,
        ...patch,
      },
    });
  };

  // 给 ImageUpload 用的配置（✅ 用安全的 roomCounts）
  const photoConfig = {
    bedrooms: roomCounts.bedrooms || "",
    bathrooms: roomCounts.bathrooms || "",
    kitchens: roomCounts.kitchens || "",
    livingRooms: roomCounts.livingRooms || "",
    carpark: "",
    extraSpaces,
    facilities,
    furniture,
    orientation: [],
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white space-y-4 mt-4">
      <h3 className="font-semibold">房型 {index + 1}</h3>

      {/* 房型名称 */}
      <div>
        <label className="block text-sm font-medium mb-1">房型名称</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          placeholder="例如：Deluxe King, Sea View Suite..."
          value={safeRoom.name || ""}
          onChange={(e) => updateRoom({ name: e.target.value })}
        />
      </div>

      {/* 房型代码 / 房号范围（可选） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">房型代码（可选）</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：DLX-KING"
            value={safeRoom.code || ""}
            onChange={(e) => updateRoom({ code: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">房号范围（可选）</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：101–110"
            value={safeRoom.roomRange || ""}
            onChange={(e) => updateRoom({ roomRange: e.target.value })}
          />
        </div>
      </div>

      {/* 房间数量（床房/浴室/客厅等） */}
      <RoomCountSelector
        value={{
          bedrooms: roomCounts.bedrooms || "",
          bathrooms: roomCounts.bathrooms || "",
          kitchens: roomCounts.kitchens || "",
          livingRooms: roomCounts.livingRooms || "",
        }}
        onChange={handleRoomCountsChange}
      />

      {/* 每间最多可住人数 */}
      <div>
        <label className="block text-sm font-medium mb-1">每间最多可住人数</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded p-2"
          placeholder="例如：2 / 4 / 6"
          value={safeRoom.maxGuests || ""}
          onChange={(e) => updateRoom({ maxGuests: e.target.value })}
        />
      </div>

      {/* 额外空间 / 家私 / 设施 */}
      <ExtraSpacesSelector
        value={extraSpaces}
        onChange={(val) => updateRoom({ extraSpaces: val })}
      />

      <FurnitureSelector
        value={furniture}
        onChange={(val) => updateRoom({ furniture: val })}
      />

      <FacilitiesSelector
        value={facilities}
        onChange={(val) => updateRoom({ facilities: val })}
      />

      {/* 此房型独立的日历（可选，你也可以只用整体的） */}
      <div>
        <label className="block text-sm font-medium mb-1">
          此房型可租日期 / 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={availability}
          onChange={(val) => updateRoom({ availability: val })}
        />
      </div>

      {/* ✅ 仅新增：Layout 图纸上传（每个房型一套） */}
      <LayoutBlueprintUpload
        value={layoutPhotos}
        onChange={(val) => updateRoom({ layoutPhotos: val })}
      />

      {/* 房型图片上传 */}
      <div>
        <label className="block text-sm font-medium mb-1">上传此房型的照片</label>
        <ImageUpload
          config={photoConfig}
          images={photos}
          setImages={(updated) => updateRoom({ photos: updated })}
        />
      </div>
    </div>
  );
}

// 整体 Hotel / Resort 上传表单
export default function HotelUploadForm() {
  const [hotelType, setHotelType] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [hotelAvailability, setHotelAvailability] = useState({});

  const addRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      {
        name: "",
        code: "",
        roomRange: "",
        roomCounts: {
          bedrooms: "",
          bathrooms: "",
          kitchens: "",
          livingRooms: "",
        },
        maxGuests: "",
        extraSpaces: [],
        furniture: [],
        facilities: [],
        availability: {},
        photos: [],

        // ✅ 仅新增：每个房型的 Layout 图纸
        layoutPhotos: [],
      },
    ]);
  };

  const updateRoomType = (index, updated) => {
    setRoomTypes((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  return (
    <div className="space-y-4 mt-6">
      {/* 酒店大类 */}
      <div>
        <label className="block text-sm font-medium mb-1">Hotel / Resort Type</label>
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

      {/* 整体日历（整间酒店可用日期 / 价格） */}
      <div>
        <label className="block text-sm font-medium mb-1">
          整体酒店 / 度假村可租日期 & 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={hotelAvailability}
          onChange={setHotelAvailability}
        />
      </div>

      {/* 房型列表 */}
      <div className="flex justify-between items-center mt-4">
        <h2 className="font-semibold">房型设置</h2>
        <button
          type="button"
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
          onClick={addRoomType}
        >
          + 添加一个房型
        </button>
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
