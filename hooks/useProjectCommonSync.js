// hooks/useProjectCommonSync.js
import { useEffect, useRef } from "react";
import { pickCommon, commonHash, cloneDeep } from "../utils/commonFields";

/**
 * Layout1(common) 改变时 -> 同步给仍继承的 layouts
 * （从 upload-property.js 抽出来，逻辑保持一致）
 */
export default function useProjectCommonSync({ enabled, unitLayouts, setUnitLayouts }) {
  const lastCommonHashRef = useRef("");

  useEffect(() => {
    if (!enabled) return;
    const arr = Array.isArray(unitLayouts) ? unitLayouts : [];
    if (!arr.length) return;

    const first = arr[0] || {};
    const common = pickCommon(first);
    const h = commonHash(common);

    if (lastCommonHashRef.current === h) return;
    lastCommonHashRef.current = h;

    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      if (!prevArr.length) return prevArr;

      const updated = prevArr.map((l, idx) => {
        if (idx === 0) return l;

        // 默认：继承 common（除非某个字段被“脱钩/不继承”）
        const inherit = l?._inheritCommon ?? {};
        const next = cloneDeep(l);

        Object.keys(common).forEach((k) => {
          const shouldInherit = inherit[k] !== false;
          if (shouldInherit) next[k] = common[k];
        });

        return next;
      });

      return updated;
    });
  }, [enabled, unitLayouts, setUnitLayouts]);
}
