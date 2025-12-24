// factories/layoutFactory.js

export function createEmptyLayout() {
  return {
    _uiId: `layout_${Math.random().toString(36).slice(2)}_${Date.now()}`,

    // 基础字段
    layoutTitle: "",
    category: "",
    subType: [],
    tenure: "",
    usage: "",
    saleType: "",
    storeys: "",

    // 价格 & 面积
    price: { min: "", max: "" },
    area: {
      builtUpValue: "",
      builtUpUnit: "sq ft",
      landValue: "",
      landUnit: "sq ft",
    },

    // 房间
    bedroomCount: "",
    bathroomCount: "",
    carparkCount: "",
    storeRoomCount: "",

    // 多选
    extraSpaces: [],
    furniture: [],
    facilities: [],
    facing: [],

    // 交通
    walkToTransit: false,
    transitLines: [],
    transitStations: [],
    transitNotes: "",

    // 图片
    images: {},

    // 继承控制（用于复制/脱钩）
    _inheritCommon: {},

    // 其它
    description: "",
  };
}
