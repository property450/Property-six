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
 * Supabase 报错 PGRST204 时，通常类似：
 * "Could not find the 'xxx' column of 'properties' in the schema cache"
 */
function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

/**
 * ✅ 关键字段：这些一旦没写进 DB，就会出现你说的：
 * “保存后不记住 / 回编辑又要重选 / 日历价格不记住”
 *
 * 重点：这些字段绝对不能像你现在那样被 auto-strip 删除。
 */
const PROTECTED_KEYS = new Set([
  "typeForm",
  "type_form",
  "singleFormData",
  "single_form_data",
  "areaData",
  "area_data",
  "unitLayouts",
  "unit_layouts",
]);

/**
 * ✅ 当 Supabase 缺 column，但只是命名不一致（camel vs snake）时：
 * - missing = "typeForm"   -> 把 payload.typeForm 改名为 payload.type_form 再重试
 * - missing = "type_form"  -> 反过来
 *
 * 这样你不用猜你 DB 里到底是哪一个 column。
 */
function trySwapProtectedKey(working, missing) {
  const pairs = [
    ["typeForm", "type_form"],
    ["singleFormData", "single_form_data"],
    ["areaData", "area_data"],
    ["unitLayouts", "unit_layouts"],
  ];

  for (const [camel, snake] of pairs) {
    if (missing === camel && Object.prototype.hasOwnProperty.call(working, camel)) {
      working[snake] = working[camel];
      delete working[camel];
      return { swapped: true, from: camel, to: snake };
    }
    if (missing === snake && Object.prototype.hasOwnProperty.call(working, snake)) {
      working[camel] = working[snake];
      delete working[snake];
      return { swapped: true, from: snake, to: camel };
    }
  }
  return { swapped: false };
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 10 }) {
  // mode: "insert" | "update"
  let working = { ...(payload || {}) };
  let tries = 0;
  const removed = [];
  const swapped = [];

  while (tries < maxTries) {
    tries += 1;

    let res;
    if (mode === "update") {
      res = await supabase
        .from("properties")
        .update(working)
        .eq("id", editId)
        .eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert([working]);
    }

    if (!res?.error) {
      return { ok: true, removed, swapped, result: res };
    }

    const err = res.error;
    console.error("[Supabase Error]", err);

    const missing = extractMissingColumnName(err);

    // 只处理“缺 column”错误
    if (err?.code === "PGRST204" && missing) {
      // ✅✅✅ 关键字段：不允许删除！先尝试 camel/snake 互换后重试
      if (PROTECTED_KEYS.has(missing)) {
        const s = trySwapProtectedKey(working, missing);
        if (s.swapped) {
          swapped.push(`${s.from} -> ${s.to}`);
          continue;
        }

        // 没法互换（说明 DB 真的缺这个关键 column）
        return {
          ok: false,
          removed,
          swapped,
          error: err,
          protectedMissing: missing,
        };
      }

      // ✅ 非关键字段：才允许 auto-strip（保留你原来的策略）
      if (!Object.prototype.hasOwnProperty.call(working, missing)) {
        return { ok: false, removed, swapped, error: err };
      }

      delete working[missing];
      removed.push(missing);
      continue;
    }

    return { ok: false, removed, swapped, error: err };
  }

  return {
    ok: false,
    removed,
    swapped,
    error: new Error("自动处理次数用尽（请看 Console 报错）"),
  };
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  const [submitting, setSubmitting] = useState(false);

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

  const isRentBatch =
    saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

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

  // ✅ 编辑模式：读取房源并回填（支持 camel/snake 两种）
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

        // ✅ 回填关键：优先 camel，不存在就用 snake
        const tf = data.typeForm ?? data.type_form ?? null;
        const sfd = data.singleFormData ?? data.single_form_data ?? {};
        const ad = data.areaData ?? data.area_data ?? areaData;
        const uls = data.unitLayouts ?? data.unit_layouts ?? [];

        setTypeForm(tf);

        if (data.lat && data.lng) {
          setAddressObj({
            address: data.address || data.location || "",
            lat: data.lat,
            lng: data.lng,
          });
        }

        if (typeof data.type === "string") setTypeValue(data.type);

        setSaleType((tf && tf.saleType) || data.saleType || data.sale_type || "");
        setComputedStatus((tf && tf.propertyStatus) || data.propertyStatus || data.property_status || "");
        setRoomRentalMode((tf && tf.roomRentalMode) || data.roomRentalMode || data.room_rental_mode || "whole");
        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);

        setProjectCategory(data.projectCategory || "");
        setProjectSubType(data.projectSubType || "");
        setUnitLayouts(Array.isArray(uls) ? uls : []);
        setSingleFormData(sfd || {});
        setAreaData(ad || areaData);
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
      // ✅✅✅ 关键：先用 camelCase 发起保存
      // 如果 DB 实际是 snake_case，会在 runWithAutoStripColumns 里自动 swap 再重试
      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        type: typeValue,

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
          // ✅ 缺关键 column：明确告诉你缺哪个（不会再“假成功”）
          if (out.protectedMissing) {
            toast.error(`保存失败：Supabase 缺少关键 column：${out.protectedMissing}`);
            alert(
              `保存失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
                `你必须在 Supabase properties 表新增这个 column（建议类型 jsonb），不然“保存后不记住”一定会发生。\n\n` +
                `（请看 Console 的 [Supabase Error]）`
            );
            return;
          }

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

        if (out.swapped?.length) {
          console.log("[Save] swapped keys:", out.swapped);
        }
        if (out.removed?.length) {
          console.log("[Save] removed non-critical keys:", out.removed);
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
        if (out.protectedMissing) {
          toast.error(`提交失败：Supabase 缺少关键 column：${out.protectedMissing}`);
          alert(
            `提交失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
              `你必须在 Supabase properties 表新增这个 column（建议类型 jsonb），不然“保存后不记住”一定会发生。\n\n` +
              `（请看 Console 的 [Supabase Error]）`
          );
          return;
        }

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
        initialForm={typeForm}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={(form) => {
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
        <HomestayUploadForm
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) =>
            setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))
          }
        />
      ) : isHotel ? (
        <HotelUploadForm
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) =>
            setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))
          }
        />
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
