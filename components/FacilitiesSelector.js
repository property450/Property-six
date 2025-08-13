// components/FacilitiesSelector.js
import React, { useState } from "react";
import CreatableSelect from "react-select/creatable";

const facilitiesOptions = [
  // 基础设施/公共设施
  "电梯",
  "游泳池",
  "健身房",
  "桑拿房",
  "温泉",
  "公园",
  "游乐场",
  "烧烤区",
  "公用礼堂",
  "多功能厅",
  "社区俱乐部",
  "保安系统",
  "门禁系统",
  "访客停车场",
  "充电桩",

  // 运动设施
  "乒乓室",
  "桌球室",
  "篮球场",
  "羽毛球场",
  "网球场",
  "高尔夫球场",
  "水中健身区",
  "慢跑道",
  "室内篮球场",
  "壁球室",
  "攀岩墙",
  "滑板场",
  "轮滑区",
  "沙滩排球场",
  "保龄球馆",
  "自行车道",
  "儿童戏水区",
  "无边际泳池",
  "按摩池",
  "漂流河",
  "泳池酒吧",

  // 娱乐休闲
  "瑜伽室",
  "飞镖区",
  "烧烤凉亭",
  "露天影院",
  "棋牌室",
  "天际无边景观休息厅",
  "共享办公区",
  "卡拉OK房",
  "观影室",
  "游戏室",
  "图书馆",
  "儿童游戏室",
  "休息厅",

  // 生活配套
  "洗衣房",
  "小卖部 / 便利店",
  "咖啡厅",
  "花园",
  "绿化带",
  "宠物区",
  "智能家居系统",
  "储藏室",
  "快递柜 / 包裹柜",

  // 其他设施
  "医务室",
  "会议室",
  "商业区 / 商铺",
  "观景台",
  "天台花园",
  "电动门",

  // 家庭/儿童类
  "托儿所 / 幼儿园",
  "儿童学习区",
  "亲子活动室",

  // 其他配套
  "司机休息室",
  "洗车区",
  "垃圾收集系统",
  "雨水花园",
  "太阳能板",
  "急救站",
  "防风雨候车亭",
].map((label) => ({ value: label, label }));

export default function FacilitiesSelector({ value = [], onChange }) {
  const [selectedOptions, setSelectedOptions] = useState(
    value.map((v) => ({ value: v, label: v }))
  );

  const handleChange = (selected) => {
    setSelectedOptions(selected || []);
    onChange(selected ? selected.map((opt) => opt.value) : []);
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">设施</label>
      <CreatableSelect
        isMulti
        placeholder="选择或输入设施..."
        options={facilitiesOptions}
        value={selectedOptions}
        onChange={handleChange}
        formatCreateLabel={(inputValue) => `添加自定义: ${inputValue}`}
        closeMenuOnSelect={false} // ✅ 选中后不关闭
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />
    </div>
  );
}
  
