// utils/imageLabelUtils.js

import { toCount } from "./numberUtils";

/**
 * 从 config 生成图片上传 label 列表
 * （从你 UnitLayoutForm 里那坨逻辑抽出来）
 */
export function getPhotoLabelsFromConfig(config) {
  const cfg = config || {};

  const labels = [];

  // ---------- 常规固定项 ----------
  labels.push("封面 / Cover");
  labels.push("客厅 / Living Room");
  labels.push("饭厅 / Dining Area");
  labels.push("厨房 / Kitchen");
  labels.push("主卧 / Master Bedroom");
  labels.push("主浴室 / Master Bathroom");

  // ---------- 房间/浴室数量生成 ----------
  const bedroomCount = toCount(cfg.bedroomCount);
  const bathroomCount = toCount(cfg.bathroomCount);

  if (bedroomCount > 1) {
    for (let i = 2; i <= bedroomCount; i++) {
      labels.push(`卧室 ${i} / Bedroom ${i}`);
    }
  }
  if (bathroomCount > 1) {
    for (let i = 2; i <= bathroomCount; i++) {
      labels.push(`浴室 ${i} / Bathroom ${i}`);
    }
  }

  // ---------- 车位 ----------
  const carparkCount = toCount(cfg.carparkCount);
  if (carparkCount > 0) {
    for (let i = 1; i <= carparkCount; i++) {
      labels.push(`车位 ${i} / Carpark ${i}`);
    }
  }

  // ---------- 储藏室 ----------
  const storeRoomCount = toCount(cfg.storeRoomCount);
  if (storeRoomCount > 0) {
    for (let i = 1; i <= storeRoomCount; i++) {
      labels.push(`储藏室 ${i} / Store Room ${i}`);
    }
  }

  // ---------- 额外空间 ----------
  const extraSpaces = Array.isArray(cfg.extraSpaces) ? cfg.extraSpaces : [];
  extraSpaces.forEach((name, idx) => {
    if (!name) return;
    labels.push(`${name} / Extra Space ${idx + 1}`);
  });

  // ---------- 设施 ----------
  const facilities = Array.isArray(cfg.facilities) ? cfg.facilities : [];
  facilities.forEach((name, idx) => {
    if (!name) return;
    labels.push(`${name} / Facility ${idx + 1}`);
  });

  // ---------- 家私 ----------
  const furniture = Array.isArray(cfg.furniture) ? cfg.furniture : [];
  furniture.forEach((name, idx) => {
    if (!name) return;
    labels.push(`${name} / Furniture ${idx + 1}`);
  });

  // ---------- 朝向 ----------
  const facing = Array.isArray(cfg.facing) ? cfg.facing : [];
  facing.forEach((name, idx) => {
    if (!name) return;
    labels.push(`${name} / Facing ${idx + 1}`);
  });

  // ---------- 其他 ----------
  labels.push("走廊 / Corridor");
  labels.push("阳台 / Balcony");
  labels.push("外观 / Exterior");
  labels.push("周边 / Surroundings");

  // 去重
  return Array.from(new Set(labels));
}
