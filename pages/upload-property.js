// pages/upload-property.js
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), { ssr: false });

// ✅ 兼容 default / named export 的加载器：解决你 Homestay 点击就炸的 “got: object”
function resolveComponent(mod) {
  if (!mod) return null;
  if (typeof mod === "function") return mod; // already a component
  if (mod.default && typeof mod.default === "function") return mod.default;
  // 找一个“看起来像组件”的 named export
  for (const k of Object.keys(mod)) {
    if (typeof mod[k] === "function") return mod[k];
  }
  return null;
}

// ✅ 用 require 避免 import/export 不匹配直接炸
const HomestayUploadForm = resolveComponent(
  (() => {
    try {
      return require("@/components/homestay/HomestayUploadForm");
    } catch (e) {
      return null;
    }
  })()
);

const HotelUploadForm = resolveComponent(
  (() => {
    try {
      return require("@/components/hotel/HotelUploadForm");
    } catch (e) {
      return null;
    }
  })()
);

// 你新建的 3 个独立表单（一样用兼容加载，避免“object”）
const ProjectUploadForm = resolveComponent(
  (() => {
    try {
      return require("@/components/forms/ProjectUploadForm");
    } catch (e) {
      return null;
    }
  })()
);

const RentUploadForm = resolveComponent(
  (() => {
    try {
      return require("@/components/forms/RentUploadForm");
    } catch (e) {
      return null;
    }
  })()
);

const SaleUploadForm = resolveComponent(
  (() => {
    try {
      return require("@/components/forms/SaleUploadForm");
    } catch (e) {
      return null;
    }
  })()
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

  // ✅ 新版 TypeSelector 的必要 state（不会改变你 UI/文案，只是对接）
  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [typeForm, setTypeForm] = useState(null);

  // 基础信息（你原本）
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // 主模式 / 状态（你原本）
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");

  // Rent 专用（你原本）
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  // 项目模式（你原本）
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 单一表单（你原本）
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

  // ✅ 核心：把 TypeSelector 回传值同步回你的旧逻辑 state（不改你原本判断/渲染）
  useEffect(() => {
    if (!typeForm) return;

    const nextSaleType = typeForm.saleType || "";
    const nextStatus = typeForm.propertyStatus || "";
    const nextRoomMode = typeForm.roomRentalMode || "whole";

    setSaleType((prev) => (prev === nextSaleType ? prev : nextSaleType));
    setComputedStatus((prev) => (prev === nextStatus ? prev : nextStatus));
    setRoomRentalMode((prev) => (prev === nextRoomMode ? prev : nextRoomMode));
  }, [typeForm]);

  // 地址选点（你原本）
  const handleLocationSelect = (loc) => {
    if (!loc) return;
    setAddress(loc.address || "");
    setLatitude(loc.lat || "");
    setLongitude(loc.lng || "");
  };

  // 统一判定（你原本）
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

  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    computedStatus === "New Project / Under Construction";

  // 不再是项目类时清空 layouts（你原本）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // 你的 photoConfig（你原本）
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

      <input
        className="w-full border rounded-lg p-2"
        placeholder="房源标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="space-y-2">
        <label className="font-medium">地址</label>
        <AddressSearchInput onSelect={handleLocationSelect} />
        <div className="text-sm text-gray-600">{address}</div>
      </div>

      {/* ✅ 修复点：TypeSelector 用新版 props（否则 New Project / Homestay 永远不会正确驱动页面） */}
      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        onFormChange={setTypeForm}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
      />

      {/* ✅ 这里开始：按你原本逻辑渲染（不改你的字/UI，只修组件加载与状态驱动） */}
      {isHomestay ? (
        HomestayUploadForm ? (
          <HomestayUploadForm />
        ) : (
          <div className="text-red-600">
            HomestayUploadForm 组件加载失败（export/import 不匹配）。我已经用兼容加载了，
            但你的文件里可能没有 export 任何组件函数。
          </div>
        )
      ) : isHotel ? (
        HotelUploadForm ? (
          <HotelUploadForm />
        ) : (
          <div className="text-red-600">
            HotelUploadForm 组件加载失败（export/import 不匹配）。
          </div>
        )
      ) : isProject ? (
        ProjectUploadForm ? (
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
        ) : (
          <div className="text-red-600">
            ProjectUploadForm 组件加载失败（路径/导出不匹配）。
          </div>
        )
      ) : String(saleType || "").toLowerCase() === "rent" ? (
        RentUploadForm ? (
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
          <div className="text-red-600">
            RentUploadForm 组件加载失败（路径/导出不匹配）。
          </div>
        )
      ) : (
        SaleUploadForm ? (
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
        ) : (
          <div className="text-red-600">
            SaleUploadForm 组件加载失败（路径/导出不匹配）。
          </div>
        )
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
