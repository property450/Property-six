"use client";

import { useEffect, useRef, useState } from "react";
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

const CHECKIN_SERVICE_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "self", label: "自助入住" },
  { value: "frontdesk", label: "24 小时前台服务" },
  { value: "limited", label: "入住时间限制" },
];

const YES_NO_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "yes", label: "是" },
  { value: "no", label: "否" },
];

const FREE_CANCEL_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "free", label: "能" },
  { value: "no", label: "不能" },
];

const PET_POLICY_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "allowed", label: "允许携带宠物" },
  { value: "forbidden", label: "禁止携带宠物" },
  { value: "care", label: "提供宠物托管服务" },
];

const SMOKING_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "yes", label: "能" },
  { value: "no", label: "不能" },
];

const BED_TYPE_OPTIONS = [
  "Single Bed",
  "Super Single Bed",
  "Queen Bed",
  "King Bed",
  "Twin Bed",
  "Sofa Bed",
  "Bunk Bed",
];

function toNumberString(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeRoomArray(singleFormData = {}) {
  const roomTypes = Array.isArray(singleFormData?.roomTypes) ? singleFormData.roomTypes : null;
  const rooms = Array.isArray(singleFormData?.rooms) ? singleFormData.rooms : null;
  const roomLayouts = Array.isArray(singleFormData?.roomLayouts) ? singleFormData.roomLayouts : null;
  return roomTypes || rooms || roomLayouts || [];
}

function normalizeTopLevelHotelType(singleFormData = {}) {
  return (
    singleFormData?.hotelType ||
    singleFormData?.hotelResortType ||
    singleFormData?.stayType ||
    ""
  );
}

function normalizeAvailability(singleFormData = {}) {
  return singleFormData?.availability || {};
}

function normalizeRoom(room = {}) {
  const roomCounts = room?.roomCounts || {};

  const bedType =
    room?.bedType ||
    room?.roomBedType ||
    room?.unitBedType ||
    room?.beds?.[0]?.label ||
    room?.beds?.[0]?.name ||
    "";

  const bedCount = room?.beds?.[0]?.count || "1";

  const maxGuests =
    room?.maxGuests ||
    room?.guestCount ||
    room?.guests?.adults ||
    "";

  const smoking =
    room?.smoking ||
    room?.smokingAllowed ||
    room?.allowSmoking ||
    room?.indoorSmoking ||
    "";

  const breakfast =
    room?.breakfast ||
    room?.breakfastIncluded ||
    room?.includeBreakfast ||
    room?.withBreakfast ||
    "";

  const petPolicy =
    room?.petPolicy?.type ||
    room?.petAllowed ||
    room?.petsAllowed ||
    room?.allowPets ||
    "";

  const freeCancel =
    room?.cancellationPolicy?.type ||
    room?.freeCancel ||
    room?.freeCancellation ||
    "";

  const checkinService =
    room?.checkinService?.type ||
    room?.checkinService?.method ||
    room?.checkinService ||
    room?.checkInService ||
    room?.checkinMethod ||
    "";

  const fees = room?.fees || {};

  return {
    name: room?.name || "",
    code: room?.code || "",
    roomRange: room?.roomRange || "",

    roomCounts: {
      bedrooms: roomCounts?.bedrooms || room?.bedrooms || "",
      bathrooms: roomCounts?.bathrooms || room?.bathrooms || "",
      kitchens: roomCounts?.kitchens || "",
      livingRooms: roomCounts?.livingRooms || "",
      carparks: roomCounts?.carparks || room?.carparks || "",
    },

    maxGuests: toNumberString(maxGuests),
    bedType,
    bedCount: toNumberString(bedCount),

    smoking: String(smoking || ""),
    breakfast: String(breakfast || ""),
    petPolicy: String(petPolicy || ""),
    freeCancel: String(freeCancel || ""),
    checkinService: String(checkinService || ""),

    serviceFee:
      fees?.serviceFee?.value ||
      room?.serviceFee ||
      "",
    cleaningFee:
      fees?.cleaningFee?.value ||
      room?.cleaningFee ||
      "",
    deposit:
      fees?.deposit?.value ||
      room?.deposit ||
      "",
    otherFee:
      fees?.otherFee?.value ||
      room?.otherFee ||
      "",

    extraSpaces: Array.isArray(room?.extraSpaces) ? room.extraSpaces : [],
    furniture: Array.isArray(room?.furniture) ? room.furniture : [],
    facilities: Array.isArray(room?.facilities) ? room.facilities : [],
    availability: room?.availability || {},
    photos: room?.photos || [],
    layoutPhotos: room?.layoutPhotos || [],
  };
}

function buildVmReadyRoom(room = {}) {
  const roomCounts = room?.roomCounts || {};
  const bedLabel = String(room?.bedType || "").trim();
  const bedCountNum = Number(room?.bedCount || 1);

  return {
    name: room?.name || "",
    code: room?.code || "",
    roomRange: room?.roomRange || "",

    roomCounts: {
      bedrooms: roomCounts?.bedrooms || "",
      bathrooms: roomCounts?.bathrooms || "",
      kitchens: roomCounts?.kitchens || "",
      livingRooms: roomCounts?.livingRooms || "",
      carparks: roomCounts?.carparks || "",
    },

    maxGuests: room?.maxGuests || "",
    guestCount: room?.maxGuests || "",

    bedType: room?.bedType || "",
    roomBedType: room?.bedType || "",
    unitBedType: room?.bedType || "",

    beds: bedLabel
      ? [{ label: bedLabel, count: bedCountNum > 0 ? String(bedCountNum) : "1" }]
      : [],

    guests: {
      adults: room?.maxGuests ? String(room.maxGuests) : "",
      children: "0",
    },

    smoking: room?.smoking || "",
    smokingAllowed: room?.smoking || "",

    breakfast: room?.breakfast || "",
    breakfastIncluded: room?.breakfast || "",

    petPolicy: room?.petPolicy
      ? { type: room.petPolicy }
      : null,
    petAllowed: room?.petPolicy || "",

    cancellationPolicy: room?.freeCancel
      ? { type: room.freeCancel }
      : null,
    freeCancel: room?.freeCancel || "",

    checkinService: room?.checkinService
      ? { type: room.checkinService, method: room.checkinService }
      : null,

    fees: {
      serviceFee: room?.serviceFee
        ? { value: room.serviceFee, mode: "percent" }
        : null,
      cleaningFee: room?.cleaningFee
        ? { value: room.cleaningFee, mode: "money" }
        : null,
      deposit: room?.deposit
        ? { value: room.deposit, mode: "money" }
        : null,
      otherFee: room?.otherFee
        ? { value: room.otherFee, mode: "money" }
        : null,
    },

    serviceFee: room?.serviceFee || "",
    cleaningFee: room?.cleaningFee || "",
    deposit: room?.deposit || "",
    otherFee: room?.otherFee || "",

    extraSpaces: Array.isArray(room?.extraSpaces) ? room.extraSpaces : [],
    furniture: Array.isArray(room?.furniture) ? room.furniture : [],
    facilities: Array.isArray(room?.facilities) ? room.facilities : [],

    availability: room?.availability || {},
    photos: room?.photos || [],
    layoutPhotos: room?.layoutPhotos || [],
  };
}

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
  const safeRoom = normalizeRoom(room);
  const roomCounts = safeRoom.roomCounts || {};
  const extraSpaces = safeRoom.extraSpaces || [];
  const furniture = safeRoom.furniture || [];
  const facilities = safeRoom.facilities || [];
  const photos = safeRoom.photos || [];
  const availability = safeRoom.availability || {};
  const layoutPhotos = safeRoom.layoutPhotos || [];

  const updateRoom = (patch) => {
    onChange?.({ ...safeRoom, ...patch });
  };

  const handleRoomCountsChange = (patch) => {
    updateRoom({
      roomCounts: {
        ...roomCounts,
        ...patch,
      },
    });
  };

  const photoConfig = {
    bedrooms: roomCounts.bedrooms || "",
    bathrooms: roomCounts.bathrooms || "",
    kitchens: roomCounts.kitchens || "",
    livingRooms: roomCounts.livingRooms || "",
    carpark: roomCounts.carparks || "",
    extraSpaces,
    facilities,
    furniture,
    orientation: [],
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white space-y-4 mt-4">
      <h3 className="font-semibold">房型 {index + 1}</h3>

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

      <RoomCountSelector
        value={{
          bedrooms: roomCounts.bedrooms || "",
          bathrooms: roomCounts.bathrooms || "",
          kitchens: roomCounts.kitchens || "",
          livingRooms: roomCounts.livingRooms || "",
        }}
        onChange={handleRoomCountsChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div>
          <label className="block text-sm font-medium mb-1">床型</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.bedType || ""}
            onChange={(e) => updateRoom({ bedType: e.target.value })}
          >
            <option value="">请选择床型</option>
            {BED_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">此房型床数量</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded p-2"
          placeholder="例如：1 / 2"
          value={safeRoom.bedCount || ""}
          onChange={(e) => updateRoom({ bedCount: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">室内能否吸烟</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.smoking || ""}
            onChange={(e) => updateRoom({ smoking: e.target.value })}
          >
            {SMOKING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">入住服务</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.checkinService || ""}
            onChange={(e) => updateRoom({ checkinService: e.target.value })}
          >
            {CHECKIN_SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value || "blank"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">房型是否包含早餐</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.breakfast || ""}
            onChange={(e) => updateRoom({ breakfast: e.target.value })}
          >
            {YES_NO_OPTIONS.map((opt) => (
              <option key={opt.value || "blank"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">房型是否允许宠物入住</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.petPolicy || ""}
            onChange={(e) => updateRoom({ petPolicy: e.target.value })}
          >
            {PET_POLICY_OPTIONS.map((opt) => (
              <option key={opt.value || "blank"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">是否能免费取消</label>
          <select
            className="w-full border rounded p-2"
            value={safeRoom.freeCancel || ""}
            onChange={(e) => updateRoom({ freeCancel: e.target.value })}
          >
            {FREE_CANCEL_OPTIONS.map((opt) => (
              <option key={opt.value || "blank"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">服务费（%）</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            placeholder="例如：10"
            value={safeRoom.serviceFee || ""}
            onChange={(e) => updateRoom({ serviceFee: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">清洁费（RM）</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            placeholder="例如：80"
            value={safeRoom.cleaningFee || ""}
            onChange={(e) => updateRoom({ cleaningFee: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">押金（RM）</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            placeholder="例如：200"
            value={safeRoom.deposit || ""}
            onChange={(e) => updateRoom({ deposit: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">其它费用（RM）</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded p-2"
            placeholder="例如：50"
            value={safeRoom.otherFee || ""}
            onChange={(e) => updateRoom({ otherFee: e.target.value })}
          />
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-1">
          此房型可租日期 / 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={availability}
          onChange={(val) => updateRoom({ availability: val })}
        />
      </div>

      <LayoutBlueprintUpload
        value={layoutPhotos}
        onChange={(val) => updateRoom({ layoutPhotos: val })}
      />

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

export default function HotelUploadForm({
  singleFormData = {},
  setSingleFormData,
}) {
  const [hotelType, setHotelType] = useState(normalizeTopLevelHotelType(singleFormData));
  const [roomTypes, setRoomTypes] = useState(
    normalizeRoomArray(singleFormData).map(normalizeRoom)
  );
  const [hotelAvailability, setHotelAvailability] = useState(
    normalizeAvailability(singleFormData)
  );

  useEffect(() => {
    setHotelType(normalizeTopLevelHotelType(singleFormData));
    setRoomTypes(normalizeRoomArray(singleFormData).map(normalizeRoom));
    setHotelAvailability(normalizeAvailability(singleFormData));
  }, [singleFormData]);

  useEffect(() => {
    if (typeof setSingleFormData !== "function") return;

    const vmReadyRooms = roomTypes.map(buildVmReadyRoom);

    setSingleFormData((prev) => ({
      ...(prev || {}),

      hotelType,
      hotelResortType: hotelType,
      stayType: hotelType,

      availability: hotelAvailability,

      roomTypes: vmReadyRooms,
      rooms: vmReadyRooms,
      roomLayouts: vmReadyRooms,
    }));
  }, [hotelType, roomTypes, hotelAvailability, setSingleFormData]);

  const addRoomType = () => {
    setRoomTypes((prev) => [
      ...prev,
      normalizeRoom({
        name: "",
        code: "",
        roomRange: "",
        roomCounts: {
          bedrooms: "",
          bathrooms: "",
          kitchens: "",
          livingRooms: "",
          carparks: "",
        },
        maxGuests: "",
        bedType: "",
        bedCount: "1",
        smoking: "",
        breakfast: "",
        petPolicy: "",
        freeCancel: "",
        checkinService: "",
        serviceFee: "",
        cleaningFee: "",
        deposit: "",
        otherFee: "",
        extraSpaces: [],
        furniture: [],
        facilities: [],
        availability: {},
        photos: [],
        layoutPhotos: [],
      }),
    ]);
  };

  const updateRoomType = (index, updated) => {
    setRoomTypes((prev) => {
      const next = [...prev];
      next[index] = normalizeRoom(updated);
      return next;
    });
  };

  return (
    <div className="space-y-4 mt-6">
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

      <div>
        <label className="block text-sm font-medium mb-1">
          整体酒店 / 度假村可租日期 & 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={hotelAvailability}
          onChange={setHotelAvailability}
        />
      </div>

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
