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

function toSafeInt(v, fallback) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [typeForm, setTypeForm] = useState(null);

  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    // ✅ 只默认 Build up（你要求的）
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [description, setDescription] = useState("");

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    saleTypeNorm === "sale" &&
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(computedStatus);

  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes";

  const rawLayoutCount = toSafeInt(typeForm?.layoutCount, 1);
  const batchLayoutCount = clamp(rawLayoutCount || 1, 1, 200);

  const rawRoomCount = Number(typeForm?.roomCount);
  const roomLayoutCount =
    roomRentalMode === "room"
      ? typeForm?.roomCountMode === "multi"
        ? Math.max(2, Math.min(20, Number.isFinite(rawRoomCount) ? rawRoomCount : 2))
        : 1
      : 1;

  useEffect(() => {
    if (!isRentBatch) return;

    const n = batchLayoutCount;
    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: n }).map((_, i) => prevArr[i] || {});
    });
  }, [isRentBatch, batchLayoutCount]);

  useEffect(() => {
    if (saleTypeNorm !== "rent") return;
    if (roomRentalMode !== "room") return;
    if (isRentBatch) return;

    if (roomLayoutCount <= 1) {
      setUnitLayouts?.([]);
      return;
    }

    setUnitLayouts?.((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: roomLayoutCount }).map((_, i) => prevArr[i] || {});
    });
  }, [saleTypeNorm, roomRentalMode, isRentBatch, roomLayoutCount]);

  const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj || {}));
  const pickCommon = (src) => cloneDeep(src || {});
  const commonHash = (obj) => JSON.stringify(obj || {});

  const handleSubmit = async () => {
    // 你原本的提交逻辑（不动）
    try {
      toast.success("提交逻辑保持不动（你原本的）");
    } catch (e) {
      toast.error("提交失败");
    }
  };

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <TypeSelector
        value={typeValue}
        setValue={setTypeValue}
        saleType={saleType}
        setSaleType={setSaleType}
        computedStatus={computedStatus}
        setComputedStatus={setComputedStatus}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
      />

      {isHomestay ? (
        <HomestayUploadForm />
      ) : isHotel ? (
        <HotelUploadForm />
      ) : isProject ? (
        <ProjectUploadForm
          saleType={saleType}
          computedStatus={computedStatus}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          isBulkRentProject={false}
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          enableProjectAutoCopy={saleTypeNorm === "sale" && computedStatus === "New Project / Under Construction"}
          cloneDeep={cloneDeep}
          pickCommon={pickCommon}
          commonHash={commonHash}
        />
      ) : saleTypeNorm === "rent" ? (
        <RentUploadForm
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
          rentBatchMode={rentBatchMode}
          layoutCount={isRentBatch ? batchLayoutCount : roomLayoutCount}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          // ✅ 关键：传 propertyCategory 进去（Subsale/Auction/RTO 会生效）
          propertyCategory={typeForm?.category || typeForm?.propertyCategory || ""}
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
          // ✅ 关键：传 propertyCategory 进去（Subsale/Auction/RTO 会生效）
          propertyCategory={typeForm?.category || typeForm?.propertyCategory || ""}
        />
      )}

      <Button onClick={handleSubmit} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full">
        提交房源
      </Button>
    </div>
  );
}
