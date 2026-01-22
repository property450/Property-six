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

/**
 * ✅ Supabase 报错 PGRST204 时，会有类似：
 * "Could not find the 'propertyStatus' column of 'properties' in the schema cache"
 * 我们把 column 名抓出来，然后从 payload 删除再重试。
 */
function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 8 }) {
  // mode: "insert" | "update"
  let working = { ...(payload || {}) };
  let tries = 0;
  const removed = [];

  while (tries < maxTries) {
    tries += 1;

    let res;
    if (mode === "update") {
      res = await supabase.from("properties").update(working).eq("id", editId).eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert([working]);
    }

    if (!res?.error) {
      return { ok: true, removed, result: res };
    }

    const err = res.error;

    // ✅ 把真正的错误打印出来（你要看 Console 的就是这个）
    console.error("[Supabase Error]", err);

    // ✅ 只有 PGRST204（缺 column）才自动剔除
    const missing = extractMissingColumnName(err);
    if (err?.code === "PGRST204" && missing) {
      // 如果 payload 里没有这个 key，就别死循环了
      if (!Object.prototype.hasOwnProperty.call(working, missing)) {
        return { ok: false, removed, error: err };
      }
      delete working[missing];
      removed.push(missing);

      // 继续下一轮尝试
      continue;
    }

    // ✅ 其它错误直接退出（例如 RLS、权限、类型不对、id 不存在）
    return { ok: false, removed, error: err };
  }

  return {
    ok: false,
    removed,
    error: new Error("自动删除 column 次数用尽（请看 Console 报错）"),
  };
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

  // ✅ 这些是前端用的（不要直接写入 DB 的对象字段，除非你表里真有 json column）
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
    // ✅ 默认只勾 build up
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

  // ✅ 房间出租时不允许进入 batch
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
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "" });

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

        // ✅✅✅【最小新增】回填 typeForm，让 TypeSelector 能记住你之前保存的选择
        setTypeForm(data.typeForm || null);

        // ✅ 模式
        // 优先用 typeForm 里的（如果有），没有再用旧字段（兼容你旧数据）
        const tf = data.typeForm || null;
        setSaleType((tf && tf.saleType) || data.saleType || data.sale_type || "");
        setComputedStatus((tf && tf.propertyStatus) || data.propertyStatus || data.property_status || "");
        setRoomRentalMode((tf && tf.roomRentalMode) || data.roomRentalMode || data.room_rental_mode || "whole");
        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);

        // ✅ 这些只有在你 DB 确实有 json 字段时才会存在；不存在也不会影响
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
      // ✅ 你的原 payload 保持不动，只【最小新增】写入 typeForm（用于“记住选择”）
      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        type: typeValue,

        // ✅✅✅【最小新增】把 TypeSelector 的所有选择一次性存进去
        typeForm: typeForm || null,

        roomRentalMode,
        rentBatchMode,

        unitLayouts,
        singleFormData,
        areaData,
        description,

        updated_at: new Date().toISOString(),
      };

      if (isEditMode) {
        const out = await runWithAutoStripColumns({
          mode: "update",
          payload,
          editId,
          userId: user.id,
          maxTries: 10,
        });

        if (!out.ok) {
          const missing = extractMissingColumnName(out.error);
          if (missing) {
            toast.error(`提交失败：Supabase 缺少 column：${missing}`);
            alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
          } else {
            toast.error("提交失败（请看 Console 报错）");
            alert("提交失败（请看 Console 报错）");
          }
          return;
        }

        if (out.removed?.length) {
          console.warn("[Auto removed columns]", out.removed);
        }

        toast.success("保存修改成功");
        alert("保存修改成功");
        router.push("/my-profile");
        return;
      }

      const out = await runWithAutoStripColumns({
        mode: "insert",
        payload: { ...payload, created_at: new Date().toISOString() },
        userId: user.id,
        maxTries: 10,
      });

      if (!out.ok) {
        const missing = extractMissingColumnName(out.error);
        if (missing) {
          toast.error(`提交失败：Supabase 缺少 column：${missing}`);
          alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
        } else {
          toast.error("提交失败（请看 Console 报错）");
          alert("提交失败（请看 Console 报错）");
        }
        return;
      }

      if (out.removed?.length) {
        console.warn("[Auto removed columns]", out.removed);
      }

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

      {(mustLogin || mustPickSaleType || mustPickAddress) && (
        <div className="border rounded-xl bg-yellow-50 p-3 text-sm text-yellow-900">
          <div className="font-semibold mb-1">当前还不能提交，因为：</div>
          <ul className="list-disc pl-5 space-y-1">
            {mustLogin && <li>你还没登录（user 还是 null）</li>}
            {mustPickSaleType && <li>你还没选择 Sale / Rent / Homestay / Hotel</li>}
            {mustPickAddress && <li>你还没选择地址（lat/lng 为空）</li>}
          </ul>
        </div>
      )}

      <AddressSearchInput value={addressObj} onChange={setAddressObj} />

      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        // ✅✅✅【最小新增】把编辑读取到的 typeForm 传进去，让 TypeSelector 回填
        initialForm={typeForm}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={(form) => {
          // ✅ 关键：避免无限更新（maximum update depth）
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
