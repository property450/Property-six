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
import ListingTrustSection from "@/components/trust/ListingTrustSection";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

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

  // ✅✅✅ 编辑模式识别：/upload-property?edit=1&id=xxx
  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  const [addressObj, setAddressObj] = useState(null);

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
    // ✅ 按你要求：默认只勾 build up
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [description, setDescription] = useState("");

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  // ✅✅✅ Sale 模式下这些属于 Project（有 layout 数量 + layout 表单）
  const isProject =
    saleTypeNorm === "sale" &&
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(computedStatus);

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  // ✅ 房间出租时不允许进入 batch
  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

  const rawLayoutCount = Number(typeForm?.layoutCount);
  const batchLayoutCount = Math.max(2, Math.min(20, Number.isFinite(rawLayoutCount) ? rawLayoutCount : 2));

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

  // ✅✅✅ 编辑模式：读取房源数据并回填（只加，不动你原本逻辑）
  useEffect(() => {
    if (!isEditMode) return;
    if (!user) return;
    if (!editId) return;

    const fetchForEdit = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("找不到该房源");
          return;
        }

        // ✅ 回填：尽量“按你现有 state 名称”读取（字段不存在也不会崩）
        // 地址（AddressSearchInput 需要 {address, lat, lng}）
        const nextAddress =
          data.addressObj ||
          (data.lat && data.lng
            ? { address: data.address || data.location || "", lat: data.lat, lng: data.lng }
            : null);
        if (nextAddress) setAddressObj(nextAddress);

        // TypeSelector & 模式
        if (typeof data.typeValue === "string") setTypeValue(data.typeValue);
        else if (typeof data.type === "string") setTypeValue(data.type);

        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);
        if (data.typeForm) setTypeForm(data.typeForm);

        setSaleType(data.saleType || data.sale_type || "");
        setComputedStatus(data.propertyStatus || data.property_status || "");
        setRoomRentalMode(data.roomRentalMode || data.room_rental_mode || "whole");

        // Project fields
        setProjectCategory(data.projectCategory || "");
        setProjectSubType(data.projectSubType || "");

        // Forms
        setUnitLayouts(Array.isArray(data.unitLayouts) ? data.unitLayouts : Array.isArray(data.unit_layouts) ? data.unit_layouts : []);
        setSingleFormData(data.singleFormData || data.single_form_data || {});
        setAreaData(data.areaData || data.area_data || areaData);
        setDescription(typeof data.description === "string" ? data.description : "");

        toast.success("已进入编辑模式");
      } catch (e) {
        console.error(e);
        toast.error("无法加载房源进行编辑");
      }
    };

    fetchForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId, user]);

  // ✅✅✅ 提交：新增 / 编辑共用
  const handleSubmit = async () => {
    try {
      if (!user) return toast.error("请先登录");
      if (!saleType) return toast.error("请选择 Sale / Rent / Homestay / Hotel");
      if (!addressObj?.lat || !addressObj?.lng) return toast.error("请选择地址");

      // ✅ 统一 payload（尽量不假设你 DB 一定有所有字段；少量字段也能跑）
      const payload = {
        user_id: user.id,
        // 地址
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,
        addressObj,

        // 模式 / 类型
        saleType,
        propertyStatus: computedStatus,
        roomRentalMode,
        rentBatchMode,
        typeValue,
        typeForm,

        // 表单数据
        projectCategory,
        projectSubType,
        unitLayouts,
        singleFormData,
        areaData,
        description,

        updated_at: new Date().toISOString(),
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", editId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("保存修改成功");
        router.push("/my-profile");
        return;
      }

      // 新增
      const { error } = await supabase.from("properties").insert([
        {
          ...payload,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("提交成功");
      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("提交失败");
    }
  };

  // ✅✅✅ 删除（仅编辑模式显示）
  const handleDelete = async () => {
    try {
      if (!user) return toast.error("请先登录");
      if (!isEditMode) return;
      const ok = confirm("确定要删除这个房源吗？此操作不可恢复。");
      if (!ok) return;

      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", editId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("房源已删除");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
    }
  };

  // ✅ New Project / Completed Unit：必须 layout 表单已经生成才显示 trust section
  const shouldShowProjectTrustSection =
    isProject && Array.isArray(unitLayouts) && unitLayouts.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>

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

      {isHomestay ? (
        <HomestayUploadForm />
      ) : isHotel ? (
        <HotelUploadForm />
      ) : isProject ? (
        <>
          <ProjectUploadForm
            saleType={saleType}
            computedStatus={computedStatus}
            isBulkRentProject={false}
            projectCategory={projectCategory}
            setProjectCategory={setProjectCategory}
            projectSubType={projectSubType}
            setProjectSubType={setProjectSubType}
            unitLayouts={unitLayouts}
            setUnitLayouts={setUnitLayouts}
            enableProjectAutoCopy={computedStatus === "New Project / Under Construction"}
            pickCommon={pickCommon}
            commonHash={commonHash}
          />

          {/* ✅ 只在 layout 表单生成后才显示（避免你说的“还没选 layout 数量就出现”） */}
          {shouldShowProjectTrustSection && (
            <ListingTrustSection
              mode={
                computedStatus === "New Project / Under Construction"
                  ? "new_project"
                  : "completed_unit"
              }
              value={singleFormData?.trustSection || {}}
              onChange={(next) =>
                setSingleFormData((prev) => ({
                  ...(prev || {}),
                  trustSection: next,
                }))
              }
            />
          )}
        </>
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
          propertyCategory={typeForm?.category || typeForm?.propertyCategory || ""}
        />
      )}

      {/* ✅✅✅ 按钮区：编辑模式=保存修改+删除；新增=提交房源 */}
      <Button
        onClick={handleSubmit}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {isEditMode ? "保存修改" : "提交房源"}
      </Button>

      {isEditMode && (
        <Button
          onClick={handleDelete}
          variant="destructive"
          className="w-full"
        >
          删除房源
        </Button>
      )}
    </div>
  );
}
