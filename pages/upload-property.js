// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
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
const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj || {}));

const pickCommon = (l) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit ?? null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

// ---------- convert helpers ----------
const convertToSqft = (val, unit) => {
  const num = parseFloat(String(val || "").replace(/,/g, ""));
  if (isNaN(num) || num <= 0) return 0;
  const u = String(unit || "").toLowerCase();
  if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) return num * 10.7639;
  if (u.includes("acre")) return num * 43560;
  if (u.includes("hectare")) return num * 107639;
  return num;
};

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [addressObj, setAddressObj] = useState(null);

  // 主模式 / 状态
  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");

  // ✅ 保存 TypeSelector 整包
  const [typeForm, setTypeForm] = useState(null);

  // Rent 专用
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room

  // 项目模式
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 单一表单（非项目）
  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp", "land"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [description, setDescription] = useState("");

  const saleTypeNorm = String(saleType || "").toLowerCase();

  const isHomestay = saleTypeNorm === "homestay";
  const isHotel = saleTypeNorm === "hotel/resort";

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  // ✅ Rent 批量操作
  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes";
  const isProjectLike = isProject || isRentBatch;

  const isBulkRentProject = isRentBatch;

  const enableProjectAutoCopy =
    saleTypeNorm === "sale" && computedStatus === "New Project / Under Construction";

  const isRoomRental = saleTypeNorm === "rent" && roomRentalMode === "room";

  // ✅ 兼容旧字段名：propertyCategory / category
  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  // 不再是项目式表单时清空 layouts
  useEffect(() => {
    if (!isProjectLike) setUnitLayouts([]);
  }, [isProjectLike]);

  // ✅ Rent 模式下还没选 category，就强制回到 no
  useEffect(() => {
    if (saleTypeNorm === "rent" && !rentCategorySelected) {
      setRentBatchMode("no");
    }
  }, [saleTypeNorm, rentCategorySelected]);

  // ✅ 关键：Rent 批量时，根据 layoutCount 自动生成 N 个 unitLayouts
  useEffect(() => {
    if (!isRentBatch) return;

    const n = Number(typeForm?.layoutCount);
    if (!Number.isFinite(n) || n < 2) return;

    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: n }).map((_, i) => prevArr[i] || { title: `Layout ${i + 1}` });
    });
  }, [isRentBatch, typeForm?.layoutCount]);

  const handleSubmit = async () => {
    try {
      if (!user?.id) {
        toast.error("请先登录");
        return;
      }
      if (!addressObj?.lat || !addressObj?.lng) {
        toast.error("请选择地址");
        return;
      }

      // 这里保持你原本 submit 逻辑（你现在文件里后面还有完整提交逻辑的话，照旧放回即可）
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

      <AddressSearchInput value={addressObj} onChange={setAddressObj} />

      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={(form) => {
          setTypeForm(form || null);
          setSaleType(form?.saleType || "");
          setComputedStatus(form?.propertyStatus || "");
          setRoomRentalMode(form?.roomRentalMode || "whole");
        }}
      />

      {/* ✅ 按模式渲染（保持你的结构，只新增 Rent 批量走 ProjectUploadForm） */}
      {isHomestay ? (
        <HotelUploadForm />
      ) : isHotel ? (
        <HotelUploadForm />
      ) : isProjectLike ? (
        <ProjectUploadForm
          computedStatus={isRentBatch ? "New Project / Under Construction" : computedStatus}
          isBulkRentProject={isBulkRentProject}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          enableProjectAutoCopy={enableProjectAutoCopy}
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

      <Button onClick={handleSubmit}>提交</Button>
    </div>
  );
}
