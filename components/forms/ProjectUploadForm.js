// components/forms/ProjectUploadForm.js
"use client";

import { useEffect, useMemo, useState } from "react";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";
import BuildYearSelector from "@/components/BuildYearSelector";

function createEmptyLayout() {
  return {
    _uiId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
}

export default function ProjectUploadForm({
  saleType,
  computedStatus,

  // ✅ 项目级年份存在 singleFormData
  singleFormData,
  setSingleFormData,

  isBulkRentProject,

  projectCategory,
  setProjectCategory,
  projectSubType,
  setProjectSubType,

  unitLayouts,
  setUnitLayouts,

  enableProjectAutoCopy,

  LAYOUT_CATEGORY_OPTIONS = {},

  pickCommon = (l = {}) => ({
    extraSpaces: l.extraSpaces || [],
    furniture: l.furniture || [],
    facilities: l.facilities || [],
    transit: l.transit || null,
  }),
  cloneDeep = (v) => JSON.parse(JSON.stringify(v || {})),
  commonHash = (l) =>
    JSON.stringify({
      extraSpaces: l?.extraSpaces || [],
      furniture: l?.furniture || [],
      facilities: l?.facilities || [],
      transit: l?.transit || null,
    }),
}) {
  // ✅ 让下拉可“请选择”（不强行默认 2）
  const [layoutCount, setLayoutCount] = useState("");

  // status 切换时，不要残留（符合你之前要求）
  useEffect(() => {
    setLayoutCount("");
    setUnitLayouts([]);
  }, [computedStatus, setUnitLayouts]);

  const categoryOptionsKeys = useMemo(
    () => Object.keys(LAYOUT_CATEGORY_OPTIONS || {}),
    [LAYOUT_CATEGORY_OPTIONS]
  );

  const handleCountChange = (countStr) => {
    const n = Number(countStr);
    setLayoutCount(countStr);

    if (!Number.isFinite(n) || n <= 0) {
      setUnitLayouts([]);
      return;
    }

    setUnitLayouts((prev) => {
      const oldList = Array.isArray(prev) ? prev : [];
      const next = [...oldList];

      if (next.length < n) {
        for (let i = next.length; i < n; i++) next.push(createEmptyLayout());
      } else if (next.length > n) {
        next.splice(n);
      }

      // bulk rent 同步（保留你的逻辑）
      const merged = next.map((oldItem, idx) => {
        const withProjectType =
          isBulkRentProject && projectCategory
            ? {
                propertyCategory: projectCategory,
                subType: projectSubType || oldItem?.subType || "",
              }
            : {};

        const inherit =
          idx === 0
            ? false
            : typeof oldItem?._inheritCommon === "boolean"
            ? oldItem._inheritCommon
            : true;

        return {
          ...(oldItem || {}),
          ...withProjectType,
          _inheritCommon: inherit,
        };
      });

      // 新增 layouts：复制一次 layout0 的 common（保留你的逻辑）
      if (enableProjectAutoCopy && merged.length > 1) {
        const common0 = pickCommon(merged[0] || {});
        return merged.map((l, idx) => {
          if (idx === 0) return l;
          if (l._inheritCommon === false) return l;
          return { ...l, ...cloneDeep(common0) };
        });
      }

      return merged;
    });
  };

  useEffect(() => {
    if (!isBulkRentProject) return;
    if (!projectCategory) return;

    setUnitLayouts((prev) =>
      (Array.isArray(prev) ? prev : []).map((l) => ({
        ...(l || {}),
        propertyCategory: projectCategory,
        subType: projectSubType || "",
      }))
    );
  }, [isBulkRentProject, projectCategory, projectSubType, setUnitLayouts]);

  // ✅ 年份显示规则（按你要求）
  const isNewProject =
    saleType === "Sale" &&
    computedStatus === "New Project / Under Construction";

  const isCompletedLike =
    saleType === "Sale" &&
    [
      "Completed Unit / Developer Unit",
      "Subsale / Secondary Market",
      "Auction Property",
      "Rent-to-Own Scheme",
    ].includes(computedStatus);

  return (
    <>
      {/* ✅✅✅ 项目级：预计完成年份 + 季度（New Project） */}
      {isNewProject && (
        <BuildYearSelector
          value={singleFormData?.buildYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, buildYear: val }))}
          quarter={singleFormData?.quarter}
          onQuarterChange={(val) => setSingleFormData((p) => ({ ...p, quarter: val }))}
          showQuarter
          label="预计完成年份"
        />
      )}

      {/* ✅✅✅ 项目级：完成年份（Completed / Subsale / Auction / RTO） */}
      {isCompletedLike && (
        <BuildYearSelector
          value={singleFormData?.buildYear}
          onChange={(val) => setSingleFormData((p) => ({ ...p, buildYear: val }))}
          showQuarter={false}
          label="完成年份"
        />
      )}

      {/* Bulk Rent 项目：保留你的 UI */}
      {isBulkRentProject && (
        <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
          <div>
            <label className="font-medium">Property Category（整个项目）</label>
            <select
              value={projectCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setProjectCategory(cat);
                setProjectSubType("");

                setUnitLayouts((prev) =>
                  (Array.isArray(prev) ? prev : []).map((l) => ({
                    ...(l || {}),
                    propertyCategory: cat,
                    subType: "",
                  }))
                );
              }}
              className="mt-1 block w-full border rounded-lg p-2"
            >
              <option value="">请选择类别</option>
              {categoryOptionsKeys.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {projectCategory && LAYOUT_CATEGORY_OPTIONS?.[projectCategory] && (
            <div>
              <label className="font-medium">Sub Type（整个项目）</label>
              <select
                value={projectSubType}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectSubType(val);

                  setUnitLayouts((prev) =>
                    (Array.isArray(prev) ? prev : []).map((l) => ({
                      ...(l || {}),
                      subType: val,
                    }))
                  );
                }}
                className="mt-1 block w-full border rounded-lg p-2"
              >
                <option value="">请选择具体类型</option>
                {LAYOUT_CATEGORY_OPTIONS[projectCategory].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ✅ Layout 数量（1~200 由 UnitTypeSelector 控制） */}
      <UnitTypeSelector value={layoutCount} onChange={handleCountChange} min={1} max={200} />

      {/* layouts */}
      {Number(layoutCount) > 0 && (
        <div className="space-y-4 mt-4">
          {(Array.isArray(unitLayouts) ? unitLayouts : []).map((layout, index) => (
            <UnitLayoutForm
              key={layout?._uiId || index}
              index={index}
              data={layout}
              projectCategory={projectCategory}
              projectSubType={projectSubType}
              lockCategory={isBulkRentProject}
              enableCommonCopy={enableProjectAutoCopy}
              onChange={(updated, meta) => {
                setUnitLayouts((prev) => {
                  const base = Array.isArray(prev) ? prev : [];
                  const next = [...base];

                  const prevLayout = base[index] || {};
                  const updatedLayout = { ...prevLayout, ...updated };

                  if (index === 0) updatedLayout._inheritCommon = false;
                  if (index > 0 && typeof updatedLayout._inheritCommon !== "boolean") {
                    updatedLayout._inheritCommon =
                      typeof prevLayout._inheritCommon === "boolean"
                        ? prevLayout._inheritCommon
                        : true;
                  }

                  const commonKeys = new Set(["extraSpaces", "furniture", "facilities", "transit"]);

                  if (enableProjectAutoCopy && meta?.commonField && commonKeys.has(meta.commonField)) {
                    if (index > 0) updatedLayout._inheritCommon = false;
                  }

                  if (enableProjectAutoCopy && meta?.inheritToggle && index > 0) {
                    if (updatedLayout._inheritCommon !== false) {
                      const common0 = pickCommon(base[0] || {});
                      Object.assign(updatedLayout, cloneDeep(common0));
                    }
                  }

                  if (enableProjectAutoCopy && index > 0) {
                    const prevH = commonHash(prevLayout);
                    const nextH = commonHash(updatedLayout);
                    if (prevH !== nextH) updatedLayout._inheritCommon = false;
                  }

                  next[index] = updatedLayout;

                  if (enableProjectAutoCopy && index === 0) {
                    const prevH = commonHash(prevLayout);
                    const nextH = commonHash(updatedLayout);
                    if (prevH !== nextH) {
                      const common0 = pickCommon(updatedLayout);
                      for (let i = 1; i < next.length; i++) {
                        const li = next[i] || {};
                        if (li._inheritCommon !== false) {
                          next[i] = { ...li, ...cloneDeep(common0) };
                        }
                      }
                    }
                  }

                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
