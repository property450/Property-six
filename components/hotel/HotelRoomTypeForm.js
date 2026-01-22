// components/hotel/HotelRoomTypeForm.js
"use client";

import RoomCountSelector from "@/components/RoomCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import ImageUpload from "@/components/ImageUpload";
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";

import BedSelector from "./BedSelector";
import GuestSelector from "./GuestSelector";
import SmokingSelector from "./SmokingSelector";
import CheckinServiceSelector from "./CheckinServiceSelector";
import BreakfastSelector from "./BreakfastSelector";
import CancellationPolicySelector from "./CancellationPolicySelector";

import IndoorFacilitiesSelector from "./IndoorFacilitiesSelector";
import BathroomFacilitiesSelector from "./BathroomFacilitiesSelector";
import KitchenFacilitiesSelector from "./KitchenFacilitiesSelector";
import OtherFacilitiesSelector from "./OtherFacilitiesSelector";
import ViewSelector from "./ViewSelector";
import OtherServicesSelector from "./OtherServicesSelector";

import ServiceFeeInput from "./ServiceFeeInput";
import CleaningFeeInput from "./CleaningFeeInput";
import DepositInput from "./DepositInput";
import OtherFeeInput from "./OtherFeeInput";
import PetPolicySelector from "./PetPolicySelector";

// ✅ 新增：停车位数量（只为放在客厅下面）
import CarparkCountSelector from "@/components/CarparkCountSelector";

export default function HotelRoomTypeForm({ index, total, data, onChange }) {
  const safeRoom = data || {};

  const roomCounts = safeRoom.roomCounts || {};
  const extraSpaces = safeRoom.extraSpaces || [];

  const updateRoom = (patch) => {
    onChange?.({ ...safeRoom, ...patch });
  };

  const updateRoomCounts = (patch) => {
    updateRoom({
      roomCounts: {
        ...roomCounts,
        ...patch,
      },
    });
  };

  const fees =
    safeRoom.fees || {
      serviceFee: { mode: "free", value: "" },
      cleaningFee: { mode: "free", value: "" },
      deposit: { mode: "free", value: "" },
      otherFee: { amount: "", note: "" },
    };

  const availability = safeRoom.availability || {};
  const photos = safeRoom.photos || {};

  const otherServices =
    safeRoom.otherServices || {
      tags: [],
      note: "",
    };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white space-y-4 mt-6">
      <h3 className="font-semibold text-lg mb-2">
        房型 {index + 1} / {total}
      </h3>

      {/* 房型名称 / 代码 / 房号范围 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium mb-1">
            房型代码（可选）
          </label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：DLX-KING"
            value={safeRoom.code || ""}
            onChange={(e) => updateRoom({ code: e.target.value })}
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            房号范围（可选）
          </label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="例如：101–110"
            value={safeRoom.roomRange || ""}
            onChange={(e) => updateRoom({ roomRange: e.target.value })}
          />
        </div>
      </div>

      <BedSelector
        value={safeRoom.beds || []}
        onChange={(val) => updateRoom({ beds: val })}
      />

      <GuestSelector
        value={safeRoom.guests || { adults: "", children: "" }}
        onChange={(val) => updateRoom({ guests: val })}
      />

      <SmokingSelector
        value={safeRoom.smoking || ""}
        onChange={(val) => updateRoom({ smoking: val })}
      />

      <CheckinServiceSelector
        value={safeRoom.checkinService || {}}
        onChange={(val) => updateRoom({ checkinService: val })}
      />

      <BreakfastSelector
        value={safeRoom.breakfast || ""}
        onChange={(val) => updateRoom({ breakfast: val })}
      />

      <PetPolicySelector
        value={safeRoom.petPolicy || { type: "", note: "" }}
        onChange={(val) => updateRoom({ petPolicy: val })}
      />

      <CancellationPolicySelector
        value={safeRoom.cancellationPolicy || { type: "", condition: "" }}
        onChange={(val) => updateRoom({ cancellationPolicy: val })}
      />

      {/* ======= 数量：卧室 / 浴室 / 厨房 / 客厅 ======= */}
      <div className="mt-4 space-y-2">
        <p className="font-semibold text-sm">
          这个房型的卧室 / 房间、浴室 / 卫生间、厨房、客厅、停车位数量
        </p>

        <RoomCountSelector
          value={{
            bedrooms: roomCounts.bedrooms || "",
            bathrooms: roomCounts.bathrooms || "",
            kitchens: roomCounts.kitchens || "",
            livingRooms: roomCounts.livingRooms || "",
          }}
          onChange={updateRoomCounts}
        />

        {/* ✅ 停车位数量：严格放在“客厅”下面 */}
        <CarparkCountSelector
          value={roomCounts.carparks || ""}
          onChange={(v) =>
            updateRoomCounts({
              carparks: v,
            })
          }
        />
      </div>

      {/* 额外空间 */}
      <div className="mt-2">
        <ExtraSpacesSelector
          variant="remark"
          value={extraSpaces}
          onChange={(val) => updateRoom({ extraSpaces: val })}
        />
      </div>

      <IndoorFacilitiesSelector
        value={safeRoom.indoorFacilities || []}
        onChange={(val) => updateRoom({ indoorFacilities: val })}
      />

      <BathroomFacilitiesSelector
        value={safeRoom.bathroomFacilities || []}
        onChange={(val) => updateRoom({ bathroomFacilities: val })}
      />

      <KitchenFacilitiesSelector
        value={safeRoom.kitchenFacilities || []}
        onChange={(val) => updateRoom({ kitchenFacilities: val })}
      />

      <OtherFacilitiesSelector
        value={safeRoom.otherFacilities || []}
        onChange={(val) => updateRoom({ otherFacilities: val })}
      />

      <ViewSelector
        value={safeRoom.views || []}
        onChange={(val) => updateRoom({ views: val })}
      />

      <OtherServicesSelector
        value={otherServices}
        onChange={(val) => updateRoom({ otherServices: val })}
      />

      <div className="mt-4 space-y-3">
        <ServiceFeeInput
          value={fees.serviceFee}
          onChange={(val) =>
            updateRoom({ fees: { ...fees, serviceFee: val } })
          }
        />
        <CleaningFeeInput
          value={fees.cleaningFee}
          onChange={(val) =>
            updateRoom({ fees: { ...fees, cleaningFee: val } })
          }
        />
        <DepositInput
          value={fees.deposit}
          onChange={(val) =>
            updateRoom({ fees: { ...fees, deposit: val } })
          }
        />
        <OtherFeeInput
          value={fees.otherFee}
          onChange={(val) =>
            updateRoom({ fees: { ...fees, otherFee: val } })
          }
          label="这个房型的其它费用（含备注）"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          这个房型的可租日期 & 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
  value={formData.availability}
  onChange={(next) =>
    setFormData((prev) => ({ ...(prev || {}), availability: next }))
  }
/>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          上传房型照片
        </label>
        <ImageUpload
          config={{
            id: `room_${index}_photos`,
            label: "上传这个房型的照片",
            multiple: true,
          }}
          images={photos}
          setImages={(updated) => updateRoom({ photos: updated })}
        />
      </div>
    </div>
  );
}

