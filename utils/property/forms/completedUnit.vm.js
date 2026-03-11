// utils/property/forms/completedUnit.vm.js

import { buildVM as buildBaseVM } from "./newProject.vm";
import { resolveActiveForm } from "../resolveActiveForm";

function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * ✅ Completed Unit 完成年份：
 * 只读当前 active 的 shared / layout0 / form
 * 不读 rawProperty，避免旧数据污染
 */
function pickCompletedYearStrict(active) {
  const sources = [
    active?.shared || null,
    active?.layout0 || null,
    active?.form || null,
  ].filter(Boolean);

  const candidatePaths = [
    // 常见直接字段
    "completedYear",
    "completed_year",
    "completionYear",
    "completion_year",
    "buildYear",
    "build_year",
    "builtYear",
    "built_year",
    "yearCompleted",
    "year_completed",

    // 可能包在对象里
    "data.completedYear",
    "data.completed_year",
    "data.completionYear",
    "data.completion_year",
    "data.buildYear",
    "data.build_year",
    "data.built_year",

    "meta.completedYear",
    "meta.completed_year",
    "meta.completionYear",
    "meta.completion_year",
    "meta.buildYear",
    "meta.build_year",

    "completion.year",
    "completed.year",
    "build.year",

    // 有些 layout 里会包 unit data
    "unit.completedYear",
    "unit.completed_year",
    "unit.completionYear",
    "unit.buildYear",
  ];

  for (const src of sources) {
    for (const path of candidatePaths) {
      const v = deepGet(src, path);
      if (isNonEmpty(v)) return String(v);
    }
  }

  return "";
}

export function buildVM(rawProperty) {
  // 先复用已跑通的通用 VM（不动其它字段）
  const vm = buildBaseVM(rawProperty);

  // 再用 Completed Unit 专属规则覆盖关键字段
  const active = resolveActiveForm(rawProperty);

  vm.active = active;
  vm.isNewProject = false;
  vm.isCompletedUnit = true;

  // ✅ Completed Unit 不显示预计完成年份
  vm.expectedText = "";

  // ✅ 关键：只读当前 active 的 shared/layout0/form
  vm.completedYear = pickCompletedYearStrict(active);

  return vm;
}
