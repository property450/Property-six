// components/forms/ProjectUploadForm.js
"use client";

import { useEffect, useMemo, useState } from "react";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";

function createEmptyLayout() {
  return {
    _uiId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
}

export default function ProjectUploadForm({
  computedStatus,
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
  /**
   * ✅ 关键修复：
   * layoutCount 不再从 unitLayouts.length 推导
   * 而是独立 state，默认空白
   */
  const [layoutCount, setLayoutCount] = useState("");

  /**
   * ✅ 切换 New Project / Completed Unit 时
   * 重置 layout 数量 & 表单，避免残留
   */
  useEffect(() => {
    setLayoutCount("");
    setUnitLayouts([]);
  }, [computedStatus, setUnitLayouts]);

  const categoryOptionsKeys = useMemo(
    () => Object.keys(LAYOUT_CATEGORY_OPTIONS || {}),
    [LAYOUT_CATEGORY_OPTIONS]
  );

  /**
   * ✅ 用户真的选了数量，才生成 layouts
   * 范围：1 ~ 200
   */
  const handleCountChange = (count) => {
    const n = Number(count);

    setLayoutCount(count);

    if (!Number.isFinite(n) || n <= 0) {
      setUnitLayouts([]);
      return;
    }

    setUnitLayouts((prev) => {
      const oldList = Array.isArray(prev) ? prev : [];
      const next = [...oldList];

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

  // bulk rent：同步 category / subtype（原逻辑不动）
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

  return (
    <>
      {/* Bulk Rent 项目（你原本逻辑） */}
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

      {/* ✅ New Project / Completed Unit：Layout 数量（1 ~ 200，默认请选择） */}
      <UnitTypeSelector
        value={layoutCount}
        onChange={handleCountChange}
        min={1}
        max={200}
      />

      {/* Layout 表单 */}
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
                    if (commonHash(prevLayout) !== commonHash(updatedLayout)) {
                      updatedLayout._inheritCommon = false;
                    }
                  }

                  next[index] = updatedLayout;

                  if (enableProjectAutoCopy && index === 0) {
                    if (commonHash(prevLayout) !== commonHash(updatedLayout)) {
                      const common0 = pickCommon(updatedLayout);
                      for (let i = 1; i < next.length; i++) {
                        if (next[i]?._inheritCommon !== false) {
                          next[i] = { ...next[i], ...cloneDeep(common0) };
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
