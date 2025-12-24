// pages/upload-property.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";

// ✅ 你已经有这两个文件：直接正常 import（不要 require/try-catch，避免不显示）
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

export default function UploadPropertyPage() {
  const router = useRouter();

  // TypeSelector 的最终字符串（你 TypeSelector 会自动生成，例如 "Homestay - Entire Place"）
  const [typeValue, setTypeValue] = useState("");

  // TypeSelector 回传的完整表单结构（最关键：决定显示什么表单）
  const [typeForm, setTypeForm] = useState(null);

  // Rent 批量模式（你 TypeSelector 会控制显示/隐藏）
  const [rentBatchMode, setRentBatchMode] = useState("no");

  // ✅ New Project / Completed Unit：房型数量（layout 数量）
  const [projectLayoutCount, setProjectLayoutCount] = useState(""); // "1","2"... string

  // layouts（每个 layout 对应一个 UnitLayoutForm）
  const [layouts, setLayouts] = useState([]);

  const saleType = typeForm?.saleType || ""; // Sale / Rent / Homestay / Hotel/Resort
  const propertyStatus = typeForm?.propertyStatus || ""; // New Project / Completed Unit / Subsale...
  const isProjectStatus =
    propertyStatus === "New Project / Under Construction" ||
    propertyStatus === "Completed Unit / Developer Unit";

  // ✅ 你原本的需求：New Project / Completed Unit 必须先选 layout 数量，才出现 layout 表单
  const shouldAskProjectLayoutCount = saleType === "Sale" && isProjectStatus;

  // 将 projectLayoutCount 映射成数字
  const projectCountNumber = useMemo(() => {
    const n = Number(String(projectLayoutCount || "").trim());
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }, [projectLayoutCount]);

  // ✅ 当切换到非 project 模式时，清掉 projectLayoutCount，避免影响其它模式
  useEffect(() => {
    if (!shouldAskProjectLayoutCount) {
      setProjectLayoutCount("");
      setLayouts([]);
      return;
    }
    // 在 project 模式下，如果用户还没选数量，就先清空 layouts
    if (!projectCountNumber) {
      setLayouts([]);
      return;
    }
    // project 模式下：确保 layouts 数量 = projectCountNumber
    setLayouts((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      // 补足
      while (next.length < projectCountNumber) next.push({ name: `Layout ${next.length + 1}` });
      // 截断
      if (next.length > projectCountNumber) next.length = projectCountNumber;
      return next;
    });
  }, [shouldAskProjectLayoutCount, projectCountNumber]);

  // ✅ 提交（这里不动你 supabase 提交逻辑：你把你原本的 submit 逻辑放回这里即可）
  const handleSubmit = async () => {
    if (!saleType) {
      toast.error("请先选择 Sale / Rent / Homestay / Hotel/Resort");
      return;
    }

    if (shouldAskProjectLayoutCount && !projectCountNumber) {
      toast.error("请先选择这个项目有多少个房型/layout");
      return;
    }

    // 你后面可以用这些数据去提交：
    // - typeValue（最终类型字符串）
    // - typeForm（TypeSelector 的所有选择）
    // - layouts（每个 layout 的表单数据）
    toast.success("OK（类型/房型数量已正确）——你可接回原本提交逻辑");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Upload Property</h1>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back
        </Button>
      </div>

      {/* ✅ TypeSelector 一定要把 onFormChange 接起来，否则 Homestay/Hotel 不会切表单 */}
      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        onFormChange={setTypeForm}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
      />

      {/* ✅ Homestay / Hotel：直接切换到你独立表单 */}
      {saleType === "Homestay" && (
        <div className="border rounded-lg p-4">
          <HomestayUploadForm typeValue={typeValue} typeForm={typeForm} />
        </div>
      )}

      {saleType === "Hotel/Resort" && (
        <div className="border rounded-lg p-4">
          <HotelUploadForm typeValue={typeValue} typeForm={typeForm} />
        </div>
      )}

      {/* ✅ 非 Homestay/Hotel 的一般表单区（Sale / Rent / etc） */}
      {saleType && saleType !== "Homestay" && saleType !== "Hotel/Resort" && (
        <div className="space-y-4">
          {/* ✅ New Project / Completed Unit：先选房型数量 */}
          {shouldAskProjectLayoutCount && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="font-semibold">这个项目有多少个房型/layout？</div>
              <select
                className="w-full border rounded-md p-2"
                value={projectLayoutCount}
                onChange={(e) => setProjectLayoutCount(e.target.value)}
              >
                <option value="">请选择</option>
                {Array.from({ length: 30 }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              {/* 你原本的需求：没选数量前，下面的 layout 表单要隐藏 */}
              {!projectCountNumber && (
                <div className="text-sm text-gray-500">
                  请选择房型数量后，才会显示每个房型的面积、价格、房间数、图片等输入表单。
                </div>
              )}
            </div>
          )}

          {/* ✅ Layout 表单：只有在非 project 模式，或 project 模式选了数量后才显示 */}
          {(!shouldAskProjectLayoutCount || projectCountNumber > 0) && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="font-semibold">Layouts</div>

              {layouts.length === 0 && !shouldAskProjectLayoutCount && (
                <div className="text-sm text-gray-500">（这里是你的普通模式表单区域，你可以继续接回你原本完整内容）</div>
              )}

              {layouts.map((layout, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <UnitLayoutForm
                    index={idx}
                    data={layout}
                    onChange={(updated) => {
                      setLayouts((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = updated;
                        return next;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
}
