// pages/upload-property.js
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
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [type, setType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");

  // 项目类房源的 layout 列表
  const [unitLayouts, setUnitLayouts] = useState([]);

  // ⭐ 新增：项目整体照片（和 Subsale 的 ImageUpload 对应）
  const [projectPhotos, setProjectPhotos] = useState([]);

  // 成交状态变化时：如果不是项目类，就清空房型 layouts
  useEffect(() => {
    const isProjectStatus =
      propertyStatus?.includes("New Project") ||
      propertyStatus?.includes("Under Construction") ||
      propertyStatus?.includes("Completed Unit") ||
      propertyStatus?.includes("Developer Unit");

    if (!isProjectStatus) {
      setUnitLayouts([]); // 切回 Subsale/Homestay 等非项目类时清空
      setProjectPhotos([]); // 同时清空项目照片
    }
  }, [propertyStatus]);

  // 普通单一房源的数据
  const [singleFormData, setSingleFormData] = useState({
    price: "",
    buildUp: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    store: "",
    facilities: [],
    furniture: [],
    extraSpaces: [],
    facing: "",
    photos: [],
    layoutPhotos: [],
    buildYear: "",
    quarter: "",
  });

  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  const [availability, setAvailability] = useState({});
  const [transitInfo, setTransitInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 当前是否是「项目类」房源（和 UnitTypeSelector 判定保持一致）
  const isProject =
    propertyStatus?.includes("New Project") ||
    propertyStatus?.includes("Under Construction") ||
    propertyStatus?.includes("Completed Unit") ||
    propertyStatus?.includes("Developer Unit");

  // 根据单一房源的配置生成图片上传配置
  const photoConfig = {
    bedrooms: singleFormData.bedrooms || "",
    bathrooms: singleFormData.bathrooms || "",
    kitchens: singleFormData.kitchens || "",
    livingRooms: singleFormData.livingRooms || "",
    carpark: singleFormData.carpark || "",
    extraSpaces: singleFormData.extraSpaces || [],
    facilities: singleFormData.facilities || [],
    furniture: singleFormData.furniture || [],
    orientation: singleFormData.facing || "",
    transit: transitInfo || null,
  };

  // 通用面积换算
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (
      u.includes("square meter") ||
      u.includes("sq m") ||
      u.includes("square metres")
    ) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // assume sqft
  };

  const handleAreaChange = (data) => {
    setAreaData(data);
  };

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(singleFormData.layoutPhotos || []), ...files];
    setSingleFormData({ ...singleFormData, layoutPhotos: newPhotos });
  };

  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      const { data: propertyData, error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            unit_layouts: JSON.stringify(
              unitLayouts.length > 0 ? unitLayouts : [singleFormData]
            ),
            price: singleFormData.price || undefined,
            address,
            lat: latitude,
            lng: longitude,
            user_id: user.id,
            type,
            build_year: singleFormData.buildYear,
            bedrooms: singleFormData.bedrooms,
            bathrooms: singleFormData.bathrooms,
            carpark: singleFormData.carpark,
            store: singleFormData.store,
            area: JSON.stringify(areaData),
            facilities: JSON.stringify(singleFormData.facilities || []),
            furniture: JSON.stringify(singleFormData.furniture || []),
            facing: singleFormData.facing,
            transit: JSON.stringify(transitInfo || {}),
            availability: JSON.stringify(availability || {}),
            // ❗这里暂时不写 projectPhotos，避免破坏现有表结构
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("房源上传成功");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("上传失败，请检查控制台");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      {/* 地址 */}
      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      {/* 类型 & 成交状态 */}
      <TypeSelector
        value={type}
        onChange={setType}
        onFormChange={(formData) => {
          const newStatus = formData?.propertyStatus || "";
          setPropertyStatus((prev) => {
            if (prev === newStatus) return prev;
            return newStatus;
          });
        }}
      />

      {/* ------------ 项目类房源 (New Project / Completed Unit) ------------ */}
      {isProject ? (
        <>
          {/* 这里有「这个项目有多少个房型？」的下拉 */}
          <UnitTypeSelector
            propertyStatus={propertyStatus}
            layouts={unitLayouts}
            onChange={(layouts) => setUnitLayouts(layouts)}
          />

          {/* 只有当选了房型数量之后，才显示下面所有内容 */}
          {unitLayouts.length > 0 && (
            <div className="space-y-4 mt-4">
              {unitLayouts.map((layout, index) => (
                <UnitLayoutForm
                  key={index}
                  index={index}
                  data={{ ...layout, projectType: propertyStatus }}
                  onChange={(updated) => {
                    console.log(
                      "UploadProperty 收到 UnitLayoutForm 更新:",
                      index,
                      updated
                    );
                    setUnitLayouts((prev) => {
                      const prevLayouts = prev && prev.length ? prev : unitLayouts;
                      const prevLayout = prevLayouts[index] || {};
                      const isSame =
                        JSON.stringify(prevLayout) === JSON.stringify(updated);
                      if (isSame) return prevLayouts;
                      const next = [...prevLayouts];
                      next[index] = updated;
                      return next;
                    });
                  }}
                />
              ))}

              {/* 项目整体的交通信息 */}
              <TransitSelector onChange={setTransitInfo} />

              {/* ⭐ 项目整体房源描述（和 Subsale 一样） */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  房源描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入房源详细描述..."
                  rows={4}
                  className="w-full border rounded-lg p-2 resize-y"
                />
              </div>

              {/* ⭐ 项目整体照片上传框（在描述下面） */}
              <ImageUpload
                images={projectPhotos}
                setImages={setProjectPhotos}
              />
            </div>
          )}
        </>
      ) : (
        /* ------------ 普通非项目房源：保持旧逻辑 ------------ */
        <div className="space-y-4 mt-6">
          <AreaSelector onChange={handleAreaChange} initialValue={areaData} />

          <PriceInput
            value={singleFormData.price}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, price: val }))
            }
            type={propertyStatus}
            area={{
              buildUp: convertToSqft(
                areaData.values.buildUp,
                areaData.units.buildUp
              ),
              land: convertToSqft(
                areaData.values.land,
                areaData.units.land
              ),
            }}
          />

          {/* 单一 / Subsale 房源的 PSF 显示 */}
          {(() => {
            try {
              const buildUpSqft = convertToSqft(
                areaData.values.buildUp,
                areaData.units.buildUp
              );
              const landSqft = convertToSqft(
                areaData.values.land,
                areaData.units.land
              );
              const totalAreaSqft = (buildUpSqft || 0) + (landSqft || 0);

              const priceVal = singleFormData.price;
              if (!totalAreaSqft || !priceVal) return null;

              const priceNum = Number(
                String(priceVal).replace(/,/g, "")
              );
              if (!priceNum || !isFinite(priceNum)) return null;

              const psf = priceNum / totalAreaSqft;

              return (
                <p className="text-sm text-gray-600 mt-1">
                  每平方英尺: RM{" "}
                  {psf.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              );
            } catch (e) {
              return null;
            }
          })()}

          {/* 非项目房源的卧室/浴室/厨房/客厅 */}
          <RoomCountSelector
            value={{
              bedrooms: singleFormData.bedrooms,
              bathrooms: singleFormData.bathrooms,
              kitchens: singleFormData.kitchens,
              livingRooms: singleFormData.livingRooms,
            }}
            onChange={(patch) =>
              setSingleFormData((prev) => ({ ...prev, ...patch }))
            }
          />

          {/* 非项目房源的车位 */}
          <CarparkCountSelector
            value={singleFormData.carpark}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, carpark: val }))
            }
            mode="single"
          />

          <ExtraSpacesSelector
            value={singleFormData.extraSpaces || []}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, extraSpaces: val }))
            }
          />

          <FacingSelector
            value={singleFormData.facing}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, facing: val }))
            }
          />

          <FurnitureSelector
            value={singleFormData.furniture}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, furniture: val }))
            }
          />

          <FacilitiesSelector
            value={singleFormData.facilities}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, facilities: val }))
            }
          />

          <TransitSelector onChange={setTransitInfo} />

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              房源描述
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入房源详细描述..."
              rows={4}
              className="w-full border rounded-lg p-2 resize-y"
            />
          </div>
        </div>
      )}

      {/* Homestay / Hotel 特殊可用性配置（保持不变） */}
      {(type?.includes("Homestay") || type?.includes("Hotel")) && (
        <>
          <AdvancedAvailabilityCalendar
            value={availability}
            onChange={setAvailability}
          />

          <CarparkLevelSelector
            value={singleFormData.carparkPosition}
            onChange={(val) =>
              setSingleFormData((prev) => ({
                ...prev,
                carparkPosition: val,
              }))
            }
            mode={isProject ? "range" : "single"}
          />

          <BuildYearSelector
            value={singleFormData.buildYear}
            onChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, buildYear: val }))
            }
            quarter={singleFormData.quarter}
            onQuarterChange={(val) =>
              setSingleFormData((prev) => ({ ...prev, quarter: val }))
            }
            showQuarter={propertyStatus === "New Project / Under Construction"}
          />
        </>
      )}

      {/* 公共图片上传 & 提交按钮（仅 Subsale / 单一房源 显示） */}
      {!isProject && (
        <ImageUpload
          config={photoConfig}
          images={singleFormData.photos}
          setImages={(updated) =>
            setSingleFormData((prev) => ({ ...prev, photos: updated }))
          }
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? "上传中..." : "提交房源"}
      </Button>
    </div>
  );
}
