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

// ✅ Completed Unit：只从 active.form（当前表单）里找完成年份
function pickCompletedYearFromCompletedUnitForm(active) {
  const f = active?.form || {};

  // 你项目里常见的存法很多，我这里都覆盖（只读当前表单）
  const candidatePaths = [
    // 最常见
    "completedYear",
    "completed_year",
    "buildYear",
    "build_year",
    "builtYear",
    "built_year",
    "completionYear",
    "completion_year",
    "year",

    // 有些会包在 data / meta 里
    "data.completedYear",
    "data.completed_year",
    "data.buildYear",
    "data.build_year",
    "data.built_year",
    "data.completionYear",
    "data.year",

    "meta.completedYear",
    "meta.completed_year",
    "meta.buildYear",
    "meta.build_year",
    "meta.year",

    // 有些会包在 “completed” 或 “completion” 对象
    "completed.year",
    "completedYear.year",
    "completion.year",
    "completionYear.year",
  ];

  for (const p of candidatePaths) {
    const v = deepGet(f, p);
    if (isNonEmpty(v)) return String(v);
  }

  // ✅ 没填就返回空，让页面显示 "-"
  return "";
}

export function buildVM(rawProperty) {
  // 先复用你已跑通的通用 VM（不动其它字段/逻辑/样式）
  const vm = buildBaseVM(rawProperty);

  // 再用 Completed Unit 的严格规则覆盖关键字段
  const active = resolveActiveForm(rawProperty);

  // ✅ 强制：Completed Unit 卡片标记
  vm.isNewProject = false;
  vm.isCompletedUnit = true;

  // ✅ Completed Unit：不显示预计完成年份
  vm.expectedText = "";

  // ✅ 关键：只读 Completed Unit 当前表单
  const strictYear = pickCompletedYearFromCompletedUnitForm(active);

  // ✅ 有值就用；没值才显示 "-"
  vm.completedYear = isNonEmpty(strictYear) ? strictYear : "";

  return vm;
}
