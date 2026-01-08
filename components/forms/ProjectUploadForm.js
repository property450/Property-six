// components/forms/ProjectUploadForm.js
"use client";

import { useEffect, useMemo, useState } from "react";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";
import BuildYearSelector from "@/components/BuildYearSelector";

/* ===== 工具 ===== */
function createEmptyLayout() {
  return {
    _uiId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
}

export default function ProjectUploadForm({
  saleType,
  computedStatus,

  // 项目级年份（由 upload-property.js 传入 singleFormData）
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
  /* ===== Layout 数量（不自动默认） ===== */
  const [layoutCount, setLayoutCount] = useState("");

  useEffect(() => {
    setLayoutCount("");
    setUnitLayouts([]);
  }, [computedStatus, setUnitLayouts]);

  const handleCountChange = (count) => {
    const n = Number(count);
    setLayoutCount(count);

    if (!Number.isFinite(n) || n <= 0) {
      setUnitLayouts([]);
      return;
    }

    setUnitLayouts((prev) => {
      const old = Array.isArray(prev) ? prev : [];
      const next = [...old];

      if (next.length < n) {
        for (let i = next.length; i < n; i++) {
          next.push(createEmptyLayout());
        }
      } else if (next.length > n) {
        next.splice(n);
      }
      return next;
    });
  };

  /* ===== 是否 New Project ===== */
  const isNewProject =
    saleType === "Sale" &&
    computedStatus === "New Project / Under Construction";

  /* ===== 是否 Completed / Subsale / Auction / RTO ===== */
  const isCompletedLike =
    saleType === "Sale" &&
    [
      "Completed Unit / Developer Unit",
      "Subsale / Secondary Market",
      "Auction Property",
      "Rent-to-Own Scheme",
    ].includes(computedStatus);

  return (
    <div className="space-y-4">
      {/* ===== 年份选择（项目级） ===== */}

      {isNewProject && (
        <BuildYearSelector
          value={singleFormData?.buildYear}
          onChange={(val) =>
            setSingleFormData((p) => ({ ...p, buildYear: val }))
          }
          quarter={singleFormData?.quarter}
          onQuarterChange={(val) =>
            setSingleFormData((p) => ({ ...p, quarter: val }))
          }
          showQuarter
          label="预计完成年份"
        />
      )}

      {isCompletedLike && (
        <BuildYearSelector
          value={singleFormData?.buildYear}
          onChange={(val) =>
            setSingleFormData((p) => ({ ...p, buildYear: val }))
          }
          showQuarter={false}
          label="完成年份"
        />
      )}

      {/* ===== Layout 数量 ===== */}
      <UnitTypeSelector
        value={layoutCount}
        onChange={handleCountChange}
        min={1}
        max={200}
      />

      {/* ===== Layout 表单 ===== */}
      {Number(layoutCount) > 0 && (
        <div className="space-y-4 mt-4">
          {(Array.isArray(unitLayouts) ? unitLayouts : []).map(
            (layout, index) => (
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
                    const updatedLayout = {
                      ...prevLayout,
                      ...updated,
                    };

                    // ===== 以下保持你原本的复制 / 脱钩逻辑 =====
                    if (index === 0) updatedLayout._inheritCommon = false;
                    if (
                      index > 0 &&
                      typeof updatedLayout._inheritCommon !== "boolean"
                    ) {
                      updatedLayout._inheritCommon =
                        typeof prevLayout._inheritCommon === "boolean"
                          ? prevLayout._inheritCommon
                          : true;
                    }

                    const commonKeys = new Set([
                      "extraSpaces",
                      "furniture",
                      "facilities",
                      "transit",
                    ]);

                    if (
                      enableProjectAutoCopy &&
                      meta?.commonField &&
                      commonKeys.has(meta.commonField)
                    ) {
                      if (index > 0) updatedLayout._inheritCommon = false;
                    }

                    if (enableProjectAutoCopy && meta?.inheritToggle && index > 0) {
                      if (updatedLayout._inheritCommon !== false) {
                        const common0 = pickCommon(base[0] || {});
                        Object.assign(updatedLayout, cloneDeep(common0));
                      }
                    }

                    if (enableProjectAutoCopy && index > 0) {
                      if (
                        commonHash(prevLayout) !==
                        commonHash(updatedLayout)
                      ) {
                        updatedLayout._inheritCommon = false;
                      }
                    }

                    next[index] = updatedLayout;

                    if (enableProjectAutoCopy && index === 0) {
                      if (
                        commonHash(prevLayout) !==
                        commonHash(updatedLayout)
                      ) {
                        const common0 = pickCommon(updatedLayout);
                        for (let i = 1; i < next.length; i++) {
                          if (next[i]?._inheritCommon !== false) {
                            next[i] = {
                              ...next[i],
                              ...cloneDeep(common0),
                            };
                          }
                        }
                      }
                    }

                    return next;
                  });
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
