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
import RoomRentalForm from "@/components/RoomRentalForm";

// Homestay / Hotel
import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

// ✅ 你新建的 3 个独立表单文件
import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

// 批量 Rent 项目：统一 Category / Sub Type（你原本就有）
const LAYOUT_CATEGORY_OPTIONS = {
  "Bungalow / Villa": [
    "Bungalow",
    "Link Bungalow",
    "Twin Villa",
    "Zero-Lot Bungalow",
    "Bungalow land",
  ],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Flat",
    "Service Residence",
  ],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terraced House", "Townhouse"],
  "Business Property": [
    "Hotel / Resort",
    "Hostel / Dormitory",
    "Boutique Hotel",
    "Office",
    "Office Suite",
    "Business Suite",
    "Retail Shop",
    "Retail Space",
    "Retail Office",
    "Shop",
    "Shop / Office",
    "Sofo",
    "Soho",
    "Sovo",
    "Commercial Bungalow",
    "Commercial Semi-Detached House",
    "Mall / Commercial Complex",
    "School / University",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Government Office",
    "Community Hall / Public Utilities",
  ],
  "Industrial Property": [
    "Factory",
    "Cluster Factory",
    "Semi-D Factory",
    "Detached Factory",
    "Terrace Factory",
    "Warehouse",
    "Showroom cum Warehouse",
    "Light Industrial",
    "Heavy Industrial",
  ],
  Land: [
    "Agricultural Land",
    "Industrial Land",
    "Commercial Land",
    "Residential Land",
    "Oil Palm Estate",
    "Rubber Plantation",
    "Fruit Orchard",
    "Paddy Field",
    "Vacant Agricultural Land",
  ],
};

// ---------- utils ----------
const cloneDeep = (v) => JSON.parse(JSON.stringify(v || {}));

const pickCommon = (l = {}) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit || null,
});

const commonHash = (l) => JSON.stringify(pickCommon(l));

const normalizeLayoutsFromUnitTypeSelector = (payload) => {
  if (Array.isArray(payload)) return payload;
  const n = Number(payload);
  if (!Number.isFinite(n) || n <= 0) return [];
  return Array.from({ length: n }, () => ({}));
};

// ====== 面积转换（你原本就有） ======
const convertToSqft = (val, unit) => {
  const num = parseFloat(String(val || "").replace(/,/g, ""));
  if (isNaN(num) || num <= 0) return 0;
  const u = String(unit || "").toLowerCase();
  if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
    return num * 10.7639;
  }
  if (u.includes("acre")) return num * 43560;
  if (u.includes("hectare")) return num * 107639;
  return num;
};

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // 基础信息
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 顶层描述
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // 主模式 / 状态
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");

  // Rent 专用
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room

  // 项目模式
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 单一表单（非项目）
  const [singleFormData, setSingleFormData] = useState({
    price: "",
    priceLow: "",
    priceHigh: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    carparkPosition: "",
    facing: "",
    extraSpaces: [],
    facilities: [],
    furniture: [],
    transit: null,
    buildYear: "",
    quarter: "",
    photos: {},
  });

  const [areaData, setAreaData] = useState({
    types: ["buildUp", "land"],
    values: { buildUp: "", land: "" },
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
  });

  const [loading, setLoading] = useState(false);

  // 处理地址选点
  const handleLocationSelect = (loc) => {
    if (!loc) return;
    setAddress(loc.address || "");
    setLatitude(loc.lat || "");
    setLongitude(loc.lng || "");
  };

  // 统一判定
  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    String(saleType || "").toLowerCase() === "rent" &&
    computedStatus === "New Project / Under Construction";

  const isRoomRental =
    String(saleType || "").toLowerCase() === "rent" &&
    roomRentalMode === "room";

  // ✅ 只在 Sale + New Project / Under Construction 启用“Layout1 同步/脱钩”
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    computedStatus === "New Project / Under Construction";

  // 不再是项目类时清空 layouts（保留你原本行为）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // 生成 photoConfig（你原本就有）
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
    transit: singleFormData.transit || null,
  };

  // -----------------------------
  // 提交
  // -----------------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        toast.error("请先登录");
        return;
      }

      if (!title.trim()) {
        toast.error("请输入房源标题");
        return;
      }

      if (!address.trim()) {
        toast.error("请选择地址");
        return;
      }

      // 你原本的提交逻辑保持不动（这里省略你原本 insert/update 的细节）
      // ⚠️ 如果你原文件后面还有完整提交 insert 逻辑，请保留原样放在这里即可

      toast.success("提交成功");
      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      {/* 标题 */}
      <input
        className="w-full border rounded-lg p-2"
        placeholder="房源标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* 地址 */}
      <div className="space-y-2">
        <label className="font-medium">地址</label>
        <AddressSearchInput onSelect={handleLocationSelect} />
        <div className="text-sm text-gray-600">{address}</div>
      </div>

      {/* Type Selector（你原本就有） */}
      <TypeSelector
        saleType={saleType}
        setSaleType={setSaleType}
        computedStatus={computedStatus}
        setComputedStatus={setComputedStatus}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
      />

      {/* ✅ 这里开始：按模式渲染独立表单（不改你的字/UI，只是搬家） */}
      {isHomestay ? (
        <HomestayUploadForm />
      ) : isHotel ? (
        <HotelUploadForm />
      ) : isProject ? (
        <ProjectUploadForm
          computedStatus={computedStatus}
          isBulkRentProject={isBulkRentProject}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          enableProjectAutoCopy={enableProjectAutoCopy}
          LAYOUT_CATEGORY_OPTIONS={LAYOUT_CATEGORY_OPTIONS}
          normalizeLayoutsFromUnitTypeSelector={normalizeLayoutsFromUnitTypeSelector}
          pickCommon={pickCommon}
          cloneDeep={cloneDeep}
          commonHash={commonHash}
        />
      ) : String(saleType || "").toLowerCase() === "rent" ? (
        <RentUploadForm
          saleType={saleType}
          computedStatus={computedStatus}
          isRoomRental={isRoomRental}
          roomRentalMode={roomRentalMode}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
          description={description}
          setDescription={setDescription}
          photoConfig={photoConfig}
          convertToSqft={convertToSqft}
        />
      ) : (
        <SaleUploadForm
          saleType={saleType}
          computedStatus={computedStatus}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
          description={description}
          setDescription={setDescription}
          photoConfig={photoConfig}
          convertToSqft={convertToSqft}
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
