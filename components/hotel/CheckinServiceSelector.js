// components/hotel/CheckinServiceSelector.js
"use client";

const TYPES = [
  { value: "self", label: "自助入住" },
  { value: "frontdesk", label: "24 小时前台服务" },
  { value: "limited", label: "入住时间限制" },
];

export default function CheckinServiceSelector({ value, onChange }) {
  const v =
    value || {
      type: "",
      timeRange: {
        startHour: "",
        startMinute: "",
        startPeriod: "AM",
        endHour: "",
        endMinute: "",
        endPeriod: "PM",
      },
    };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const updateTime = (patch) => {
    update({
      timeRange: {
        ...v.timeRange,
        ...patch,
      },
    });
  };

  const isLimited = v.type === "limited";

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">入住服务</label>
      <select
        className="border rounded p-2 w-full max-w-xs"
        value={v.type || ""}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">请选择入住服务</option>
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {isLimited && (
        <div className="space-y-1 text-sm">
          <span className="text-gray-700">入住时间限制（每天）</span>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.startHour || ""}
              onChange={(e) => updateTime({ startHour: e.target.value })}
            >
              <option value="">HH</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h.toString().padStart(2, "0")}>
                  {h.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            :
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.startMinute || ""}
              onChange={(e) => updateTime({ startMinute: e.target.value })}
            >
              <option value="">MM</option>
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.startPeriod || "AM"}
              onChange={(e) => updateTime({ startPeriod: e.target.value })}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <span>到</span>
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.endHour || ""}
              onChange={(e) => updateTime({ endHour: e.target.value })}
            >
              <option value="">HH</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h.toString().padStart(2, "0")}>
                  {h.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            :
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.endMinute || ""}
              onChange={(e) => updateTime({ endMinute: e.target.value })}
            >
              <option value="">MM</option>
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="border rounded p-1 w-16"
              value={v.timeRange.endPeriod || "PM"}
              onChange={(e) => updateTime({ endPeriod: e.target.value })}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
