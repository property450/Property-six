// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useUser } from "@supabase/auth-helpers-react";

import TypeSelector from "@/components/TypeSelector";

// Homestay / Hotel
import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

// ✅ 你新建的 3 个独立表单文件（你项目里存在才保留）
import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

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

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // ✅ TypeSelector 需要的「value」
  const [typeValue, setTypeValue] = useState("");

  // 基础信息
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 顶层描述
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // ✅ 从 TypeSelector 的 onFormChange 回写出来的核心状态
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel/Resort
  const [computedStatus, setComputedStatus] = useState(""); // propertyStatus（Sale 时）

  // Rent 专用
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room
  const [rentBatchMode, setRentBatchMode] = useState("no"); // TypeSelector 里用到

  // 项目模式
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // Homestay / Hotel 表单数据（避免你组件内 onChange 没接到）
  const [homestayData, setHomestayData] = useState({});
  const [hotelData, setHotelData] = useState({});

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

  // ✅ 统一判定（现在 saleType 是真的会变了）
  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm === "homestay";
  const isHotel = saleTypeNorm === "hotel/resort";

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    saleTypeNorm === "rent" && computedStatus === "New Project / Under Construction";

  const isRoomRental = saleTypeNorm === "rent" && roomRentalMode === "room";

  // ✅ 只在 Sale + New Project / Under Construction 启用“Layout1 同步/脱钩”
  const enableProjectAutoCopy = saleTypeNorm === "sale" && computedStatus === "New Project / Under Construction";

  // 不再是项目类时清空 layouts（保留你原本行为）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // -----------------------------
  // 提交（你原本完整逻辑放这里，不动）
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

      {/* ✅ 修复：TypeSelector 正确接线 */}
      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        onFormChange={(form) => {
          // form.saleType: Sale / Rent / Homestay / Hotel/Resort
          // form.propertyStatus: New Project / Under Construction ...
          setSaleType(form?.saleType || "");
          setComputedStatus(form?.propertyStatus || "");
          setRoomRentalMode(form?.roomRentalMode || "whole");
          // TypeSelector 内部用 rentBatchMode 控制显示
          // 你如果要保留它，就把它同步起来
          if (form?.rentBatchMode) setRentBatchMode(form.rentBatchMode);
        }}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
      />

      {/* ✅ 现在这些分支会正常触发渲染 */}
      {isHomestay ? (
        <HomestayUploadForm data={homestayData} onChange={setHomestayData} />
      ) : isHotel ? (
        <HotelUploadForm data={hotelData} onChange={setHotelData} />
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
      ) : saleTypeNorm === "rent" ? (
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
        />
      )}

      <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full">
        {loading ? "上传中..." : "提交房源"}
      </Button>
    </div>
  );
}
