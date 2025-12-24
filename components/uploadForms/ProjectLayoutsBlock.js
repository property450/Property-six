// components/uploadForms/ProjectLayoutsBlock.js
"use client";

import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";
import { LAYOUT_CATEGORY_OPTIONS } from "@/utils/uploadProperty/layoutCategoryOptions";
import { cloneDeep, pickCommon, commonHash } from "@/utils/uploadProperty/commonCopy";
import { normalizeLayoutsFromUnitTypeSelector } from "@/utils/uploadProperty/normalizeLayouts";

export default function ProjectLayoutsBlock({
  // flags
  isBulkRentProject,
  enableProjectAutoCopy,

  // project type
  computedStatus,

  // state
  projectCategory,
  setProjectCategory,
  projectSubType,
  setProjectSubType,

  unitLayouts,
  setUnitLayouts,
}) {
  return (
    <>
      {/* Bulk Rent 项目：统一 Category/SubType（你原本就有） */}
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
                    ...l,
                    propertyCategory: cat,
                    subType: "",
                  }))
                );
              }}
              className="mt-1 block w-full border rounded-lg p-2"
            >
              <option value="">请选择类别</option>
              {Object.keys(LAYOUT_CATEGORY_OPTIONS).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {projectCategory && LAYOUT_CATEGORY_OPTIONS[projectCategory] && (
            <div>
              <label className="font-medium">Sub Type（整个项目）</label>
              <select
                value={projectSubType}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectSubType(val);

                  setUnitLayouts((prev) =>
                    (Array.isArray(prev) ? prev : []).map((l) => ({
                      ...l,
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

      {/* ✅ 选择房型数量 -> 生成对应 UnitLayoutForm（关键修复在这里） */}
      <UnitTypeSelector
        propertyStatus={computedStatus}
        onChange={(payload) => {
          const normalized = normalizeLayoutsFromUnitTypeSelector(payload);

          setUnitLayouts((prev) => {
            const oldList = Array.isArray(prev) ? prev : [];
            const nextList = normalized; // ✅ 现在保证是数组

            // 以 nextList 的长度为准，避免旧残留导致“数量不对/不生成”
            const merged = nextList.map((incoming, idx) => {
              const oldItem = oldList[idx] || {};
              // bulk rent：强制写入 category/subType
              const withProjectType =
                isBulkRentProject && projectCategory
                  ? {
                      propertyCategory: projectCategory,
                      subType: projectSubType || oldItem.subType || "",
                    }
                  : {};

              // ✅ index0 永远不继承
              // ✅ index>0 默认继承 true（除非旧的已经脱钩）
              const inherit =
                idx === 0
                  ? false
                  : typeof oldItem._inheritCommon === "boolean"
                  ? oldItem._inheritCommon
                  : true;

              return {
                ...oldItem,
                ...incoming,
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
        }}
      />

      {/* 渲染 layouts（你原本就有，我只把 key 改成稳定 index，避免 id 不存在导致渲染异常） */}
      {unitLayouts.length > 0 && (
        <div className="space-y-4 mt-4">
          {unitLayouts.map((layout, index) => (
            <UnitLayoutForm
              key={index}
              index={index}
              data={layout}
              projectCategory={projectCategory}
              projectSubType={projectSubType}
              lockCategory={isBulkRentProject} // bulk rent 锁定 category/subType
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

                  // ✅ 更精准：如果子表单明确告诉我们改的是 common 字段，直接脱钩/同步
                  const commonKeys = new Set(["extraSpaces", "furniture", "facilities", "transit"]);
                  if (
                    enableProjectAutoCopy &&
                    meta?.commonField &&
                    commonKeys.has(meta.commonField)
                  ) {
                    if (index > 0) {
                      updatedLayout._inheritCommon = false; // 子 layout 改 common -> 脱钩
                    }
                  }

                  if (enableProjectAutoCopy && meta?.inheritToggle && index > 0) {
                    // 勾回“同步 Layout1”时：立刻把 Layout1 的 common 复制回来
                    if (updatedLayout._inheritCommon !== false) {
                      const common0 = pickCommon(base[0] || {});
                      Object.assign(updatedLayout, cloneDeep(common0));
                    }
                  }

                  // ✅ index>0：只要你改了 common（四个字段），立刻脱钩
                  if (enableProjectAutoCopy && index > 0) {
                    const prevH = commonHash(prevLayout);
                    const nextH = commonHash(updatedLayout);
                    if (prevH !== nextH) {
                      updatedLayout._inheritCommon = false;
                    }
                  }

                  next[index] = updatedLayout;

                  // ✅ index==0：改了 common，就同步到仍继承的 layout
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
