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
import OtherServicesSelector from "@/components/hotel/OtherServicesSelector";

import ServiceFeeInput from "./ServiceFeeInput";
import CleaningFeeInput from "./CleaningFeeInput";
import DepositInput from "./DepositInput";
import OtherFeeInput from "./OtherFeeInput";

export default function HotelRoomTypeForm({ index, room, onChange }) {
  const safeRoom = room || {};

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

  const fees = safeRoom.fees || {
    serviceFee: { mode: "free", value: "" },
    cleaningFee: { mode: "free", value: "" },
    deposit: { mode: "free", value: "" },
    otherFee: { mode: "free", value: "" },
  };

  const availability = safeRoom.availability || {};
  const photos = safeRoom.photos || [];

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white space-y-4 mt-6">
      <h3 className="font-semibold text-lg mb-2">房型 {index + 1}</h3>

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

      {/* 房型代码 & 房号范围（运营端用，先保留） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div>
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

      {/* 这个房型的床是什么床？ */}
      <BedSelector
        value={safeRoom.beds || []}
        onChange={(val) => updateRoom({ beds: val })}
      />

      {/* 这个房型能住几个人？ */}
      <GuestSelector
        value={safeRoom.guests || { adults: "", children: "" }}
        onChange={(val) => updateRoom({ guests: val })}
      />

      {/* 室内能否吸烟？ */}
      <SmokingSelector
        value={safeRoom.smoking || ""}
        onChange={(val) => updateRoom({ smoking: val })}
      />

      {/* 入住服务 */}
      <CheckinServiceSelector
        value={safeRoom.checkinService || {}}
        onChange={(val) => updateRoom({ checkinService: val })}
      />

      {/* 房型是否包含早餐 */}
      <BreakfastSelector
        value={safeRoom.breakfast || ""}
        onChange={(val) => updateRoom({ breakfast: val })}
      />

      {/* 是否能免费取消 */}
      <CancellationPolicySelector
        value={safeRoom.cancellationPolicy || { type: "", condition: "" }}
        onChange={(val) => updateRoom({ cancellationPolicy: val })}
      />

      {/* ======= 这个房型的卧室/浴室/厨房/客厅/车位/额外空间数量 ======= */}
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
      </div>

      {/* 这个房型的额外空间 */}
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">
          这个房型的额外空间
        </label>
        <ExtraSpacesSelector
          value={extraSpaces}
          onChange={(val) => updateRoom({ extraSpaces: val })}
        />
      </div>

      {/* ======= 六组带备注的设施选择 ======= */}
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

      {/* 其它服务（同样是标签+备注形式，可以暂时复用 OtherFacilitiesSelector 逻辑） */}
      <OtherServicesSelector
  value={layout.otherServices}
  onChange={(val) => updateLayout({ otherServices: val })}
/>

      {/* ======= 费用输入：服务费 / 清洁费 / 押金 / 其它费用 ======= */}
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
  value={layout.otherFee}
  onChange={(val) => updateLayout({ otherFee: val })}
  label="这个房型的其它费用"
/>
    </div>

      {/* ======= 日历：这个房型的可租日期 & 价格 ======= */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">
          这个房型的可租日期 & 价格（日历）
        </label>
        <AdvancedAvailabilityCalendar
          value={availability}
          onChange={(val) => updateRoom({ availability: val })}
        />
      </div>

      {/* ======= 房型照片上传：只需要一个通用上传框，多选 ======= */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">上传房型照片</label>
        <ImageUpload
          config={{}} // 不按卧室/浴室生成，只要一个通用上传
          images={photos}
          setImages={(updated) => updateRoom({ photos: updated })}
        />
      </div>
    </div>
  );
}
