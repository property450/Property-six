// ✅ components/DistanceSelector.js
import { Slider } from '@/components/ui/slider';

export default function DistanceSelector({ distance, setDistance }) {
  return (
    <div className="p-2">
      <label className="block text-sm mb-1">搜索半径（公里）: {distance}km</label>
      <Slider
        min={1}
        max={50}
        step={1}
        value={[distance]}
        onValueChange={(val) => setDistance(val[0])}
      />
    </div>
  );
}
