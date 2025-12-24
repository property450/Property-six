// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

// ✅ 你新建的 3 个独立表单文件
import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

// ✅ 地址输入：client only
const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), { ssr: false });

/**
 * ✅ Homestay / Hotel：用 dynamic + “default 或 named export” 兼容
 * 这样就不会再出现 “Element type is invalid... got object”
 * 如果你的文件是 export default => 用 default
 * 如果你的文件是 export function HomestayUploadForm => 用 named
 * 两个都没有 => 返回一个空组件（不报错）
 */
const HomestayUploadForm = dynamic(
  () =>
    import("@/components/homestay/HomestayUploadForm").then(
      (m) => m.default || m.HomestayUploadForm || (() => null)
    ),
  { ssr: false }
);

const HotelUploadForm = dynamic(
  () =>
    import("@/components/hotel/HotelUploadForm").then(
      (m) => m.default || m.HotelUploadForm || (() => null)
    ),
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

  // ✅ 只做 hydration 稳定（不提前 return，不会造成 hooks 错误）
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 基础信息
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 顶层描述
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // ✅ TypeSelector 回传的完整表单对象（关键）
  const [typeForm, setTypeForm] = useState(null);

  // 主模式 / 状态（你页面其它逻辑会用到）
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");

  // Rent 专用
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room
  const [rentBatchMode, setRentBatchMode] = useState("no"); // yes/no

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

  // ✅ 关键：每次 TypeSelector 改变，把核心字段同步到父层 state
  useEffect(() => {
    if (!typeForm) return;
    setSaleType(typeForm.saleType || "");
    setComputedStatus(typeForm.propertyStatus || "");
    setRoomRentalMode(typeForm.roomRentalMode || "whole");
    if (typeof typeForm.rentBatchMode === "string") setRentBatchMode(typeForm.rentBatchMode);
  }, [typeForm]);

  // 统一判定
  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    String(saleType || "").toLowerCase() === "rent" &&
    computedStatus === "New Project / Under Construction" &&
    rentBatchMode === "yes";

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

      {/* ✅ TypeSelector：用你现在的新接口 */}
      <TypeSelector
        value={typeForm?.finalType || ""} // 只是给 TypeSelector 内部对比用，不影响你原 UI
        onChange={() => {}}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={(v) => setRentBatchMode(v)}
        onFormChange={(form) => {
          // ✅ 关键：一定要 setTypeForm，父层才能拿到 saleType/propertyStatus
          setTypeForm(form || null);
        }}
      />

      {/* ✅ 表单区：等 mounted 后再渲染，避免 hydration 问题（不提前 return，不会 hooks 错） */}
      {mounted && (
        <>
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
        </>
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
