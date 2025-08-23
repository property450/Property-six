import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "./ImageUpload";

export default function FloorPlanSelector({ floorPlans, setFloorPlans }) {
  const [floorCount, setFloorCount] = useState(1);

  const predefinedOptions = [1,2,3,4,5,6,7,8,9,10];

  // 当楼层数变化时，自动调整 floorPlans 数组长度
  useEffect(() => {
    const newPlans = [...floorPlans];
    if (floorCount > newPlans.length) {
      // 添加空位
      for (let i = newPlans.length; i < floorCount; i++) {
        newPlans.push(null);
      }
    } else if (floorCount < newPlans.length) {
      // 删除多余
      newPlans.length = floorCount;
    }
    setFloorPlans(newPlans);
  }, [floorCount]);

  const handleUpload = (index, url) => {
    const newPlans = [...floorPlans];
    newPlans[index] = url;
    setFloorPlans(newPlans);
  };

  return (
    <div className="space-y-3">
      <label className="font-medium">楼层数量</label>
      <div className="flex items-center gap-2">
        <select
          value={floorCount}
          onChange={(e) => setFloorCount(Number(e.target.value))}
          className="border rounded p-2"
        >
          {predefinedOptions.map((num) => (
            <option key={num} value={num}>{num} 层</option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="自定义楼层数"
          value={floorCount}
          onChange={(e) => setFloorCount(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: floorCount }).map((_, i) => (
          <div key={i} className="p-2 border rounded-lg">
            <p className="mb-2 font-semibold">第 {i + 1} 层 平面图</p>
            <ImageUpload
              value={floorPlans[i]}
              onUpload={(url) => handleUpload(i, url)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
