// pages/upload-property.js
"use client";

import { useState, useEffect, useRef } from "react";
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

const pickCommon = (l) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit ?? null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

function stableJson(obj) {
  try {
    return JSON.stringify(obj ?? null);
  } catch {
    return "";
  }
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  // ✅ 编辑模式识别：/upload-property?edit=1&id=xxx
  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  const [submitting, setSubmitting] = useState(false);

  const [addressObj, setAddressObj] = useState(null);

  // 前端 state（不一定对应 DB column）
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
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(
      computedStatus
    );

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

  const rawLayoutCount = Number(typeForm?.layoutCount);
  const batchLayoutCount = Math.max(
    2,
    Math.min(20, Number.isFinite(rawLayoutCount) ? rawLayoutCount : 2)
  );

  const rawRoomCount = Number(typeForm?.roomCount);
  const roomLayoutCount =
    roomRentalMode === "room"
      ? typeForm?.roomCountMode === "multi"
        ? Math.max(2, Math.min(20, Number.isFinite(rawRoomCount) ? rawRoomCount : 2))
        : 1
      : 1;

  // ✅ 记住上一次 onFormChange 的值，避免无限 setState 循环
  const lastFormJsonRef = useRef("");
  const lastFormRef = useRef(null);
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "" });

  // ✅ 记录 DB schema（靠 select * 回来的 keys 判断你到底用 camel 还是 snake）
  const schemaKeysRef = useRef(null);
  const setSchemaKeysFromRow = (row) => {
    if (!row || typeof row !== "object") return;
    const keys = Object.keys(row);
    if (keys.length) schemaKeysRef.current = keys;
  };
  const pickCol = (candidates) => {
    const keys = schemaKeysRef.current;
    if (!Array.isArray(keys)) return null;
    return candidates.find((c) => keys.includes(c)) || null;
  };

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
      setUnitLayouts([]);
      return;
    }

    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: roomLayoutCount }).map((_, i) => prevArr[i] || {});
    });
  }, [saleTypeNorm, roomRentalMode, isRentBatch, roomLayoutCount]);

  // ✅ 编辑模式：读取房源并回填
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
          alert("找不到该房源");
          return;
        }

        // ✅ 记录 schema keys（用来决定保存时写哪个 column 名）
        setSchemaKeysFromRow(data);

        // ✅ 地址
        if (data.lat && data.lng) {
          setAddressObj({
            address: data.address || data.location || "",
            lat: data.lat,
            lng: data.lng,
          });
        }

        // ✅ 类型（把 DB 的 type 映射回 typeValue）
        if (typeof data.type === "string") setTypeValue(data.type);

        // ✅ 模式（兼容多种字段名回填）
        setSaleType(data.saleType || data.sale_type || "");
        setComputedStatus(data.propertyStatus || data.property_status || "");
        setRoomRentalMode(data.roomRentalMode || data.room_rental_mode || "whole");
        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);

        // 其他字段：有就回填，没有就不影响
        setProjectCategory(data.projectCategory || "");
        setProjectSubType(data.projectSubType || "");
        setUnitLayouts(Array.isArray(data.unitLayouts) ? data.unitLayouts : []);
        setSingleFormData(data.singleFormData || {});
        setAreaData(data.areaData || areaData);
        setDescription(typeof data.description === "string" ? data.description : "");

        toast.success("已进入编辑模式");
      } catch (e) {
        console.error(e);
        toast.error("无法加载房源进行编辑");
        alert("无法加载房源进行编辑（请看 Console 报错）");
      }
    };

    fetchForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId, user]);

  const mustLogin = !user;
  const mustPickSaleType = !saleType;
  const mustPickAddress = !addressObj?.lat || !addressObj?.lng;

  const probeSchemaIfNeeded = async () => {
    if (Array.isArray(schemaKeysRef.current)) return;
    try {
      const { data } = await supabase.from("properties").select("*").limit(1);
      if (Array.isArray(data) && data[0]) setSchemaKeysFromRow(data[0]);
    } catch {
      // ignore
    }
  };

  // ✅✅✅ 提交：新增 / 编辑共用（重点：不要 update 不存在的 column）
  const handleSubmit = async () => {
    if (mustLogin) {
      toast.error("请先登录");
      alert("请先登录（你现在 user 还是 null）");
      return;
    }
    if (mustPickSaleType) {
      toast.error("请选择 Sale / Rent / Homestay / Hotel");
      alert("请选择 Sale / Rent / Homestay / Hotel（你现在 saleType 还是空）");
      return;
    }
    if (mustPickAddress) {
      toast.error("请选择地址");
      alert("请选择地址（你现在 lat/lng 还是空）");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      // ✅ 先探测一次 schema（避免你表是 snake_case 导致 400）
      await probeSchemaIfNeeded();

      const payload = {
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,
        type: typeValue,
        description,
        updated_at: new Date().toISOString(),
      };

      // ✅ saleType column（自动选）
      const saleTypeCol = pickCol(["saleType", "sale_type"]);
      if (saleTypeCol) payload[saleTypeCol] = saleType;

      // ✅ propertyStatus column（自动选，避免你现在报的 PGRST204）
      const statusCol = pickCol(["propertyStatus", "property_status"]);
      if (statusCol) payload[statusCol] = computedStatus;

      if (isEditMode) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", editId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("保存修改成功");
        alert("保存修改成功");
        router.push("/my-profile");
        return;
      }

      const insertPayload = {
        ...payload,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("properties").insert([insertPayload]);

      if (error) throw error;

      toast.success("提交成功");
      alert("提交成功");
      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("提交失败");
      alert("提交失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error("请先登录");
      alert("请先登录");
      return;
    }
    if (!isEditMode) return;

    const ok = confirm("确定要删除这个房源吗？此操作不可恢复。");
    if (!ok) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", editId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("房源已删除");
      alert("房源已删除");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowProjectTrustSection =
    isProject && Array.isArray(unitLayouts) && unitLayouts.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <AddressSearchInput
        onLocationSelect={(loc) => {
          setAddressObj(loc);
        }}
      />

      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={(form) => {
          // ✅ 关键：避免无限更新（maximum update depth）
          if (form === lastFormRef.current) return;
          lastFormRef.current = form;

          const nextJson = stableJson(form);
          if (nextJson && nextJson === lastFormJsonRef.current) return;
          lastFormJsonRef.current = nextJson;

          setTypeForm((prev) => {
            const prevJson = stableJson(prev);
            if (prevJson === nextJson) return prev;
            return form || null;
          });

          const nextSale = form?.saleType || "";
          const nextStatus = form?.propertyStatus || "";
          const nextRoom = form?.roomRentalMode || "whole";

          const last = lastDerivedRef.current;
          if (last.saleType !== nextSale) setSaleType(nextSale);
          if (last.status !== nextStatus) setComputedStatus(nextStatus);
          if (last.roomMode !== nextRoom) setRoomRentalMode(nextRoom);

          lastDerivedRef.current = { saleType: nextSale, status: nextStatus, roomMode: nextRoom };
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

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full disabled:opacity-60"
      >
        {submitting ? "处理中..." : isEditMode ? "保存修改" : "提交房源"}
      </Button>

      {isEditMode && (
        <Button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          variant="destructive"
          className="w-full disabled:opacity-60"
        >
          {submitting ? "处理中..." : "删除房源"}
        </Button>
      )}
    </div>
  );
}
