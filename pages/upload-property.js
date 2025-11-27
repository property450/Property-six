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

  // ⭐ 房型 / Layout 列表
  const [unitLayouts, setUnitLayouts] = useState([]);
  console.log("unitLayouts JSON 👉", JSON.stringify(unitLayouts, null, 2));

  // ⭐ 非项目类房源用的单一表单数据
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

  // 面积选择器（普通房源用；New Project 情况下可当总面积用）
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  const [availability, setAvailability] = useState({});
  const [transitInfo, setTransitInfo] = useState(null);
  const [loading, setLoading] = useState(false);

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
            // 如果是 New Project / Completed Unit，就用 unitLayouts；
            // 否则用 singleFormData
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

  const isProject =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      {/* 选择类型 + 项目状态 */}
      <TypeSelector
        value={type}
        onChange={setType}
        onFormChange={(formData) => setPropertyStatus(formData.propertyStatus)}
      />

      {/* ---------- New Project / Completed Unit 的逻辑 ---------- */}
      {isProject ? (
        <>
          {/* 1️⃣ 先只出现：项目房型数量选择（UnitTypeSelector） */}
          <UnitTypeSelector
            propertyStatus={propertyStatus}
            onChange={(layouts) => setUnitLayouts(layouts)}
          />

          {/* 2️⃣ 只有当“房型数量”选完（unitLayouts 有内容）后，才出现每个房型的表单 */}
          {unitLayouts.length > 0 && (
            <div className="space-y-4 mt-4">
              {unitLayouts.map((layout, index) => (
                <UnitLayoutForm
                  key={index}
                  index={index}
                  data={{ ...layout, projectType: propertyStatus }}
                  onChange={(updated) => {
                    const newLayouts = [...unitLayouts];
                    newLayouts[index] = updated;
                    setUnitLayouts(newLayouts);
                  }}
                />
              ))}

              {/* 🔸 如果你想要“项目总价 + 每平方尺”可以在这里再加一个总价 PriceInput */}
              {/* 例如：
              <PriceInput
                value={singleFormData.price}
                onChange={(val) =>
                  setSingleFormData({ ...singleFormData, price: val })
                }
                type={propertyStatus}
                // 这里 area 你可以传项目总面积（如多个 layout 面积之和）
              />
              */}
            </div>
          )}
        </>
      ) : (
        /* ---------- 普通二手/单一房源逻辑 ---------- */
        <div className="space-y-4 mt-6">
          {/* 面积选择器 */}
          <AreaSelector onChange={handleAreaChange} initialValue={areaData} />

          {/* 价格 + 每平方尺 */}
          <PriceInput
            value={singleFormData.price}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, price: val })
            }
            type={propertyStatus}
            area={{
              buildUp: convertToSqft(
                areaData.values.buildUp,
                areaData.units.buildUp
              ),
              land: convertToSqft(areaData.values.land, areaData.units.land),
            }}
          />

          {/* 房间/浴室等（只在非 New Project 下出现） */}
          <RoomCountSelector
            value={{
              bedrooms: singleFormData.bedrooms,
              bathrooms: singleFormData.bathrooms,
              kitchens: singleFormData.kitchens,
              livingRooms: singleFormData.livingRooms,
            }}
            onChange={(updated) =>
              setSingleFormData({ ...singleFormData, ...updated })
            }
          />

          <CarparkCountSelector
            value={singleFormData.carpark}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, carpark: val })
            }
            mode="single"
          />

          <ExtraSpacesSelector
            value={singleFormData.extraSpaces || []}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, extraSpaces: val })
            }
          />

          <FacingSelector
            value={singleFormData.facing}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, facing: val })
            }
          />

          <FurnitureSelector
            value={singleFormData.furniture}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, furniture: val })
            }
          />

          <FacilitiesSelector
            value={singleFormData.facilities}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, facilities: val })
            }
          />
        </div>
      )}

      {/* 🚏 交通信息（两种模式都可以用） */}
      <TransitSelector onChange={setTransitInfo} />

      {/* 🏨 Homestay / Hotel 额外设置 */}
      {(type?.includes("Homestay") || type?.includes("Hotel")) && (
        <>
          <AdvancedAvailabilityCalendar
            value={availability}
            onChange={setAvailability}
          />

          <CarparkLevelSelector
            value={singleFormData.carparkPosition}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, carparkPosition: val })
            }
            mode={
              isProject
                ? "range"
                : "single"
            }
          />

          <BuildYearSelector
            value={singleFormData.buildYear}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, buildYear: val })
            }
            quarter={singleFormData.quarter}
            onQuarterChange={(val) =>
              setSingleFormData({ ...singleFormData, quarter: val })
            }
            showQuarter={propertyStatus === "New Project / Under Construction"}
          />
        </>
      )}

      {/* 描述 */}
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

      {/* 封面图片（项目/普通都可以用） */}
      <ImageUpload
        images={singleFormData.photos}
        setImages={(updated) =>
          setSingleFormData({ ...singleFormData, photos: updated })
        }
      />

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
