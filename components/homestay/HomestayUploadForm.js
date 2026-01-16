// components/homestay/HomestayUploadForm.js
"use client";

import TypeSelector from "@/components/TypeSelector";

export default function HomestayUploadForm() {
  return (
    <div className="space-y-4">
      {/* ✅ Homestay 用回和 Sale / New Project 一模一样的类型系统 */}
      <TypeSelector />

      {/* ⚠️ 下面原本已有的 Homestay 字段全部保持不动 */}
    </div>
  );
}
