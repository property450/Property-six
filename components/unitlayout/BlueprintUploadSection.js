// components/unitlayout/BlueprintUploadSection.js
"use client";

export default function BlueprintUploadSection({ fileInputRef, onUpload }) {
  return (
    <div className="mb-3">
      <button
        type="button"
        className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        点击上传 Layout 图纸
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}
