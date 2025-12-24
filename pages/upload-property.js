// pages/upload-property.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

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

// 拆分后的独立表单（不改变功能，只做代码搬家）
import ProjectLayoutsBlock from "@/components/uploadForms/ProjectLayoutsBlock";
import SubsaleSecondaryMarketForm from "@/components/uploadForms/SubsaleSecondaryMarketForm";
import AuctionPropertyForm from "@/components/uploadForms/AuctionPropertyForm";
import RentToOwnSchemeForm from "@/components/uploadForms/RentToOwnSchemeForm";
import { cloneDeep, pickCommon, commonHash } from "@/utils/uploadProperty/commonCopy";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // -----------------------------
  // 基础字段
  // -----------------------------
  const [title, setTitle] = useState("");
  const [type, setType] = useState(null); // TypeSelector 选项对象
  const [saleType, setSaleType] = useState(""); // Sale / Rent / Homestay / Hotel/Resort...
  const [propertyStatus, setPropertyStatus] = useState(""); // New Project / Under Construction...
  const [description, setDescription] = useState("");

  // 地址 + 坐标
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // -----------------------------
  // Rent 批量 / Room Rental
  // -----------------------------
  const [rentBatchMode, setRentBatchMode] = useState("no"); // yes/no
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // whole/room

  // -----------------------------
  // 非项目：单一房源表单数据
  // -----------------------------
  const [areaData, setAreaData] = useState({
    types: ["buildUp", "land"],
    values: { buildUp: "", land: "" },
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
  });

  const [singleFormData, setSingleFormData] = useState({
    price: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    carparkPosition: "",
    facing: "",
    extraSpaces: [],
    furniture: [],
    facilities: [],
    transit: null,
    buildYear: "",
    quarter: "",
    photos: {},
    roomRental: {},
  });

  // -----------------------------
  // 项目：layouts
  // -----------------------------
  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]);

  const lastCommonHashRef = useRef(null);

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // 工具：面积转 sqft（保持你原逻辑）
  // -----------------------------
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认 sqft
  };

  // -----------------------------
  // 判定项目/模式（尽量不动你逻辑）
  // -----------------------------
  const saleTypeNorm = (saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isBulkRentProject =
    String(saleType || "").toLowerCase() === "rent" && rentBatchMode === "yes";
  const computedStatus = isBulkRentProject
    ? "Completed Unit / Developer Unit"
    : propertyStatus;

  const isProject =
    computedStatus?.includes("New Project") ||
    computedStatus?.includes("Completed Unit") ||
    computedStatus?.includes("Developer Unit");

  const isRoomRental =
    String(saleType || "").toLowerCase() === "rent" &&
    roomRentalMode === "room";

  // ✅ 只在 Sale + New Project 启用“Layout1 同步/脱钩”
  const enableProjectAutoCopy =
    String(saleType || "").toLowerCase() === "sale" &&
    String(computedStatus || "").includes("New Project");
  String(saleType || "").toLowerCase() === "sale" &&
    computedStatus === "New Project / Under Construction";

  // 不再是项目类时清空 layouts（保留你原本行为）
  useEffect(() => {
    if (!isProject) setUnitLayouts([]);
  }, [isProject]);

  // Layout1 common 改动自动同步到其它 layout（保留你原本行为）
  useEffect(() => {
    if (!enableProjectAutoCopy) return;
    if (!Array.isArray(unitLayouts) || unitLayouts.length < 2) return;

    const h = commonHash(unitLayouts[0] || {});
    if (lastCommonHashRef.current === null) {
      lastCommonHashRef.current = h;
      return;
    }
    if (lastCommonHashRef.current === h) return;

    const common0 = pickCommon(unitLayouts[0] || {});
    setUnitLayouts((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const next = [...base];
      for (let i = 1; i < next.length; i++) {
        const li = next[i] || {};
        if (li._inheritCommon !== false) {
          next[i] = { ...li, ...cloneDeep(common0) };
        }
      }
      return next;
    });

    lastCommonHashRef.current = h;
  }, [enableProjectAutoCopy, unitLayouts]);

  // 图片上传 config（非项目）
  const photoConfig = {
    bedrooms: singleFormData.bedrooms,
    bathrooms: singleFormData.bathrooms,
    kitchens: singleFormData.kitchens,
    livingRooms: singleFormData.livingRooms,
    carpark: singleFormData.carpark,
    extraSpaces: singleFormData.extraSpaces,
    furniture: singleFormData.furniture,
  };

  const handleLocationSelect = (info) => {
    if (!info) return;
    setAddress(info.address || "");
    setLat(info.lat ?? null);
    setLng(info.lng ?? null);
  };

  // -----------------------------
  // 提交（保持你原逻辑结构）
  // -----------------------------
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("请先登录");
      return;
    }
    if (!title.trim()) {
      toast.error("请输入房源标题");
      return;
    }
    if (!saleType) {
      toast.error("请选择 Sale Type");
      return;
    }
    if (!computedStatus) {
      toast.error("请选择 Property Status");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_id: user.id,
        title: title.trim(),
        address: address || "",
        lat,
        lng,

        saleType,
        propertyStatus: computedStatus,
        type,

        description,

        // 非项目数据
        areaData,
        singleFormData,

        // 项目数据
        projectCategory,
        projectSubType,
        unitLayouts,
      };

      const { error } = await supabase.from("properties").insert(payload);
      if (error) throw error;

      toast.success("上传成功！");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("上传失败，请检查控制台");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
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
        {address && (
          <div className="text-sm text-gray-600 border rounded-lg p-2 bg-gray-50">
            {address}
          </div>
        )}
      </div>

      {/* TypeSelector：只更新回传字段，避免“选了不记住” */}
      <TypeSelector
        value={type}
        onChange={(newValue) => setType(newValue)}
        onFormChange={(formData) => {
          if (!formData || typeof formData !== "object") return;

          if (Object.prototype.hasOwnProperty.call(formData, "saleType")) {
            setSaleType(formData.saleType || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "propertyStatus")) {
            setPropertyStatus(formData.propertyStatus || "");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "rentBatchMode")) {
            setRentBatchMode(formData.rentBatchMode || "no");
          }
          if (Object.prototype.hasOwnProperty.call(formData, "roomRentalMode")) {
            setRoomRentalMode(formData.roomRentalMode || "whole");
          }
        }}
      />

      {/* Homestay / Hotel 表单（保持你原逻辑） */}
      {(isHomestay || isHotel) && (
        <HotelUploadForm
          saleType={saleType}
          propertyStatus={computedStatus}
          address={address}
          lat={lat}
          lng={lng}
          title={title}
          description={description}
          setDescription={setDescription}
          onSubmitted={() => router.push("/")}
        />
      )}

      {/* Sale / Rent：表单主体 */}
      {!isHomestay && !isHotel && saleType && computedStatus && (
        <>
          {/* -----------------------------
             项目：New Project / Under Construction / Completed Unit / Developer Unit（全部保持原逻辑）
           ----------------------------- */}
          {isProject ? (
            <ProjectLayoutsBlock
              isBulkRentProject={isBulkRentProject}
              projectCategory={projectCategory}
              setProjectCategory={setProjectCategory}
              projectSubType={projectSubType}
              setProjectSubType={setProjectSubType}
              computedStatus={computedStatus}
              enableProjectAutoCopy={enableProjectAutoCopy}
              unitLayouts={unitLayouts}
              setUnitLayouts={setUnitLayouts}
            />
          ) : (
            /* -----------------------------
               非项目：你原本的单一房源 / 房间出租逻辑（保留）
             ----------------------------- */
            <>
              {saleType === "Sale" && computedStatus === "Subsale / Secondary Market" ? (
                <SubsaleSecondaryMarketForm
                  saleType={saleType}
                  computedStatus={computedStatus}
                  isRoomRental={isRoomRental}
                  areaData={areaData}
                  setAreaData={setAreaData}
                  singleFormData={singleFormData}
                  setSingleFormData={setSingleFormData}
                  description={description}
                  setDescription={setDescription}
                  photoConfig={photoConfig}
                  convertToSqft={convertToSqft}
                />
              ) : saleType === "Sale" && computedStatus === "Auction Property" ? (
                <AuctionPropertyForm
                  saleType={saleType}
                  computedStatus={computedStatus}
                  isRoomRental={isRoomRental}
                  areaData={areaData}
                  setAreaData={setAreaData}
                  singleFormData={singleFormData}
                  setSingleFormData={setSingleFormData}
                  description={description}
                  setDescription={setDescription}
                  photoConfig={photoConfig}
                  convertToSqft={convertToSqft}
                />
              ) : saleType === "Sale" && computedStatus === "Rent-to-Own Scheme" ? (
                <RentToOwnSchemeForm
                  saleType={saleType}
                  computedStatus={computedStatus}
                  isRoomRental={isRoomRental}
                  areaData={areaData}
                  setAreaData={setAreaData}
                  singleFormData={singleFormData}
                  setSingleFormData={setSingleFormData}
                  description={description}
                  setDescription={setDescription}
                  photoConfig={photoConfig}
                  convertToSqft={convertToSqft}
                />
              ) : (
                <div className="space-y-4">
                  <AreaSelector
                    initialValue={areaData}
                    onChange={(val) => setAreaData(val)}
                  />

                  <PriceInput
                    value={singleFormData.price}
                    onChange={(val) =>
                      setSingleFormData((p) => ({ ...p, price: val }))
                    }
                    listingMode={saleType}
                    area={{
                      buildUp: convertToSqft(
                        areaData.values.buildUp,
                        areaData.units.buildUp
                      ),
                      land: convertToSqft(
                        areaData.values.land,
                        areaData.units.land
                      ),
                    }}
                  />

                  {isRoomRental ? (
                    <RoomRentalForm
                      value={singleFormData.roomRental || {}}
                      onChange={(patch) =>
                        setSingleFormData((p) => ({
                          ...p,
                          roomRental: { ...(p.roomRental || {}), ...patch },
                        }))
                      }
                    />
                  ) : (
                    <>
                      <RoomCountSelector
                        value={{
                          bedrooms: singleFormData.bedrooms,
                          bathrooms: singleFormData.bathrooms,
                          kitchens: singleFormData.kitchens,
                          livingRooms: singleFormData.livingRooms,
                        }}
                        onChange={(patch) =>
                          setSingleFormData((p) => ({ ...p, ...patch }))
                        }
                      />

                      <CarparkCountSelector
                        value={singleFormData.carpark}
                        onChange={(val) =>
                          setSingleFormData((p) => ({ ...p, carpark: val }))
                        }
                        mode={
                          computedStatus === "New Project / Under Construction" ||
                          computedStatus === "Completed Unit / Developer Unit"
                            ? "range"
                            : "single"
                        }
                      />

                      <FacingSelector
                        value={singleFormData.facing}
                        onChange={(val) =>
                          setSingleFormData((p) => ({ ...p, facing: val }))
                        }
                      />

                      <ExtraSpacesSelector
                        value={singleFormData.extraSpaces}
                        onChange={(val) =>
                          setSingleFormData((p) => ({ ...p, extraSpaces: val }))
                        }
                      />

                      <FurnitureSelector
                        value={singleFormData.furniture}
                        onChange={(val) =>
                          setSingleFormData((p) => ({ ...p, furniture: val }))
                        }
                      />

                      <FacilitiesSelector
                        value={singleFormData.facilities}
                        onChange={(val) =>
                          setSingleFormData((p) => ({ ...p, facilities: val }))
                        }
                      />

                      <div>
                        <label className="font-medium">
                          你的产业步行能到达公共交通吗？
                        </label>
                        <TransitSelector
                          value={singleFormData.transit || null}
                          onChange={(info) =>
                            setSingleFormData((p) => ({ ...p, transit: info }))
                          }
                        />
                      </div>

                      {saleType === "Sale" &&
                        computedStatus === "New Project / Under Construction" && (
                          <BuildYearSelector
                            value={singleFormData.buildYear}
                            onChange={(val) =>
                              setSingleFormData((p) => ({
                                ...p,
                                buildYear: val,
                              }))
                            }
                            quarter={singleFormData.quarter}
                            onQuarterChange={(val) =>
                              setSingleFormData((p) => ({ ...p, quarter: val }))
                            }
                            showQuarter
                            label="预计交付时间"
                          />
                        )}

                      {saleType === "Sale" &&
                        [
                          "Completed Unit / Developer Unit",
                          "Subsale / Secondary Market",
                          "Auction Property",
                          "Rent-to-Own Scheme",
                        ].includes(computedStatus) && (
                          <BuildYearSelector
                            value={singleFormData.buildYear}
                            onChange={(val) =>
                              setSingleFormData((p) => ({
                                ...p,
                                buildYear: val,
                              }))
                            }
                            showQuarter={false}
                            label="完成年份"
                          />
                        )}
                    </>
                  )}

                  <div>
                    <label className="block font-medium mb-1">房源描述</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="请输入房源详细描述..."
                      rows={4}
                      className="w-full border rounded-lg p-2 resize-y"
                    />
                  </div>

                  <ImageUpload
                    config={photoConfig}
                    images={singleFormData.photos}
                    setImages={(updated) =>
                      setSingleFormData((p) => ({ ...p, photos: updated }))
                    }
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? "上传中..." : "提交上传"}
      </Button>
    </div>
  );
}
