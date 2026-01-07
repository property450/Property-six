// components/forms/RentUploadForm.js
"use client";

import { useEffect, useMemo, useState } from "react";

import RoomCountSelector from "@/components/RoomCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import TransitSelector from "@/components/TransitSelector";

import RoomRentalForm from "@/components/RoomRentalForm";

// 生成 N 个房间数据
const makeRooms = (n) =>
  Array.from({ length: n }).map((_, i) => ({
    id: `room_${i}_${Date.now()}`,
    data: {},
  }));

export default function RentUploadForm({
  saleType,
  computedStatus,
  isRoomRental,
  roomRentalMode,

  singleFormData,
  setSingleFormData,

  areaData,
  setAreaData,

  description,
  setDescription,
}) {
  // ✅ 你截图里的：是否只有一个房间？（yes/no）
  const [onlyOneRoom, setOnlyOneRoom] = useState("no"); // yes / no
  const [roomCount, setRoomCount] = useState(0);
  const [roomForms, setRoomForms] = useState([]);

  // ✅ 当切换到「整间出租」就清掉房间表单
  useEffect(() => {
    if (!isRoomRental) {
      setOnlyOneRoom("no");
      setRoomCount(0);
      setRoomForms([]);
      return;
    }
    // 房间出租模式：默认让它走“多个房间”（符合你截图的流程）
    if (onlyOneRoom === "yes") {
      setRoomCount(1);
      setRoomForms(makeRooms(1));
    } else {
      // 多个房间：等用户选数量
      if (roomCount <= 0) {
        setRoomForms([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoomRental]);

  // ✅ 用户改数量 → 自动生成对应数量表单（你要的核心）
  useEffect(() => {
    if (!isRoomRental) return;

    if (onlyOneRoom === "yes") {
      if (roomForms.length !== 1) setRoomForms(makeRooms(1));
      if (roomCount !== 1) setRoomCount(1);
      return;
    }

    // 多房间
    const n = Number(roomCount || 0);
    if (!Number.isFinite(n) || n <= 0) {
      setRoomForms([]);
      return;
    }

    setRoomForms((prev) => {
      // 保留已有已填数据（避免用户改数量时全丢）
      const next = makeRooms(n).map((r, idx) => {
        const old = prev[idx];
        return old ? { ...r, data: old.data || {} } : r;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCount, onlyOneRoom, isRoomRental]);

  const updateRoomData = (index, patch) => {
    setRoomForms((prev) => {
      const next = [...prev];
      const cur = next[index] || { id: `room_${index}`, data: {} };
      next[index] = { ...cur, data: { ...(cur.data || {}), ...(patch || {}) } };
      return next;
    });
  };

  const isMultipleRooms = isRoomRental && onlyOneRoom === "no";

  return (
    <div className="space-y-4 mt-4">
      {/* ✅ 房间出租模式：出现房间表单（修复点） */}
      {isRoomRental ? (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-white space-y-3">
            <label className="block text-sm font-medium text-gray-700">是否只有一个房间？</label>
            <select
              className="border rounded w-full p-2"
              value={onlyOneRoom}
              onChange={(e) => {
                const v = e.target.value;
                setOnlyOneRoom(v);
                if (v === "yes") {
                  setRoomCount(1);
                  setRoomForms(makeRooms(1));
                } else {
                  setRoomCount(0);
                  setRoomForms([]);
                }
              }}
            >
              <option value="yes">是的，只有一个房间</option>
              <option value="no">不是，有多个房间</option>
            </select>

            {/* 多房间 → 选择数量 */}
            {isMultipleRooms && (
              <RoomCountSelector label="选择房间数量" value={roomCount} onChange={setRoomCount} />
            )}
          </div>

          {/* ✅ 多房间表单渲染：关键 .map() 在这里 */}
          {roomForms.length > 0 &&
            roomForms.map((room, index) => (
              <div key={room.id} className="space-y-2">
                <div className="text-lg font-semibold">房间 {index + 1}</div>

                <RoomRentalForm
                  value={room.data}
                  onChange={(updated) => updateRoomData(index, updated)}
                  extraSection={
                    <div className="space-y-4 mt-4">
                      <ExtraSpacesSelector
                        value={room.data.extraSpaces || []}
                        onChange={(v) => updateRoomData(index, { extraSpaces: v })}
                      />
                      <FurnitureSelector
                        value={room.data.furniture || []}
                        onChange={(v) => updateRoomData(index, { furniture: v })}
                      />
                      <FacilitiesSelector
                        value={room.data.facilities || []}
                        onChange={(v) => updateRoomData(index, { facilities: v })}
                      />
                      <TransitSelector
                        value={room.data.transit || null}
                        onChange={(v) => updateRoomData(index, { transit: v })}
                      />
                    </div>
                  }
                />
              </div>
            ))}

          {/* 如果用户还没选数量，给个提示（不影响你设计，只是避免空白） */}
          {isMultipleRooms && roomCount <= 0 && (
            <div className="text-sm text-gray-600">请选择房间数量后，会自动出现对应的房间表单。</div>
          )}
        </div>
      ) : (
        /* ✅ 非房间出租（整间出租）：这里保持最少干预，不破坏你其它逻辑
           你原本的整间出租表单若在其它文件里，这里不会影响。
           如果你也要我把整间出租完整 UI 合并进来，你再把你之前的 RentUploadForm 旧版发我，我帮你无损合并。
        */
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-sm text-gray-700">
            当前是整间出租（Whole Unit）。房间出租表单仅在选择 Room Rental 时显示。
          </div>
        </div>
      )}
    </div>
  );
}
