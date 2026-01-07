// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// ---------- 你原本就有的工具（保持不改） ----------
const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj || {}));

const pickCommon = (l) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit ?? null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [addressObj, setAddressObj] = useState(null);

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no"); // "no" | "yes"
  const [typeForm, setTypeForm] = useState(null);

  // 从 typeForm 里拿
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  // 项目（Sale 用）
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]); // ✅ Rent 批量也复用这个数组来存每个屋型表单数据

  // 单一表单（Rent 单房 / Sale 非项目）
  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp", "land"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [description, setDescription] = useState("");

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  // ✅ 关键：isProject 只允许 Sale 才成立（彻底杜绝 Rent 进入 ProjectUploadForm）
  const isProject =
    saleTypeNorm === "sale" &&
    (computedStatus === "New Project / Under Construction" ||
      computedStatus === "Completed Unit (Developer Unit)" ||
      computedStatus === "Completed Unit (Subsale Property)" ||
      computedStatus === "Completed Unit (Auction Property)" ||
      computedStatus === "Completed Unit (Rent-to-Own Property)");

  // ✅ TypeSelector 里选了 category 才算 Rent category 已选（保持你原逻辑）
  const rentCategorySelected = !!typeForm?.category;
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  // 从 typeForm 里拿（你原本就这样）
  const layoutCount = Number(typeForm?.layoutCount) || 2;

  // ✅ Rent 批量
  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes";

  // ✅ Rent 出租房间 + 多房间：用 layoutCount 生成对应数量的房间表单（房间1/房间2...）
  // 说明：不改你原本 TypeSelector；它会把「房间数量」写进 typeForm.layoutCount
  const isRoomRentalMulti =
    saleTypeNorm === "rent" && roomRentalMode === "room" && rentBatchMode !== "yes";

  // ✅ 需要生成多个表单的情况：Rent 批量 或 Rent 多房间
  const shouldGenerateMultiForms = isRentBatch || isRoomRentalMulti;

  // ✅ Rent 批量/多房间时，自动把 unitLayouts 生成为对应数量（保留已填内容）
  useEffect(() => {
    if (!shouldGenerateMultiForms) return;

    const n = Math.max(2, Math.min(20, Number(layoutCount) || 2));
    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      // 关键：保留已填内容，只补齐/截断到 n
      return Array.from({ length: n }).map((_, i) => prevArr[i] || {});
    });
  }, [shouldGenerateMultiForms, layoutCount]);

  // ✅ 当离开 Rent 批量模式时，不强制清空（避免用户切换误丢数据）
  // （保持你原本的逻辑，不动）

  const handleSubmit = async () => {
    try {
      if (!user) {
        toast.error("请先登录");
        return;
      }
      if (!saleType) {
        toast.error("请选择 Sale / Rent / Homestay / Hotel");
        return;
      }
      if (!addressObj?.lat || !addressObj?.lng) {
        toast.error("请选择地址");
        return;
      }

      // 这里保留你原本 submit（你项目应该还有完整 insert 逻辑）
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

      {/* ✅ 模式渲染：Rent 永远不会进 ProjectUploadForm */}
      {isHomestay ? (
        <HomestayUploadForm />
      ) : isHotel ? (
        <HotelUploadForm />
      ) : isProject ? (
        <ProjectUploadForm
          computedStatus={computedStatus}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          enableProjectAutoCopy={
            saleTypeNorm === "sale" &&
            computedStatus === "New Project / Under Construction"
          }
          cloneDeep={cloneDeep}
          pickCommon={pickCommon}
          commonHash={commonHash}
        />
      ) : saleTypeNorm === "rent" ? (
        <RentUploadForm
          // ✅ 原本就有的
          saleType={saleType}
          computedStatus={computedStatus}
          roomRentalMode={roomRentalMode}
          isRoomRental={roomRentalMode === "room"}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
          description={description}
          setDescription={setDescription}
          // ✅ 新增：Rent 批量用（你原本就传）
          rentBatchMode={rentBatchMode}
          layoutCount={Math.max(2, Math.min(20, Number(layoutCount) || 2))}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
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
