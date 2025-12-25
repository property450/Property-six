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

  // 这些来自 upload-property.js 的常量/函数（你原本就有）
  LAYOUT_CATEGORY_OPTIONS = {},

  pickCommon = (l = {}) => ({
    extraSpaces: l.extraSpaces || [],
    furniture: l.furniture || [],
    facilities: l.facilities || [],
    transit: l.transit || null,
  }),
  cloneDeep = (v) => JSON.parse(JSON.stringify(v || {})),
  commonHash = (l) => JSON.stringify({
    extraSpaces: l?.extraSpaces || [],
    furniture: l?.furniture || [],
    facilities: l?.facilities || [],
    transit: l?.transit || null,
  }),
}) {
  // ✅ 房型数量：来自 unitLayouts 长度（受控）
  const layoutCount = useMemo(() => {
    const arr = Array.isArray(unitLayouts) ? unitLayouts : [];
    return arr.length;
  }, [unitLayouts]);

  // ✅ Bulk rent：统一 Category/SubType（保持你原本逻辑）
  const categoryOptionsKeys = useMemo(
    () => Object.keys(LAYOUT_CATEGORY_OPTIONS || {}),
    [LAYOUT_CATEGORY_OPTIONS]
  );

  // ✅ 选数量 -> 生成 layouts（不再依赖 normalizeLayoutsFromUnitTypeSelector）
  const handleCountChange = (count) => {
    const n = Number(count) || 0;

    setUnitLayouts((prev) => {
      const oldList = Array.isArray(prev) ? prev : [];
      const next = [...oldList];

      // 调整长度
      if (n <= 0) return [];
      if (next.length < n) {
        for (let i = next.length; i < n; i++) next.push(createEmptyLayout());
      } else if (next.length > n) {
        next.splice(n);
      }

      // bulk rent：强制写入项目 category/subType
      const merged = next.map((oldItem, idx) => {
        const withProjectType =
          isBulkRentProject && projectCategory
            ? {
                propertyCategory: projectCategory,
                subType: projectSubType || oldItem?.subType || "",
              }
            : {};

        // ✅ index0 永远不继承
        // ✅ index>0 默认继承 true（除非旧的已经脱钩）
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

      // ✅ 新增 layouts 时：立刻复制一次 layout0 的 common 给仍继承的
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

  // ✅ 如果 bulk rent 选了 category/subType，确保同步到已有 layouts（你原本就这样做）
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
      {/* Bulk Rent 项目：统一 Category/SubType（保持你原本 UI/逻辑） */}
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

                // 同步到已存在 layouts（不破坏其它字段）
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

      {/* ✅ New Project / Completed Unit：房型数量（现在只用 count，不会再报 normalizeLayoutsFromUnitTypeSelector） */}
      <UnitTypeSelector value={layoutCount} onChange={handleCountChange} />

      {/* 渲染 layouts（保留你原本 UnitLayoutForm 的同步/脱钩逻辑） */}
      {layoutCount > 0 && (
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

                  // 初始化 inherit flag
                  if (index === 0) updatedLayout._inheritCommon = false;
                  if (index > 0 && typeof updatedLayout._inheritCommon !== "boolean") {
                    updatedLayout._inheritCommon =
                      typeof prevLayout._inheritCommon === "boolean"
                        ? prevLayout._inheritCommon
                        : true;
                  }

                  const commonKeys = new Set(["extraSpaces", "furniture", "facilities", "transit"]);

                  // 子 layout 改 common -> 脱钩
                  if (enableProjectAutoCopy && meta?.commonField && commonKeys.has(meta.commonField)) {
                    if (index > 0) updatedLayout._inheritCommon = false;
                  }

                  // 勾回“同步 Layout1”时：立刻把 Layout1 的 common 复制回来
                  if (enableProjectAutoCopy && meta?.inheritToggle && index > 0) {
                    if (updatedLayout._inheritCommon !== false) {
                      const common0 = pickCommon(base[0] || {});
                      Object.assign(updatedLayout, cloneDeep(common0));
                    }
                  }

                  // 兜底：index>0 改了 common 就脱钩
                  if (enableProjectAutoCopy && index > 0) {
                    const prevH = commonHash(prevLayout);
                    const nextH = commonHash(updatedLayout);
                    if (prevH !== nextH) updatedLayout._inheritCommon = false;
                  }

                  next[index] = updatedLayout;

                  // index==0：改了 common，就同步到仍继承的 layout
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
