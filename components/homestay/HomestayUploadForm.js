// components/homestay/HomestayUploadForm.js
"use client";

import HotelUploadForm from "@/components/hotel/HotelUploadForm";

export default function HomestayUploadForm(props) {
  // ✅ 复用同一个表单（你印象中的行为）
  return <HotelUploadForm {...props} mode="homestay" />;
}
