// components/hotel/OtherServicesSelector.js
"use client";

const PRESET_SERVICES = [
  "机场接送",
  "允许携带宠物",
  "室外监控摄像头",
  "行李寄存",
];

export default function OtherServicesSelector({ value, onChange }) {
  const services = Array.isArray(value) ? value : [];

  const triggerChange = (next) => {
    onChange?.(next);
  };

  const handleAddService = (label) => {
    if (!label) return;
    // 已存在就不重复添加
    if (services.some((s) => s.label === label)) return;
    triggerChange([...services, { label, note: "" }]);
  };

  const handleRemoveService = (label) => {
    triggerChange(services.filter((s) => s.label !== label));
  };

  const handleNoteChange = (label, note) => {
    triggerChange(
      services.map((s) =>
        s.label === label ? { ...s, note } : s
      )
    );
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val) {
        handleAddService(val);
        e.target.value = "";
      }
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="font-semibold text-sm">其它服务（可加备注）</p>

      {/* 已选择标签展示 + 预设标签按钮 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {services.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center px-3 py-1 rounded-full border text-sm bg-gray-100"
          >
            {s.label}
            <button
              type="button"
              className="ml-1 text-xs text-gray-500 hover:text-red-500"
              onClick={() => handleRemoveService(s.label)}
            >
              ×
            </button>
          </span>
        ))}

        {PRESET_SERVICES.map((label) => (
          <button
            key={label}
            type="button"
            className="px-3 py-1 rounded-full border text-xs bg-white hover:bg-gray-50"
            onClick={() => handleAddService(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 自定义其它服务输入框 */}
      <input
        type="text"
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder="输入其它服务后回车添加，例如：接驳车服务、租车服务..."
        onKeyDown={handleCustomKeyDown}
      />

      {/* 每个服务的备注输入 */}
      {services.length > 0 && (
        <div className="space-y-3 mt-3">
          {services.map((s) => (
            <div key={s.label}>
              <p className="text-sm font-medium mb-1">{s.label}</p>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="备注（可留空），例如：收费标准、时间、特别说明..."
                value={s.note || ""}
                onChange={(e) =>
                  handleNoteChange(s.label, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
