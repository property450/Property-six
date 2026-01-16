// components/homestay/HomestayUploadForm.js
"use client";

import TypeSelector from "@/components/TypeSelector";

export default function HomestayUploadForm() {
  return (
    <div className="space-y-4">
      {/* 
        Homestay 模式：
        只使用 Property Category / Sub Type / Storeys / Property Subtype
        不使用 Sale / Rent / Hotel / Affordable / Tenure 等逻辑
      */}
      <TypeSelector
        hideSaleType
        hidePropertyUsage
        hideAffordableHousing
        hideTenureType
        hideSaleStatus
        forceMode="homestay"
      />

      {/* 下面如果你原本还有 Homestay 专用字段，继续放在这里 */}
    </div>
  );
}
