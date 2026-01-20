// components/trust/ListingTrustSection.js
"use client";

import { useMemo, useRef, useState, useEffect } from "react";

/**
 * mode 建议传：
 * - "sale"
 * - "rent"
 * - "new_project"
 * - "completed_unit"
 *
 * value 结构建议：
 * {
 *   fullAddress: string,
 *   allowPublicFullAddress: boolean,
 *   verificationFiles: File[]   // 内部审核文件（不会公开）
 * }
 */
export default function ListingTrustSection({
  mode,
  value,
  onChange,
  title = "真实性与地址信息",
}) {
  const patch = (p) => onChange?.({ ...(value || {}), ...p });

  const fileInputRef = useRef(null);
  const [localFiles, setLocalFiles] = useState(value?.verificationFiles || []);

  // 保持外部 value 变动时同步（例如你从数据库回填编辑页）
  useEffect(() => {
    if (Array.isArray(value?.verificationFiles)) {
      setLocalFiles(value.verificationFiles);
    }
  }, [value?.verificationFiles]);

  const addressLabel = useMemo(() => {
    // 你也可以全部统一叫“完整地址”，这里不影响逻辑
    return "完整地址";
  }, []);

  const addressHelpText = useMemo(() => {
    return "为了让买家更透明地查看房产的地点，您可以提供完整地址，让买家提前了解周边环境与配套。";
  }, []);

  const verificationTitle = useMemo(() => {
    if (mode === "new_project" || mode === "completed_unit") {
      return "发展商项目验证文件（仅供内部审核）";
    }
    return "房源真实性验证文件（仅供内部审核）";
  }, [mode]);

  const verificationHelpText = useMemo(() => {
    if (mode === "new_project") {
      return (
        "请上传以下任一文件以协助我们核实项目真实性：\n\n" +
      "• Developer License（DL）\n" +
      "• Advertisement & Sales Permit（AP）\n\n" +
      "文件仅用于平台内部审核，不会公开展示，也不会提供给第三方。"
    );
    }
    if (mode === "completed_unit") {
      return (
        "请上传以下任一文件以协助我们核实项目真实性：\n\n" +
      "• CCC（Certificate of Completion and Compliance）\n" +
      "• Developer Confirmation Letter\n\n" +
      "文件仅用于平台内部审核，不会公开展示，也不会提供给第三方。\n" +
      "您可自行遮挡不相关的个人资料。"
      );
    }
    // sale / rent
    return (
      "可上传以下任一文件以协助我们核实房源真实性：\n\n" +
    "• SPA（买卖合约）\n" +
    "• 地契（Title Deed）\n" +
    "• Assessment Bill\n" +
    "• 最近三个月水电账单\n\n" +
    "文件仅用于平台内部审核，不会公开展示，也不会提供给第三方。\n" +
    "您可自行遮挡不相关的个人资料。"
    );
  }, [mode]);

  const acceptText = useMemo(() => {
    // 文件类型你可以再放宽（比如 pdf/jpg/png/heic）
    return "image/*,application/pdf";
  }, []);

  const addFiles = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    const next = [...localFiles, ...list];
    setLocalFiles(next);
    patch({ verificationFiles: next });

    // 让同一个文件可以重复选择（可选）
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (idx) => {
    const next = localFiles.filter((_, i) => i !== idx);
    setLocalFiles(next);
    patch({ verificationFiles: next });
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>

      {/* ================= 地址输入框 ================= */}
      <div className="space-y-2">
        <label className="block font-medium">{addressLabel}</label>

        <textarea
          className="w-full border rounded p-2 min-h-[90px]"
          placeholder="花园名称 / 项目名称 / Condo 名称 + Block + Unit + Street + Postcode + City + State"
          value={value?.fullAddress || ""}
          onChange={(e) => patch({ fullAddress: e.target.value })}
        />

        <div className="text-sm text-gray-600">{addressHelpText}</div>

        {/* ✅ 建议加一个“是否公开完整地址”开关（你透明理念也保留，同时减少风险）
            如果你坚持一定公开，可以把这一段删除，但我建议保留 */}
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={!!value?.allowPublicFullAddress}
            onChange={(e) => patch({ allowPublicFullAddress: e.target.checked })}
          />
          <span className="text-sm">
            我同意将完整地址展示给买家（更透明）
          </span>
        </label>
      </div>

      <div className="h-px bg-gray-200" />

      {/* ================= 验证文件上传 ================= */}
      <div className="space-y-2">
        <label className="block font-medium">{verificationTitle}</label>

        <div className="text-sm text-gray-600">{verificationHelpText}</div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptText}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          <button
            type="button"
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            上传文件 / 照片
          </button>

          <span className="text-sm text-gray-500">
            支持图片 / PDF，可多选
          </span>
        </div>

        {/* 文件列表 */}
        {localFiles.length > 0 && (
          <div className="border rounded p-3 space-y-2">
            {localFiles.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium break-all">{f.name}</div>
                  <div className="text-gray-500">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm"
                  onClick={() => removeFileAt(idx)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 你想要的核心承诺：仅内部审核，不公开 */}
        <div className="text-xs text-gray-500">
          提供这些文件是为了确保上传房源的真实性，仅供内部审核，不会公开展示。
        </div>
      </div>
    </div>
  );
}
