import RoomCountSelector from "./RoomCountSelector";

...

{/* 卧室/浴室/厨房/客厅改为单输入框 */}
<RoomCountSelector
  label="卧室"
  value={data.rooms}
  onChange={(val) => handleChange("rooms", val)}
  singleInput={true} // ✅ 新增 prop 控制单输入框
/>

<RoomCountSelector
  label="浴室"
  value={data.bathrooms}
  onChange={(val) => handleChange("bathrooms", val)}
  singleInput={true}
/>

<RoomCountSelector
  label="厨房"
  value={data.kitchens}
  onChange={(val) => handleChange("kitchens", val)}
  singleInput={true}
/>

<RoomCountSelector
  label="客厅"
  value={data.livingRooms}
  onChange={(val) => handleChange("livingRooms", val)}
  singleInput={true}
/>
