"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";

import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FacingSelector from "@/components/FacingSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";
import TransitSelector from "@/components/TransitSelector";
import RoomRentalForm from "@/components/RoomRentalForm";

import { normalizeLayoutsFromUnitTypeSelector } from "../utils/layoutNormalize";
import { pickCommon, commonHash } from "../utils/commonFields";
import useProjectCommonSync from "../hooks/useProjectCommonSync";

export default function UploadPropertyPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    propertyStatus: "", // sale / rent / homestay / hotel
    saleType: "",
    category: "",
    subType: [],
    tenure: "",
    usage: "",
    storeys: "",
    affordableScheme: "",

    homestayType: "",
    hotelResortType: "",

    isRoomRental: false,
  });

  // 单一房源的字段
  const [single, setSingle] = useState({
    area: null,
    price: { min: "", max: "" },
    bedroomCount: "",
    bathroomCount: "",
    carparkCount: "",
    storeRoomCount: "",
    extraSpaces: [],
    furniture: [],
    facilities: [],
    facing: [],
    buildYear: "",
    carparkLevel: "",
    walkToTransit: false,
    transitLines: [],
    transitStations: [],
    transitNotes: "",
    images: {},
    description: "",
  });

  // project layouts
  const [unitLayouts, setUnitLayouts] = useState([]);

  // 是否启用 “项目自动复制 common”
  const [enableProjectAutoCopy, setEnableProjectAutoCopy] = useState(true);

  // 把 common 同步逻辑抽出去（保持你原先行为）
  useProjectCommonSync({
    enabled: enableProjectAutoCopy,
    unitLayouts,
    setUnitLayouts,
  });

  // 当 saleType 进入项目模式时，确保 unitLayouts 至少有一个
  useEffect(() => {
    const isProject =
      formData.saleType === "New Project (Developer)" ||
      formData.saleType === "Completed Unit (Developer)";

    if (!isProject) return;

    setUnitLayouts((prev) => {
      const arr = normalizeLayoutsFromUnitTypeSelector(prev);
      if (arr.length > 0) return arr;
      return normalizeLayoutsFromUnitTypeSelector([{}]);
    });
  }, [formData.saleType]);

  const isProject =
    formData.saleType === "New Project (Developer)" ||
    formData.saleType === "Completed Unit (Developer)";

  // 处理单一房源更新
  const updateSingle = (patch) => {
    setSingle((prev) => ({ ...(prev || {}), ...patch }));
  };

  // 处理 layout 更新（关键：保留 meta，不改你原本的复制/脱钩机制）
  const handleLayoutChange = (idx, updatedLayout, meta) => {
    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      arr[idx] = updatedLayout;

      // meta.commonField：代表这个字段属于 common，可用于同步/脱钩
      if (meta?.commonField) {
        const key = meta.commonField;

        // 如果用户在某个 layout（不是第一个）手动改了 common 字段，则视为“脱钩”
        if (idx !== 0) {
          arr[idx]._inheritCommon = arr[idx]._inheritCommon || {};
          arr[idx]._inheritCommon[key] = false;
        }
      }

      return arr;
    });
  };

  const onSubmit = async () => {
    try {
      const payload = {
        ...formData,
      };

      if (isProject) {
        payload.unitLayouts = unitLayouts;
      } else {
        payload.single = single;
      }

      // 你原本写入 supabase 的逻辑保持不动：这里只给一个示例写法
      const { error } = await supabase.from("properties").insert([
        {
          payload,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("上传成功！");
      router.push("/");
    } catch (e) {
      toast.error(e?.message || "上传失败");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-2xl font-bold mb-4">上传房源</div>

      {/* 顶部 TypeSelector */}
      <div className="mb-6">
        <TypeSelector formData={formData} setFormData={setFormData} />
      </div>

      {/* 项目模式：选择 layouts 数量 */}
      <UnitTypeSelector
        saleType={formData.saleType}
        unitLayouts={unitLayouts}
        setUnitLayouts={setUnitLayouts}
      />

      {/* 项目模式：自动复制开关（保留你现有功能，只是 UI 简化） */}
      {isProject && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">项目：自动复制 common（复制/脱钩功能）</label>
          <select
            className="w-full border rounded p-2"
            value={enableProjectAutoCopy ? "yes" : "no"}
            onChange={(e) => setEnableProjectAutoCopy(e.target.value === "yes")}
          >
            <option value="yes">开启</option>
            <option value="no">关闭</option>
          </select>
        </div>
      )}

      {/* 项目模式：渲染 layouts */}
      {isProject ? (
        <div className="mb-6">
          {unitLayouts.map((l, idx) => (
            <UnitLayoutForm
              key={l._uiId || idx}
              index={idx}
              data={l}
              onChange={(updated, meta) => handleLayoutChange(idx, updated, meta)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-6">
          {/* 单一房源表单（保持你原本组件组合，不改逻辑） */}
          <div className="border rounded p-4 bg-white mb-4">
            <AreaSelector value={single.area} onChange={(v) => updateSingle({ area: v })} />
            <div className="mt-3">
              <PriceInput value={single.price} onChange={(v) => updateSingle({ price: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <RoomCountSelector
                label="房间数量 / Bedroom"
                value={single.bedroomCount}
                onChange={(v) => updateSingle({ bedroomCount: v })}
              />
              <RoomCountSelector
                label="浴室数量 / Bathroom"
                value={single.bathroomCount}
                onChange={(v) => updateSingle({ bathroomCount: v })}
              />
              <CarparkCountSelector
                value={single.carparkCount}
                onChange={(v) => updateSingle({ carparkCount: v })}
              />
              <RoomCountSelector
                label="储藏室数量 / Store Room"
                value={single.storeRoomCount}
                onChange={(v) => updateSingle({ storeRoomCount: v })}
              />
            </div>

            <div className="mt-3">
              <CarparkLevelSelector
                value={single.carparkLevel}
                onChange={(v) => updateSingle({ carparkLevel: v })}
              />
            </div>

            <div className="mt-3">
              <ExtraSpacesSelector
                value={single.extraSpaces}
                onChange={(v) => updateSingle({ extraSpaces: v })}
              />
            </div>

            <div className="mt-3">
              <FurnitureSelector
                value={single.furniture}
                onChange={(v) => updateSingle({ furniture: v })}
              />
            </div>

            <div className="mt-3">
              <FacilitiesSelector
                value={single.facilities}
                onChange={(v) => updateSingle({ facilities: v })}
              />
            </div>

            <div className="mt-3">
              <FacingSelector
                value={single.facing}
                onChange={(v) => updateSingle({ facing: v })}
              />
            </div>

            <div className="mt-3">
              <BuildYearSelector
                value={single.buildYear}
                onChange={(v) => updateSingle({ buildYear: v })}
              />
            </div>

            {/* Room Rental */}
            {formData.isRoomRental && (
              <div className="mt-4">
                <RoomRentalForm
                  value={single.roomRental}
                  onChange={(v) => updateSingle({ roomRental: v })}
                />
              </div>
            )}

            <div className="mt-3">
              <TransitSelector
                value={{
                  walkToTransit: !!single.walkToTransit,
                  transitLines: single.transitLines || [],
                  transitStations: single.transitStations || [],
                  transitNotes: single.transitNotes || "",
                }}
                onChange={(v) =>
                  updateSingle({
                    walkToTransit: !!v.walkToTransit,
                    transitLines: v.transitLines || [],
                    transitStations: v.transitStations || [],
                    transitNotes: v.transitNotes || "",
                  })
                }
              />
            </div>

            <div className="mt-3">
              <ImageUpload
                config={{
                  bedroomCount: single.bedroomCount,
                  bathroomCount: single.bathroomCount,
                  carparkCount: single.carparkCount,
                  storeRoomCount: single.storeRoomCount,
                  extraSpaces: single.extraSpaces,
                  facilities: single.facilities,
                  furniture: single.furniture,
                  facing: single.facing,
                }}
                images={single.images}
                setImages={(imgs) => updateSingle({ images: imgs })}
              />
            </div>

            <div className="mt-3">
              <label className="font-semibold block mb-1">房源描述 / Description</label>
              <textarea
                className="w-full border rounded p-2 min-h-[90px]"
                value={single.description || ""}
                onChange={(e) => updateSingle({ description: e.target.value })}
                placeholder="写一些卖点..."
              />
            </div>
          </div>
        </div>
      )}

      <Button onClick={onSubmit}>提交 / Submit</Button>
    </div>
  );
}
