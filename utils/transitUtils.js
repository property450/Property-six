// utils/transitUtils.js

// TransitSelector 已经是完整结构，这里只做兜底与清洗

export function normalizeTransitToSelector(val) {
  if (!val || typeof val !== "object") return null;

  return {
    nearTransit: val.nearTransit ?? null,
    selectedLines: Array.isArray(val.selectedLines) ? val.selectedLines : [],
    selectedStations:
      val.selectedStations && typeof val.selectedStations === "object"
        ? val.selectedStations
        : {},
  };
}

export function normalizeTransitFromSelector(val) {
  if (!val || typeof val !== "object") return null;

  return {
    nearTransit: val.nearTransit ?? null,
    selectedLines: Array.isArray(val.selectedLines) ? val.selectedLines : [],
    selectedStations:
      val.selectedStations && typeof val.selectedStations === "object"
        ? val.selectedStations
        : {},
  };
}
