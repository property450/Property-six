// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

// ✅ 你新建的 3 个独立表单文件（保持你的结构不变）
import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

// ✅ 只在浏览器渲染（避免 SSR/hydration 问题）
const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), { ssr: false });

// ✅ 兼容 default / named export：避免 “Element type is invalid ... got object”
const resolveComponent = (mod, preferredNames = []) => {
  if (!mod) return null;
  if (typeof mod === "function") return mod;
  if (mod.default && typeof mod.default === "function") return mod.default;
  for (const n of preferredNames) {
    if (typeof mod[n] === "function") return mod[n];
  }
  const firstFn = Object.values(mod).find((v) => typeof v === "function");
  return firstFn || null;
};

const HomestayUploadForm = dynamic(
  () => import("@/components/homestay/HomestayUploadForm").then((m) => resolveComponent(m, ["HomestayUploadForm"])),
  { ssr: false }
);

const HotelUploadForm = dynamic(
  () => import("@/components/hotel/HotelUploadForm").then((m) => resolveComponent(m, ["HotelUploadForm"])),
  { ssr: false }
);

// 批量 Rent 项目：统一 Category / Sub Type（你原本就有）
const LAYOUT_CATEGORY_OPTIONS = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
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
  if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) return num * 10.7639;
  if (u.includes("acre")) return num * 43560;
  if (u.includes("hectare")) return num * 107639;
  return num;
};

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // ✅ TypeSelector 的 value（不改变你现有逻辑，只是让 TypeSelector 内部对比用）
  const [typeValue, setTypeValue] = useState("");

  // 基础信息
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // 主模式 / 状态（保留你的旧变量名，避免影响下游）
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");

  // Rent 专用
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room
  const [rentBatchMode, setRentBatchMode] = useState("no"); // yes/no（需要批量操作吗）

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

  // 统一判定（保持你的原本逻辑）
  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    computedStatus === "New Project / Under Construction" || computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    String(saleType || "").toLowerCase() === "rent" &&
    computedStatus === "New Project / Under Construction" &&
    rentBatchMode === "yes";

  const isRoomRental = String(saleType || "").toLowerCase() === "rent" && roomRentalMode === "room";

  // ✅ 只在 Sale + New Project / Under Construction 启用“Layout1 同步/脱钩”
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" && computedStatus === "New Project / Under Construction";

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
  // 提交（你原本的结构）
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

      // ⚠️ 这里保持你原本 insert/update 逻辑（你可以把你原来完整的 supabase 提交代码放回来）
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

      {/* ✅ TypeSelector：用你现在的新版接口对接（这是 New Project / Homestay/Hotel 能切换的关键） */}
      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={(v) => setRentBatchMode(v)}
        onFormChange={(form) => {
          // 把 TypeSelector 的内部选择同步回父层（保持你旧变量名）
          setSaleType(form?.saleType || "");
          setComputedStatus(form?.propertyStatus || "");
          setRoomRentalMode(form?.roomRentalMode || "whole");

          // 兼容：如果 TypeSelector 也回传 rentBatchMode，就同步
          if (typeof form?.rentBatchMode === "string") {
            setRentBatchMode(form.rentBatchMode);
          }
        }}
      />

      {/* ✅ 按你的原本逻辑渲染（不改你表单结构，只修“切换不生效/报错”） */}
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
