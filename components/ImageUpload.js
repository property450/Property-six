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

/**
 * props:
 *  - config: {
 *      bedrooms, bathrooms, kitchens, livingRooms, carpark,
 *      extraSpaces: string[],
 *      facilities: string[],
 *      furniture: string[],
 *      orientation: string,
 *      transit: any
 *    }
 *  - images: { [sectionKey]: File[] }
 *  - setImages: (nextObj) => void
 */
export default function ImageUpload({ config, images, setImages }) {
  const safeConfig = config || {};
  const safeImages = normalizeImages(images);

  // 生成所有需要的上传分组
  const sections = useMemo(() => {
    const list = [];

    // 卧室
    const bedroomCount = toCount(safeConfig.bedrooms);
    for (let i = 1; i <= bedroomCount; i++) {
      list.push({
        key: `bedroom_${i}`,
        label: bedroomCount === 1 ? "卧室" : `卧室${i}`,
        category: "bedroom",
      });
    }

    // 浴室
    const bathroomCount = toCount(safeConfig.bathrooms);
    for (let i = 1; i <= bathroomCount; i++) {
      list.push({
        key: `bathroom_${i}`,
        label: bathroomCount === 1 ? "浴室" : `浴室${i}`,
        category: "bathroom",
      });
    }

    // 厨房
    const kitchenCount = toCount(safeConfig.kitchens);
    for (let i = 1; i <= kitchenCount; i++) {
      list.push({
        key: `kitchen_${i}`,
        label: kitchenCount === 1 ? "厨房" : `厨房${i}`,
        category: "kitchen",
      });
    }

    // 客厅
    const livingCount = toCount(safeConfig.livingRooms);
    for (let i = 1; i <= livingCount; i++) {
      list.push({
        key: `living_${i}`,
        label: livingCount === 1 ? "客厅" : `客厅${i}`,
        category: "living",
      });
    }

    // 车位（整体）
    if (toCount(safeConfig.carpark) > 0) {
      list.push({
        key: "carpark",
        label: "停车位",
        category: "carpark",
      });
    }

    // 朝向
    if (safeConfig.orientation) {
      list.push({
        key: `orientation_${safeConfig.orientation}`,
        label: safeConfig.orientation,
        category: "orientation",
      });
    }

    // 设施
    if (Array.isArray(safeConfig.facilities)) {
      safeConfig.facilities.forEach((name, idx) => {
        if (!name) return;
        list.push({
          key: `facility_${idx}`,
          label: name,
          category: "facilities",
        });
      });
    }

    // 额外空间
    if (Array.isArray(safeConfig.extraSpaces)) {
      safeConfig.extraSpaces.forEach((name, idx) => {
        if (!name) return;
        list.push({
          key: `extra_${idx}`,
          label: name,
          category: "extraSpaces",
        });
      });
    }

    // 家私
    if (Array.isArray(safeConfig.furniture)) {
      safeConfig.furniture.forEach((name, idx) => {
        if (!name) return;
        list.push({
          key: `furniture_${idx}`,
          label: name,
          category: "furniture",
        });
      });
    }

    return list;
  }, [safeConfig]);

  // 统一更新函数
  const handleFilesChange = (sectionKey, files) => {
    const fileArr = Array.from(files || []);
    const next = {
      ...safeImages,
      [sectionKey]: fileArr,
    };
    setImages && setImages(next);
  };

  // 不同分类的前缀
  const prefixMap = {
    orientation: "朝向：",
    facilities: "设施：",
    extraSpaces: "额外空间：",
    furniture: "家私：",
  };

  if (!sections.length) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {sections.map((sec) => {
        const files = safeImages[sec.key] || [];
        const prefix = prefixMap[sec.category] || "";
        const displayLabel = prefix ? `${prefix}${sec.label}` : sec.label;

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
