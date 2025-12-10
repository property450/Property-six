// components/hotel/OtherServicesSelector.js
"use client";

const PRESET_SERVICES = [
  "机场接送",
  "允许携带宠物",
  "室外监控摄像头",
  "行李寄存",
  "24小时前台",
  "叫车服务",
  "洗衣/干洗服务",
];

export default function OtherServicesSelector({ value, onChange }) {
  const services = Array.isArray(value) ? value : [];

  const triggerChange = (next) => {
    onChange?.(next);
  };

  const togglePreset = (tag) => {
    const idx = services.findIndex((s) => s.tag === tag);
    if (idx === -1) {
      triggerChange([...services, { tag, note: "" }]);
    } else {
      const next = services.slice();
      next.splice(idx, 1);
      triggerChange(next);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("customService");
    const raw = input.value.trim();
    if (!raw) return;
    if (!services.some((s) => s.tag === raw)) {
      triggerChange([...services, { tag: raw, note: "" }]);
    }
    input.value = "";
  };

  const updateNote = (index, note) => {
    const next = services.map((item, i) =>
      i === index ? { ...item, note } : item
    );
    triggerChange(next);
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="font-semibold text-sm">其它服务（标签 + 备注）</p>

      {/* 预设标签多选 */}
      <div className="flex flex-wrap gap-2">
        {PRESET_SERVICES.map((tag) => {
          const active = services.some((s) => s.tag === tag);
          return (
            <button
              type="button"
              key={tag}
              className={`px-3 py-1 rounded-full border text-xs ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
              onClick={() => togglePreset(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* 自定义服务标签输入 */}
      <form onSubmit={handleAddCustom} className="flex gap-2 mt-2">
        <input
          name="customService"
          type="text"
          className="flex-1 border rounded p-2 text-sm"
          placeholder="输入其它服务，例如：接驳到商场、生日布置… 按回车新增标签"
        />
        <button
          type="submit"
          className="px-3 py-1 text-sm rounded border bg-gray-100"
        >
          添加
        </button>
      </form>

      {/* 已选择服务 + 备注 */}
      {services.length > 0 && (
        <div className="mt-2 space-y-2">
          {services.map((item, index) => (
            <div
              key={`${item.tag}-${index}`}
              className="border rounded p-2 flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.tag}</span>
                <button
                  type="button"
                  className="text-xs text-red-500"
                  onClick={() => {
                    const next = services.slice();
                    next.splice(index, 1);
                    triggerChange(next);
                  }}
                >
                  删除
                </button>
              </div>
              <textarea
                className="w-full border rounded p-1 text-xs"
                rows={2}
                placeholder="备注说明（可选），例如：需提前一天预约，或可能需要额外收费…"
                value={item.note || ""}
                onChange={(e) => updateNote(index, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
