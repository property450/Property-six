// hooks/useOutsideClick.js
import { useEffect } from "react";

/**
 * 通用：点外面关闭
 */
export default function useOutsideClick(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (e) => {
      if (!ref?.current) return;
      if (!ref.current.contains(e.target)) handler?.(e);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, handler, enabled]);
}
