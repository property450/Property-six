//hooks/useProjectCommonSync.js
import { useEffect, useRef } from "react";
import { commonHash, pickCommon, cloneDeep } from "@/utils/commonFields";

export default function useProjectCommonSync(enable, layouts, setLayouts) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enable || layouts.length < 2) return;
    const h = commonHash(layouts[0]);
    if (ref.current === h) return;
    ref.current = h;

    const common = pickCommon(layouts[0]);
    setLayouts((prev) =>
      prev.map((l, i) =>
        i === 0 || l._inheritCommon === false
          ? l
          : { ...l, ...cloneDeep(common) }
      )
    );
  }, [enable, layouts, setLayouts]);
}
