// utils/unitLayoutForm/photoLabels.js

export const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

export const parseNumber = (str) => String(str || "").replace(/,/g, "");

export const toCount = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
};

export const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

export const getName = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.label || item.value || item.name || "";
};

// 把 propertySubtype 转成「数组」，兼容以前是字符串的情况
export const parseSubtypeToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [String(val)];
};

// 根据 photoConfig 生成所有上传框的 label
export function getPhotoLabelsFromConfig(config) {
  const safe = config || {};
  let labels = [];

  // 卧室
  {
    const n = toCount(safe.bedrooms);
    for (let i = 1; i <= n; i++) labels.push(`卧室${i}`);
  }

  // 浴室
  {
    const n = toCount(safe.bathrooms);
    for (let i = 1; i <= n; i++) labels.push(`浴室${i}`);
  }

  // 厨房
  {
    const n = toCount(safe.kitchens);
    for (let i = 1; i <= n; i++) labels.push(`厨房${i}`);
  }

  // 客厅
  {
    const n = toCount(safe.livingRooms);
    for (let i = 1; i <= n; i++) labels.push(`客厅${i}`);
  }

  // 车位
  {
    const n = toCount(safe.carpark);
    for (let i = 1; i <= n; i++) labels.push(`车位${i}`);
  }

  // 额外空间
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      const name = getName(extra);
      if (!name) return;

      const count = toCount(extra.count || 1) || 1;
      if (count <= 1) {
        labels.push(name);
      } else {
        for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
      }
    });
  }

  // 家私
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      const name = getName(item);
      if (!name) return;

      const count = toCount(item.count || 1) || 1;
      if (count <= 1) {
        labels.push(name);
      } else {
        for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
      }
    });
  }

  labels = [...new Set(labels)];
  if (!labels.length) labels.push("房源照片");

  return labels;
}
