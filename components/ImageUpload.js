// components/ImageUpload.js
"use client";

import { useMemo } from "react";

// 只接受「对象」作为图片结构，其它一律当成空对象
function normalizeImages(images) {
  if (images && typeof images === "object" && !Array.isArray(images)) {
    return images;
  }
  return {};
}

// 把各种类型（字符串 / 数字）统一转成正整数
function toCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

export default function ImageUpload({ config, images, setImages }) {
  const safeConfig = config || {};
  const safeImages = normalizeImages(images);

  const sections = useMemo(() => {
    const list = [];

    // 卧室
    const bedroomCount = toCount(safeConfig.bedrooms);
    for (let i = 1; i <= bedroomCount; i++) {
      list.push({
        key: `bedroom_${i}`,
        label: bedroomCount === 1 ? "卧室" : `卧室${i}`,
        kind: "bedroom",
      });
    }

    // 浴室
    const bathroomCount = toCount(safeConfig.bathrooms);
    for (let i = 1; i <= bathroomCount; i++) {
      list.push({
        key: `bathroom_${i}`,
        label: bathroomCount === 1 ? "浴室" : `浴室${i}`,
        kind: "bathroom",
      });
    }

    // 厨房
    const kitchenCount = toCount(safeConfig.kitchens);
    for (let i = 1; i <= kitchenCount; i++) {
      list.push({
        key: `kitchen_${i}`,
        label: kitchenCount === 1 ? "厨房" : `厨房${i}`,
        kind: "kitchen",
      });
    }

    // 客厅
    const livingCount = toCount(safeConfig.livingRooms);
    for (let i = 1; i <= livingCount; i++) {
      list.push({
        key: `living_${i}`,
        label: livingCount === 1 ? "客厅" : `客厅${i}`,
        kind: "living",
      });
    }

    // 车位（整体）
    if (toCount(safeConfig.carpark) > 0) {
      list.push({
        key: "carpark",
        label: "停车位",
        kind: "carpark",
      });
    }

    // -------- 朝向（兼容 facing 和 orientation）--------
    let facingLabel = safeConfig.facing ?? safeConfig.orientation;
    if (Array.isArray(facingLabel)) {
      // 如果是数组（例如多选朝向），就用逗号连接
      facingLabel = facingLabel.join(" / ");
    }
    if (facingLabel) {
      list.push({
        key: `facing_${facingLabel}`,
        label: facingLabel,
        kind: "facing",
      });
    }

    // 设施
    if (Array.isArray(safeConfig.facilities)) {
      safeConfig.facilities.forEach((item, idx) => {
        const name = typeof item === "string" ? item : item?.label;
        if (!name) return;
        list.push({
          key: `facility_${idx}`,
          label: name,
          kind: "facility",
        });
      });
    }

    // 额外空间
    if (Array.isArray(safeConfig.extraSpaces)) {
      safeConfig.extraSpaces.forEach((item, idx) => {
        const name = typeof item === "string" ? item : item?.label;
        if (!name) return;
        list.push({
          key: `extra_${idx}`,
          label: name,
          kind: "extraSpace",
        });
      });
    }

    // 家私
    if (Array.isArray(safeConfig.furniture)) {
      safeConfig.furniture.forEach((item, idx) => {
        const name = typeof item === "string" ? item : item?.label;
        if (!name) return;
        list.push({
          key: `furniture_${idx}`,
          label: name,
          kind: "furniture",
        });
      });
    }

    return list;
  }, [safeConfig]);

  const handleFilesChange = (sectionKey, files) => {
    const fileArr = Array.from(files || []);
    const next = {
      ...safeImages,
      [sectionKey]: fileArr,
    };
    setImages && setImages(next);
  };

  if (!sections.length) return null;

  return (
    <div className="mt-6 space-y-4">
      {sections.map((sec) => {
        const files = safeImages[sec.key] || [];

        // 根据 kind 加前缀
        let displayLabel = sec.label;
        if (sec.kind === "facing") {
          displayLabel = `朝向：${sec.label}`;
        } else if (sec.kind === "facility") {
          displayLabel = `设施：${sec.label}`;
        } else if (sec.kind === "extraSpace") {
          displayLabel = `额外空间：${sec.label}`;
        } else if (sec.kind === "furniture") {
          displayLabel = `家私：${sec.label}`;
        }

        return (
          <div key={sec.key} className="border rounded-md p-3">
            <p className="font-medium mb-1">{displayLabel}</p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFilesChange(sec.key, e.target.files)}
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                已选择 {files.length} 张图片
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
