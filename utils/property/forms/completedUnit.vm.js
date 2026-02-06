// utils/property/forms/completedUnit.vm.js

import { buildNewProjectVM } from "./newProject.vm";

/**
 * ✅ Completed Unit VM
 * 目前取值逻辑与你 pages/my-profile.js 完全一致，所以复用 buildNewProjectVM
 * 但保持独立入口，未来你要加 Completed Unit 专属显示/字段，改这里就行
 */
export function buildCompletedUnitVM(rawProperty) {
  return buildNewProjectVM(rawProperty);
}
