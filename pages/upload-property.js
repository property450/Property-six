// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";

import SaleUploadForm from "@/components/forms/SaleUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";

// ✅ Homestay / Hotel 共用同一个表单（按你原本的印象改回）
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// 你原本就有的工具
const cloneDeep = (v) => JSON.parse(JSON.stringify(v || {}));
const pickCommon = (l = {}) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit || null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

export default function UploadProperty() {
  const router = useRouter();

  // ✅ TypeSelector 真正需要的 value
  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");

  // ✅ 由 TypeSelector onFormChange 回写出来的“模式”
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel/Resort
  const [computedStatus, setComputedStatus] = useState(""); // propertyStatus
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole / room

  // 标题/地址（你原本有）
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // 顶层描述（你原本有）
  const [description, setDescription] = useState("");

  // 项目模式：layouts + 统一锁定字段（bulk rent）
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  // 单一表单数据（Sale/Rent）
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

  // ✅ 统一判定
  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const isBulkRentProject =
    saleTypeNorm === "rent" && computedStatus === "New Project / Under Construction";

  // ✅ 只在 Sale + New Project / Under Construction 启用 layout1 同步/脱钩
  const enableProjectAutoCopy =
    saleTypeNorm === "sale" && computedStatus === "New Project / Under Construction";

  const isRoomRental = saleTypeNorm === "rent" && roomRentalMode === "room";

  // 不再是项目类就清空 layouts（保持你原本行为）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // 提交（你原本完整逻辑放这里即可）
  const handleSubmit = async () => {
    try {
      if (!title.trim()) return toast.error("请输入房源标题");
      if (!address.trim()) return toast.error("请选择地址");

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

      {/* ✅ 修复关键：TypeSelector 正确接线（你原本缺的就是这一步） */}
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

      {/* ✅ 1) Homestay / Hotel：共用同一表单（改回你的印象） */}
      {isHomestay || isHotel ? (
        <HotelUploadForm listingMode={saleType} />
      ) : isProject ? (
        /* ✅ 2) New Project / Completed Unit：显示房型数量 + 多个 layout 表单 */
        <div className="space-y-4">
          <UnitTypeSelector
            computedStatus={computedStatus}
            saleType={saleType}
            unitLayouts={unitLayouts}
            setUnitLayouts={setUnitLayouts}
          />

          {unitLayouts.map((layout, idx) => (
            <UnitLayoutForm
              key={layout?._uiId || idx}
              index={idx}
              data={layout || {}}
              onChange={(next) => {
                setUnitLayouts((prev) => {
                  const arr = Array.isArray(prev) ? [...prev] : [];
                  arr[idx] = next;
                  return arr;
                });
              }}
              lockCategory={isBulkRentProject}
              projectCategory={projectCategory}
              projectSubType={projectSubType}
              enableCommonCopy={enableProjectAutoCopy}
            />
          ))}
        </div>
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
          photoConfig={{}}
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
          photoConfig={{}}
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
