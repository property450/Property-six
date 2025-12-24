//hooks/useOutsideClick.js
import { useEffect } from "react";

export default function useOutsideClick(ref, cb) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb?.();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}
