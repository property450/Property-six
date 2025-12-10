// components/hotel/HotelUploadForm.js
"use client";

import { useState } from "react";
import HotelRoomTypeForm from "./HotelRoomTypeForm";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";

// 根据你自己的默认结构改
const createEmptyRoomLayout = () => ({
  name: "",
  // 卧室 / 房间
  bedrooms: 0,
  // 浴室 / 卫生间
  bathrooms: 0,
  // 厨房 / 客厅 / 额外空间（如果你是用 selector 或 number，照你的字段名改）
  kitchens: 0,
  livingRooms: 0,
  extraSpaces: [],

  // 设施类
  indoorFacilities: [],
  bathroomFacilities: [],
  kitchenFacilities: [],
  otherFacilities: [],
  view: [],
  otherServices: {
    tags: [],
    note: "",
  },

  // 费用类
  serviceFee: "",
  cleaningFee: "",
  deposit: "",
  otherFee: {
    amount: "",
    note: "",
  },
});

// 这些字段会从第一个表单复制到其它表单
const SHARED_KEYS = [
  "bedrooms",
  "bathrooms",
  "kitchens",
  "livingRooms",
  "extraSpaces",
  "indoorFacilities",
  "bathroomFacilities",
  "kitchenFacilities",
  "otherFacilities",
  "view",
  "otherServices",
  "serviceFee",
  "cleaningFee",
  "deposit",
  "otherFee",
];

export default function HotelUploadForm() {
  const [roomCount, setRoomCount] = useState(1);
  const [roomLayouts, setRoomLayouts] = useState([createEmptyRoomLayout()]);

  // 酒店/度假屋公共设施或卖点图片（所有房型共用）
  const [facilityImages, setFacilityImages] = useState({});

  // 改变房型数量
  const handleRoomCountChange = (count) => {
    const n = Number(count) || 1;
    setRoomCount(n);

    setRoomLayouts((prev) => {
      const arr = [...prev];
      if (arr.length < n) {
        // 不够就补空表单
        while (arr.length < n) {
          arr.push(createEmptyRoomLayout());
        }
      } else if (arr.length > n) {
        // 多了就裁掉后面
        arr.length = n;
      }
      return arr;
    });
  };

  // 单个房型表单更新
  const handleRoomLayoutChange = (index, patch) => {
    setRoomLayouts((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...patch };
      next[index] = updated;

      // 🟡 如果是第一个房型被修改，就把共享字段复制到其它房型
      if (index === 0 && next.length > 1) {
        const shared = {};
        SHARED_KEYS.forEach((key) => {
          shared[key] = updated[key];
        });

        for (let i = 1; i < next.length; i++) {
          next[i] = {
            ...next[i],
            ...shared,
          };
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      roomLayouts,
      facilityImages,
    };

    console.log("提交数据", payload);
    // 这里按你原本的逻辑 insert 到 supabase 即可
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 房型数量选择框 - 你可以换成自己的 UI */}
      <div>
        <label className="block font-medium mb-1">
          这个 Homestay / Hotel 有多少个房型 / layout？
        </label>
        <input
          type="number"
          min={1}
          value={roomCount}
          onChange={(e) => handleRoomCountChange(e.target.value)}
          className="border rounded px-3 py-2 w-32"
        />
      </div>

      {/* 每个房型的表单 */}
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

      {/* 4️⃣ 这个酒店/度假屋的公共设施 / 卖点照片（所有房型共用） */}
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
            multiple: true, // ✅ 支持多选照片
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
