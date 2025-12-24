// components/homestay/HomestayUploadForm.js
"use client";

import { useEffect, useMemo } from "react";

// ✅ 这个组件是“恢复用的兜底版”
// 目标：
// 1) 先让 Homestay 点击不再报错（Element type is invalid）
// 2) 先把 Homestay 的表单区域恢复出来，页面能正常渲染
// 3) 不强依赖你项目里其它 selector 的实现（避免你现在缺文件/改动造成再次报错）
//
// 你之前说“文字、设计、逻辑都要一样”——
// 由于我目前看不到你原本 Homestay 的完整 UI 文案与布局，
// 这个文件先以“最稳不报错 + 表单能用”为主恢复。
// 等你把你原本的 Homestay 表单截图/旧代码贴出来，我再把 UI/文字 100% 还原回你原设计。

export default function HomestayUploadForm({
  // ✅ 父组件一般会传这些
  data,
  onChange,

  // ✅ 你如果有分类/模式字段也可能会传
  mode,
  subMode,

  // ✅ 你项目里可能会传的额外 props（不传也不会报错）
  t, // i18n 翻译函数（可选）
}) {
  // 保证是对象
  const form = useMemo(() => (data && typeof data === "object" ? data : {}), [data]);

  const update = (patch) => {
    const next = { ...form, ...patch };
    if (typeof onChange === "function") onChange(next);
  };

  // ✅ 初始化缺省字段（不改变你逻辑，只是避免 undefined 导致 uncontrolled/报错）
  useEffect(() => {
    // 只在缺字段时补齐一次
    const needsInit =
      form.homestayType === undefined ||
      form.homestayTitle === undefined ||
      form.homestayDescription === undefined;

    if (!needsInit) return;

    update({
      homestayType: form.homestayType ?? "",
      homestayTitle: form.homestayTitle ?? "",
      homestayDescription: form.homestayDescription ?? "",
      otherServices: form.otherServices ?? [],
      allowPets: form.allowPets ?? false,
      airportPickup: form.airportPickup ?? false,
      outdoorCCTV: form.outdoorCCTV ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = (zh, en) => {
    if (typeof t === "function") return t(zh) || zh;
    return zh; // 你项目主要中文为主，先默认中文
  };

  const toggleArrayItem = (key, value) => {
    const arr = Array.isArray(form[key]) ? form[key] : [];
    const has = arr.includes(value);
    const next = has ? arr.filter((x) => x !== value) : [...arr, value];
    update({ [key]: next });
  };

  return (
    <div className="w-full space-y-4">
      {/* 标题区（先兜底恢复，不影响你父层布局） */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-lg font-semibold text-white">
          {label("Homestay 上传表单", "Homestay Upload Form")}
        </div>
        <div className="mt-1 text-sm text-white/70">
          {label("（已恢复基础表单，确保页面先能正常显示）", "(Restored base form so the page can render)")}
        </div>
      </div>

      {/* Homestay Type */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm font-medium text-white">
          {label("Homestay type", "Homestay type")}
        </div>

        <select
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white outline-none"
          value={form.homestayType || ""}
          onChange={(e) => update({ homestayType: e.target.value })}
        >
          <option value="">{label("请选择", "Please select")}</option>
          {/* ✅ 这里先给常见选项兜底，你之后把你原本选项发我，我再 100% 还原 */}
          <option value="Entire place">{label("整间 / Entire place", "Entire place")}</option>
          <option value="Private room">{label("独立房间 / Private room", "Private room")}</option>
          <option value="Shared room">{label("共享房间 / Shared room", "Shared room")}</option>
        </select>
      </div>

      {/* 标题/描述 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm font-medium text-white">{label("标题", "Title")}</div>
        <input
          className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white outline-none"
          value={form.homestayTitle || ""}
          onChange={(e) => update({ homestayTitle: e.target.value })}
          placeholder={label("例如：靠近MRT的舒适公寓", "e.g. Cozy condo near MRT")}
        />

        <div className="text-sm font-medium text-white">{label("房源描述", "Description")}</div>
        <textarea
          className="w-full min-h-[120px] rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white outline-none"
          value={form.homestayDescription || ""}
          onChange={(e) => update({ homestayDescription: e.target.value })}
          placeholder={label("请输入房源描述...", "Enter description...")}
        />
      </div>

      {/* 其它服务（你之前明确提到：其它服务/机场接送/允许携带宠物/室外监控摄像头） */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm font-medium text-white">{label("其它服务", "Other services")}</div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-white/90">
            <input
              type="checkbox"
              checked={!!form.airportPickup}
              onChange={(e) => update({ airportPickup: e.target.checked })}
            />
            {label("机场接送", "Airport pickup")}
          </label>

          <label className="flex items-center gap-2 text-white/90">
            <input
              type="checkbox"
              checked={!!form.allowPets}
              onChange={(e) => update({ allowPets: e.target.checked })}
            />
            {label("允许携带宠物", "Pets allowed")}
          </label>

          <label className="flex items-center gap-2 text-white/90">
            <input
              type="checkbox"
              checked={!!form.outdoorCCTV}
              onChange={(e) => update({ outdoorCCTV: e.target.checked })}
            />
            {label("室外监控摄像头", "Outdoor CCTV")}
          </label>

          {/* ✅ 保留一个可扩展多选数组，避免你之后加更多服务又要改结构 */}
          <label className="flex items-center gap-2 text-white/90">
            <input
              type="checkbox"
              checked={(Array.isArray(form.otherServices) ? form.otherServices : []).includes("Cleaning")}
              onChange={() => toggleArrayItem("otherServices", "Cleaning")}
            />
            {label("清洁服务（可选）", "Cleaning service (optional)")}
          </label>
        </div>
      </div>
    </div>
  );
}

