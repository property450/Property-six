// components/HotelUploadForm.js
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

import AreaSelector from "./AreaSelector";
import RoomCountSelector from "./RoomCountSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import FurnitureSelector from "./FurnitureSelector";
import TransitSelector from "./TransitSelector";
import ImageUpload from "./ImageUpload";
import AdvancedAvailabilityCalendar from "./AdvancedAvailabilityCalendar";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

/* ------------------- 单个房型表单 ------------------- */
function HotelRoomTypeForm({ index, data, onChange, onRemove }) {
  const [room, setRoom] = useState(
    data || {
      name: "",
      maxGuests: "",
      bedConfig: "",
      area: {
        types: ["buildUp"],
        units: { buildUp: "square feet", land: "square feet" },
        values: { buildUp: "", land: "" },
      },
      roomCounts: { bedrooms: 1, bathrooms: 1, kitchens: 0, livingRooms: 0 },
      weekdayPrice: "",
      weekendPrice: "",
      includeBreakfast: "included",
      totalRooms: "",
      description: "",
      extraSpaces: [],
      facilities: [],
      furniture: [],
      availability: {},
      photos: {},
    }
  );

  const photoConfig = {
    bedrooms: room.roomCounts.bedrooms || "",
    bathrooms: room.roomCounts.bathrooms || "",
    kitchens: room.roomCounts.kitchens || "",
    livingRooms: room.roomCounts.livingRooms || "",
    carpark: "", // 通常酒店房型不单独计停车位
    extraSpaces: room.extraSpaces || [],
    facilities: room.facilities || [],
    furniture: room.furniture || [],
    orientation: [], // 房型一般不单独做朝向，你要也可以加
  };

  const update = (patch) => {
    const next = { ...room, ...patch };
    setRoom(next);
    onChange && onChange(next);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Room Type {index + 1}</h3>
        <button
          type="button"
          className="text-xs text-red-600 underline"
          onClick={onRemove}
        >
          删除这个房型
        </button>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">房型名称</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：Deluxe King Room"
            value={room.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">最大入住人数</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={room.maxGuests}
            onChange={(e) => update({ maxGuests: e.target.value })}
            placeholder="例如：2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">床型配置</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          placeholder="例如：1 King / 2 Single / 1 Queen + 1 Single"
          value={room.bedConfig}
          onChange={(e) => update({ bedConfig: e.target.value })}
        />
      </div>

      {/* 面积 & 房间数 */}
      <AreaSelector
        initialValue={room.area}
        onChange={(val) => update({ area: val })}
      />

      <RoomCountSelector
        value={room.roomCounts}
        onChange={(patch) =>
          update({ roomCounts: { ...room.roomCounts, ...patch } })
        }
      />

      {/* 价格 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">平日价格（每晚）</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">RM</span>
            <input
              type="number"
              className="flex-1 border rounded p-2"
              value={room.weekdayPrice}
              onChange={(e) => update({ weekdayPrice: e.target.value })}
              placeholder="例如：380"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">
            周末 / 旺日价格（可选）
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">RM</span>
            <input
              type="number"
              className="flex-1 border rounded p-2"
              value={room.weekendPrice}
              onChange={(e) => update({ weekendPrice: e.target.value })}
              placeholder="例如：450"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">是否含早餐</label>
          <select
            className="w-full border rounded p-2"
            value={room.includeBreakfast}
            onChange={(e) => update({ includeBreakfast: e.target.value })}
          >
            <option value="included">含早餐</option>
            <option value="not_included">不含早餐</option>
            <option value="optional">可加购早餐</option>
          </select>
        </div>
      </div>

      {/* 房间数量 / Availability */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">此房型总房间数</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={room.totalRooms}
            onChange={(e) => update({ totalRooms: e.target.value })}
            placeholder="例如：40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            可销售房数（可选，用于库存）
          </label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={room.sellableRooms || ""}
            onChange={(e) => update({ sellableRooms: e.target.value })}
            placeholder="例如：35"
          />
        </div>
      </div>

      <AdvancedAvailabilityCalendar
        value={room.availability}
        onChange={(val) => update({ availability: val })}
      />

      {/* 额外设施 & 家私（房型级别） */}
      <ExtraSpacesSelector
        value={room.extraSpaces}
        onChange={(val) => update({ extraSpaces: val })}
      />
      <FacilitiesSelector
        value={room.facilities}
        onChange={(val) => update({ facilities: val })}
      />
      <FurnitureSelector
        value={room.furniture}
        onChange={(val) => update({ furniture: val })}
      />

      {/* 房型描述 */}
      <div>
        <label className="block text-sm font-medium">房型描述</label>
        <textarea
          className="w-full border rounded p-2 resize-y"
          rows={3}
          value={room.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="介绍这个房型的亮点：景观、浴缸、阳台、适合什么客人等..."
        />
      </div>

      {/* 房型照片 */}
      <div>
        <label className="block text-sm font-medium mb-1">房型照片</label>
        <ImageUpload
          config={photoConfig}
          images={room.photos}
          setImages={(imgs) => update({ photos: imgs })}
        />
      </div>
    </div>
  );
}

/* ------------------- 整个酒店 / 度假村表单 ------------------- */
export default function HotelUploadForm({ onSubmit }) {
  // 酒店基本信息
  const [name, setName] = useState("");
  const [hotelType, setHotelType] = useState("");
  const [brand, setBrand] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [openingYear, setOpeningYear] = useState("");
  const [renovationYear, setRenovationYear] = useState("");

  // 地址
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // 公共设施
  const [facilities, setFacilities] = useState([]);
  const [extraSpaces, setExtraSpaces] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [parkingNote, setParkingNote] = useState("");

  // 酒店政策
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [breakfastNote, setBreakfastNote] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [smokingPolicy, setSmokingPolicy] = useState("");
  const [petPolicy, setPetPolicy] = useState("");

  // 交通 & 描述
  const [transitInfo, setTransitInfo] = useState(null);
  const [description, setDescription] = useState("");

  // 酒店照片
  const [hotelPhotos, setHotelPhotos] = useState({});
  const hotelPhotoConfig = {
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    extraSpaces,
    facilities,
    furniture,
    orientation: [],
  };

  // 房型列表
  const [roomTypes, setRoomTypes] = useState([]);

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLat(lat);
    setLng(lng);
    setAddress(address);
  };

  const addRoomType = () => {
    setRoomTypes((prev) => [...prev, {}]);
  };

  const updateRoomType = (index, data) => {
    setRoomTypes((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });
  };

  const removeRoomType = (index) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const payload = {
      formType: "hotel",
      name,
      hotelType,
      brand,
      totalRooms,
      openingYear,
      renovationYear,
      address,
      lat,
      lng,
      facilities,
      extraSpaces,
      furniture,
      parkingNote,
      policies: {
        checkInTime,
        checkOutTime,
        breakfastNote,
        cancellationPolicy,
        smokingPolicy,
        petPolicy,
      },
      transit: transitInfo,
      description,
      hotelPhotos,
      roomTypes,
    };

    if (onSubmit) {
      onSubmit(payload);
    } else {
      console.log("Hotel/Resort upload payload:", payload);
      alert("Hotel/Resort 表单数据已打印在控制台（暂未接 Supabase）");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Hotel / Resort 上传表单</h2>

      {/* 地址 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">位置 / 地址</label>
        <AddressSearchInput onLocationSelect={handleLocationSelect} />
        {address && (
          <p className="text-xs text-gray-600 mt-1">已选择地址：{address}</p>
        )}
      </div>

      {/* 基本信息 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">酒店基本信息</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">酒店 / 度假村名称</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Kuala Lumpur City Hotel &amp; Residences"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Hotel / Resort Type</label>
            <select
              className="w-full border rounded p-2"
              value={hotelType}
              onChange={(e) => setHotelType(e.target.value)}
            >
              <option value="">请选择 Hotel/Resort 类型</option>
              <option value="Budget Hotel">Budget Hotel</option>
              <option value="2-Star Hotel">2-Star Hotel</option>
              <option value="3-Star Hotel">3-Star Hotel</option>
              <option value="4-Star Hotel">4-Star Hotel</option>
              <option value="5-Star / Luxury Hotel">
                5-Star / Luxury Hotel
              </option>
              <option value="Business Hotel">Business Hotel</option>
              <option value="Boutique Hotel">Boutique Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Serviced Apartment Hotel">
                Serviced Apartment Hotel
              </option>
              <option value="Convention Hotel">Convention Hotel</option>
              <option value="Spa / Hot Spring Hotel">
                Spa / Hot Spring Hotel
              </option>
              <option value="Casino Hotel">Casino Hotel</option>
              <option value="Extended Stay Hotel">Extended Stay Hotel</option>
              <option value="Capsule Hotel">Capsule Hotel</option>
              <option value="Hostel / Backpacker Hotel">
                Hostel / Backpacker Hotel
              </option>
              <option value="Airport Hotel">Airport Hotel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">品牌（Brand，可选）</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如：Hilton, Marriott, Ibis..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">总房间数（大约）</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={totalRooms}
              onChange={(e) => setTotalRooms(e.target.value)}
              placeholder="例如：250"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              开业年份 / 最近翻新年份
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={openingYear}
                onChange={(e) => setOpeningYear(e.target.value)}
                placeholder="开业，例如：2010"
              />
              <input
                type="number"
                className="flex-1 border rounded p-2"
                value={renovationYear}
                onChange={(e) => setRenovationYear(e.target.value)}
                placeholder="翻新，例如：2019"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 公共设施 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">公共设施 & 配套</h3>
        <FacilitiesSelector value={facilities} onChange={setFacilities} />
        <ExtraSpacesSelector value={extraSpaces} onChange={setExtraSpaces} />
        <FurnitureSelector value={furniture} onChange={setFurniture} />

        <div>
          <label className="block text-sm font-medium">停车说明</label>
          <textarea
            className="w-full border rounded p-2 resize-y"
            rows={2}
            value={parkingNote}
            onChange={(e) => setParkingNote(e.target.value)}
            placeholder="例如：提供免费室内停车位 / 需额外收费 / 附近公共停车场等"
          />
        </div>
      </div>

      {/* 酒店政策 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">酒店政策</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">入住时间（Check-in）</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">退房时间（Check-out）</label>
            <input
              type="time"
              className="w-full border rounded p-2"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            早餐 / 用餐说明（可选）
          </label>
          <textarea
            className="w-full border rounded p-2 resize-y"
            rows={2}
            value={breakfastNote}
            onChange={(e) => setBreakfastNote(e.target.value)}
            placeholder="例如：大部分房型含自助早餐，额外早餐 RM 45/人等"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">取消政策（可选）</label>
          <textarea
            className="w-full border rounded p-2 resize-y"
            rows={2}
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
            placeholder="例如：入住前 48 小时可免费取消，之后将收取首晚房费等"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">吸烟政策（可选）</label>
            <textarea
              className="w-full border rounded p-2 resize-y"
              rows={2}
              value={smokingPolicy}
              onChange={(e) => setSmokingPolicy(e.target.value)}
              placeholder="例如：全馆禁烟，设有指定吸烟区等"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">宠物政策（可选）</label>
            <textarea
              className="w-full border rounded p-2 resize-y"
              rows={2}
              value={petPolicy}
              onChange={(e) => setPetPolicy(e.target.value)}
              placeholder="例如：不允许宠物 / 仅允许导盲犬 / 可带宠物需额外收费等"
            />
          </div>
        </div>
      </div>

      {/* 交通信息 */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">交通信息</h3>
        <TransitSelector onChange={setTransitInfo} />
      </div>

      {/* 酒店描述 */}
      <div className="space-y-2 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">酒店 / 度假村介绍</h3>
        <textarea
          className="w-full border rounded p-2 resize-y"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="整体介绍酒店定位、特色、周边、适合什么客人等..."
        />
      </div>

      {/* 酒店照片 */}
      <div className="space-y-2 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">酒店照片（外观 / 大堂 / 公共设施）</h3>
        <ImageUpload
          config={hotelPhotoConfig}
          images={hotelPhotos}
          setImages={setHotelPhotos}
        />
      </div>

      {/* 房型列表 */}
      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">房型 Room Types</h3>
          <Button
            type="button"
            onClick={addRoomType}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            + 添加房型
          </Button>
        </div>

        {roomTypes.length === 0 && (
          <p className="text-sm text-gray-500">
            还没有房型，请点击「添加房型」为酒店创建不同的 Room Type。
          </p>
        )}

        <div className="space-y-4">
          {roomTypes.map((rt, idx) => (
            <HotelRoomTypeForm
              key={idx}
              index={idx}
              data={rt}
              onChange={(data) => updateRoomType(idx, data)}
              onRemove={() => removeRoomType(idx)}
            />
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
      >
        提交 Hotel / Resort（暂时只打印数据）
      </Button>
    </div>
  );
}
