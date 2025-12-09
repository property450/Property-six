// components/hotel/CancellationPolicySelector.js
"use client";

export default function CancellationPolicySelector({ value, onChange }) {
  const v = value || { type: "", condition: "" };

  const update = (patch) => {
    onChange?.({ ...v, ...patch });
  };

  const showCondition = v.type === "conditional";

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        是否能免费取消？
      </label>
      <select
        className="border rounded p-2 w-full max-w-xs"
        value={v.type || ""}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">请选择</option>
        <option value="conditional">有条件免费取消</option>
        <option value="free">无条件免费取消</option>
        <option value="no">不能取消</option>
      </select>

      {showCondition && (
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={2}
          placeholder="请输入取消条件，例如：入住前 7 天内免费取消，之后收取首晚房费等..."
          value={v.condition || ""}
          onChange={(e) => update({ condition: e.target.value })}
        />
      )}
    </div>
  );
}
