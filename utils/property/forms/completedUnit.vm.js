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

// ✅ Completed Unit：只从「当前 active.form（Completed Unit 表单）」读取完成年份
function pickCompletedYearFromCompletedUnitForm(active) {
  const f = active?.form || {};

  const candidates = [
    f.completedYear,
    f.completed_year,
    f.built_year,
    f.build_year,
    f.buildYear,
    f.completionYear,
  ];

  for (const v of candidates) {
    if (isNonEmpty(v)) return String(v);
  }

  // ✅ 没填就返回空，让页面显示 "-"
  return "";
}

export function buildVM(rawProperty) {
  // 先复用你已经跑通的通用 VM（不动其它字段/逻辑/显示）
  const vm = buildBaseVM(rawProperty);

  // 再用 Completed Unit 的“严格规则”覆盖关键字段
  const active = resolveActiveForm(rawProperty);

  // ✅ 强制：Completed Unit 卡片永远当作 completed unit
  vm.isNewProject = false;
  vm.isCompletedUnit = true;

  // ✅ Completed Unit：不显示预计完成年份（即使 base vm 算出了）
  vm.expectedText = "";

  // ✅ 关键：完成年份只读 Completed Unit 表单本身，没值就空
  vm.completedYear = pickCompletedYearFromCompletedUnitForm(active);

  return vm;
}
