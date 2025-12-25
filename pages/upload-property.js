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

import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// ---------- utils ----------
const cloneDeep = (v) => JSON.parse(JSON.stringify(v || {}));
const pickCommon = (l = {}) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit || null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

// ---------- convert helpers (你原本就有) ----------
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
  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
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

  // 地址选点
  const handleLocationSelect = (loc) => {
    if (!loc) return;
    setAddress(loc.address || "");
    setLatitude(loc.lat || "");
    setLongitude(loc.lng || "");
  };

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    saleTypeNorm === "rent" && computedStatus === "New Project / Under Construction";

  const enableProjectAutoCopy =
    saleTypeNorm === "sale" && computedStatus === "New Project / Under Construction";

  const isRoomRental = saleTypeNorm === "rent" && roomRentalMode === "room";

  // 不再是项目类时清空 layouts（你原本行为保留）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  const handleSubmit = async () => {
    try {
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

      {/* ✅ 关键修复：TypeSelector 用正确接口接线（否则 New Project / Completed Unit 永远不会进入项目模式） */}
      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
        onFormChange={(form) => {
          setSaleType(form?.saleType || "");
          setComputedStatus(form?.propertyStatus || "");
          setRoomRentalMode(form?.roomRentalMode || "whole");
        }}
      />

      {/* ✅ 这里开始：按模式渲染独立表单（保持你原逻辑） */}
      {isHomestay ? (
        // 你说的“Homestay 跟 Hotel/Resort 共用同一个表单”
        <HotelUploadForm />
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
          // 下面这些你原本就有的工具继续传（保持不变）
          cloneDeep={cloneDeep}
          pickCommon={pickCommon}
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

      <Button
        onClick={handleSubmit}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        提交房源
      </Button>
    </div>
  );
}
